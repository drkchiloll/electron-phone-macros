__author__ = 'Sam Womack'
__version__ = '0.2.0_91'
__date__ = 'July 28, 2014'

from lxml import etree
from lxml.etree import tostring
from copy import deepcopy
import sys
import time
import requests
from sys import argv
from getpass import getpass

global axlurl,risurl,user,pwd,header,dp_dev,dp_ip,ph_header,status
dp_dev = {}
ip = raw_input('Please Enter CUCM IP/Hostname. $')
user = raw_input('Please enter Admin/EndUser ID. $')
pwd = getpass('Please enter your password. $')
status = 401
while status == 401:
    #ip = '10.255.62.10'
    #user = 'samwomack'
    #pwd = 'cisco,123'
    axlurl = 'https://%s:8443/axl/' % ip
    try:
        r = requests.get(axlurl,verify=False,auth=(user,pwd))
        if r.status_code == 401:
            print 'Bad UserName or Password.'
            user = raw_input('Please enter Admin/EndUser ID. $')
            pwd = getpass('Please enter your password. $')
            continue
        elif r.status_code == 200:
            status = 200
    except:
        ip = raw_input('Bad IP/Host. Reenter $')
        continue

risurl = 'https://%s:8443/realtimeservice/services/RisPort' % ip
header = {
          'Content-type' : 'text/xml',
          'SOAPAction' : 'CUCM:DB ver=9.1',
         }
ph_header = {'Content-type' : 'text/xml'}

def const_reqdoc(func,name,search,skip):
    ########################################################
    ## GET LIST of DEVICEPOOLS and Phones
    ########################################################
    soap_nsuri = 'http://schemas.xmlsoap.org/soap/envelope/'
    ax_nsuri = 'http://www.cisco.com/AXL/API/9.1'
    soap_ns = '{%s}' % soap_nsuri
    ax_ns = '{%s}' % ax_nsuri
    soap_nsmap = {
                  'soapenv' : soap_nsuri,
                  'ns' : ax_nsuri
                 }
    soapdreq = etree.Element(soap_ns+'Envelope', nsmap=soap_nsmap)
    soap_body = etree.SubElement(soapdreq, soap_ns+'Body')
    method_e = etree.SubElement(soap_body, ax_ns+func)
    skip_e = etree.SubElement(method_e, 'skip')
    skip_e.text = skip
    first_e = etree.SubElement(method_e, 'first')
    first_e.text = '100'
    search_e = etree.SubElement(method_e, 'searchCriteria')
    sename_e = etree.SubElement(search_e, name)
    sename_e.text = search
    retag_e = etree.SubElement(method_e, 'returnedTags')
    name_e = etree.SubElement(retag_e, 'name')
    if 'Name' in name:
        model_e = etree.SubElement(retag_e, 'model')

    #print etree.tostring(soapdreq, pretty_print=True)
    return soapdreq, skip_e
    ########################################################

def send_reqdoc(xmldoc):
    r = requests.post(axlurl,headers=header,verify=False,data=xmldoc, auth=(user,pwd))
    return etree.XML(r.content)

def get_dps(doc):
    name_e = etree.XPath('//name')
    name_e = name_e(doc)
    for name in name_e:
        dp_dev[name.text] = {}

def getdevfromdp():
    for dp in dp_dev:
        phone_e = 1
        incr = 0
        devs = {}
        while phone_e:
            soapdreq, skip_e = const_reqdoc('listPhone','devicePoolName',dp, str(incr))
            #print etree.tostring(soapdreq, pretty_print=True)
            liphone_doc = send_reqdoc(etree.tostring(soapdreq))
            #print etree.tostring(liphone_doc,pretty_print=True)
            phone_e = etree.XPath('//phone')
            try:
                phone_e = phone_e(liphone_doc)
                for ph_e in phone_e:
                    devname = ph_e[0].text
                    devtype = ph_e[1].text[6:]
                    #print devname + ' ' + devtype
                    if devname.startswith('SEP'):
                        if devtype in devs:
                            devs[devtype].append(devname)
                        else:
                            devs[devtype] = [devname]
                incr += 100
            except IndexError:
                print 'Break Loop'
        #print devs
        dp_dev[dp] = devs
        #print dp_dev

def cmdevsel():
    f = open('temp.xml', 'r')
    s = f.read()
    xml = etree.XML(s)
    #Get SelectItems Element
    sel_e = etree.XPath('//SelectItems')
    sel_e = sel_e(xml)[0]
    # print etree.tostring(xml, pretty_print=True)
    return xml, sel_e

def get_ipaddrs(dp,t,data):
    r = requests.post(risurl,headers=header,data=data,verify=False,auth=(user,pwd))
    ip_e = etree.XPath('//IpAddress')
    ip_e = ip_e(etree.XML(r.content))
    for ip_elem in ip_e:
        # print ip_elem.text
        # print ip_dic
        if t in ip_dic[dp]:
            ip_dic[dp][t].append(ip_elem.text)
        else:
            ip_dic[dp][t] = [ip_elem.text]

def callrisport():
    global ip_dic
    #############################################
    #Get the DOC and Element We'll Be Adding To
    xml, sel_e = cmdevsel()
    #############################################
    ip_dic = {}
    for dp in dp_dev:
        #print dp (DevicePool)
        ip_dic[dp] = {}
        for t in dp_dev[dp]:
            i = 0
            if t:
                for d in dp_dev[dp][t]:
                    it_e = etree.SubElement(sel_e, 'item')
                    item_e = etree.SubElement(it_e, 'Item')
                    item_e.text = d
                    i += 1
                    if i == 200:
                        xmlstr = etree.tostring(xml)
                        get_ipaddrs(dp,t,xmlstr)
                        #Recreate The Document
                        xml, sel_e = cmdevsel()
                        i = 0
                    elif dp_dev[dp][t].index(d) == len(dp_dev[dp][t]) - 1:
                        xmlstr = etree.tostring(xml)
                        print xmlstr
                        get_ipaddrs(dp,t,xmlstr)
                        xml, sel_e = cmdevsel()

def _legacyphpost(keylist,phip):
    key = 'XML'
    keynav = {key : []}
    for keypress in keylist:
        ph_nav = etree.Element('CiscoIPPhoneExecute')
        exeit_e = etree.SubElement(ph_nav, 'ExecuteItem')
        exeit_e.set('Priority','0')
        exeit_e.set('URL',keypress)
        phnavstr = etree.tostring(ph_nav,pretty_print=True)
        #print phnavstr
        keynav[key] = keynav[key]+[phnavstr]
    key_action = deepcopy(keynav)
    ph_url = 'http://%s/CGI/Execute' % phip
    counter = 0
    for xml in keynav[key]:
        key_press = {}
        key_press[key] = xml
        r = requests.post(ph_url,headers=ph_header,data=key_press,auth=(user,pwd))
        key_action[key].remove(xml)
        if(counter == 4):
            break
        counter += 1
    for i in range(1,3):
        counter = 1
        for action in key_action[key]:
            keyact = {}
            keyact[key] = action
            r = requests.post(ph_url,headers=ph_header,data=keyact,auth=(user,pwd))
            if counter != 3:
                time.sleep(50.0/1000.0)
            else:
                time.sleep(2)
            counter += 1
    ph_nav = None
    keynav = None
    key_action = None

def seventynineseries(phip):
    _79xx_keylist = ['Init:Settings','Key:Settings','Key:KeyPad4',
                     'Key:KeyPad5','Key:KeyPad2','Key:KeyPadStar',
                     'Key:KeyPadStar','Key:KeyPadPound','Key:Soft4',
                     'Key:Soft2']
    _legacyphpost(_79xx_keylist,phip)

def seventynineseventyseries(phip):
    _797x_keylist = ['Init:Settings','Key:Settings','Key:KeyPad4',
                     'Key:KeyPad5','Key:KeyPad2','Key:KeyPadStar',
                     'Key:KeyPadStar','Key:KeyPadPound','Key:Soft5',
                     'Key:Soft2']
    _legacyphpost(_797x_keylist,phip)

def _universal_phpost(keylist,phip,delay):
    #These Phones have a Similar Procedure Because They are Newer
    doc = etree.Element('CiscoIPPhoneExecute')
    exe_e = etree.SubElement(doc, 'ExecuteItem')
    keynav = {'XML' : []}
    for keypress in keylist:
        exe_e.set('URL',keypress)
        xmlstr = etree.tostring(doc,pretty_print=True)
        keynav['XML'] = keynav['XML']+[xmlstr]
    ph_url = 'http://%s/CGI/Execute' % phip
    print keynav
    counter = 0
    while counter < len(keynav['XML']):
        keypress = {}
        keypress['XML'] = keynav['XML'][counter]
        r = requests.post(ph_url,headers=ph_header,data=keypress,auth=(user,pwd))
        counter+=1
        time.sleep(delay)

def seventyeightseries(phip):
    _78xx_keylist = ['Key:Settings','Key:KeyPad4',
                     'Key:Soft4','Key:Soft2']
    _universal_phpost(_78xx_keylist, phip, 0)

def eightynineseries(phip):
    _894x_keylist = ['Key:Applications','Key:KeyPad4',
                     'Key:KeyPad4','Key:KeyPad3',
                     'Key:Soft3','Key:Soft1']
    _universal_phpost(_894x_keylist, phip, 0)

def ninetynineseries(phip):
    _99xx_keylist = ['Key:Settings','Key:Applications','Key:KeyPad4',
                     'Key:KeyPad4','Key:KeyPad4','Key:Soft3','Key:Soft1']
    _universal_phpost(_99xx_keylist, phip, 1)

# def eightyninesixtyone(phip):
#     _8961_keylist = ['Key:Settings','Key:Applications','Key:KeyPad4',
#                      'Key:KeyPad4','Key:KeyPad4','Key:Soft3','Key:Soft1']
#     _universal_phpost(_8961_keylist, phip, 1)

def sixtyninefourtyseries(phip):
    _694x_keylist = ['Key:Settings','Key:KeyPad4','Key:KeyPad4',
                     'Key:Soft4','Key:Soft2','Key:Soft1','Key:Soft1',
                     'Key:Soft1']
    _universal_phpost(_694x_keylist, phip, 1)

def sixtyninetwentyseries(phip):
    _692x_keylist = ['Key:Settings','Key:KeyPad4','Key:KeyPad5',
                     'Key:Soft4','Key:Soft2','Key:Soft1','Key:Soft1',
                     'Key:Soft1']
    _universal_phpost(_692x_keylist, phip, 1)

def start_itlproc():
    for dp in ip_dic:
        for phtype in ip_dic[dp]:
            print 'Removing ITL from %s\'s in DP %s.' % (phtype, dp)
            for phip in ip_dic[dp][phtype]:
                if '7937' in phtype:
                    continue
                if '797' in phtype:
                    #continue
                    seventynineseventyseries(phip)
                if '79' in phtype:
                    #continue
                    seventynineseries(phip)
                if '78' in phtype:
                    #continue
                    seventyeightseries(phip)
                if '894' in phtype:
                    #continue
                    eightynineseries(phip)
                if '8961' in phtype:
                    #continue
                    eightyninesixtyone(phip)
                if '99' in phtype or '8961' in phtype:
                    #continue
                    ninetynineseries(phip)
                if '694' in phtype:
                    #continue
                    sixtyninefourtyseries(phip)
                if '692' in phtype:
                    #continue
                    sixtyninetwentyseries(phip)

def main():
    dpnames = []
    try:
        if argv[1]:
            dpnames.append(argv[1])
        if argv[2]:
            dpnames.append(argv[2])
        if argv[3]:
            dpnames.append(argv[3])
        if argv[4]:
            dpnames.append(argv[4])
        if argv[5]:
            dpnames.append(argv[5])
    except IndexError:
        print '',
    ########################################################
    ## GET List Of Device Pools
    ########################################################
    if not dpnames:
        print 'Get List of All DevicePools on the system.'
        soapdreq, skip_e = const_reqdoc('listDevicePool','name','%','0')
        xmlresp = send_reqdoc(etree.tostring(soapdreq))
        get_dps(xmlresp)
        #dp_ip = deep_copy(dp_dev)
    else:
        for dp in dpnames:
            dp_dev[dp] = {}
    print 'Getting appropriate phones from Device Pools.'
    getdevfromdp()
    # print dp_dev
    print 'Getting all captured devices IP Address.'
    callrisport()
    # print ip_dic
    # print 'Deletion of ITL in progress. Please Standby.'
    # start_itlproc()
    # print 'ITL Deletion Process Complete.'

if __name__ == '__main__':
  main()
