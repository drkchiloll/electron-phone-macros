import { req } from './requests';
import { DOMParser, DOMImplementation } from 'xmldom';
import * as xpath from 'xpath';
import { Promise } from 'bluebird';
import { macroDb } from './macro-db';

export const phone = (() => {
  return {
    paths: {
      thumb: '//ImageItem/@Image',
      image: '//ImageItem/@URL'
    },
    devices: {
      6900: ['6921', '6941', '6945', '6961'],
      7800: ['7811', '7821', '7841', '7861'],
      7900: [
        '7941',
        '7942',
        '7945',
        '7961',
        '7962',
        '7965',
        '7970',
        '7971',
        '7975'
      ],
      8800: [
        '8811',
        '8841',
        '8845',
        '8851',
        '8861',
        '8865',
        '8831',
        '8832'
      ],
      8900: ['8941', '8945', '8961'],
      9900: ['9951', '9971']
    },
    itl() {
      return [{
        type: '8800',
        sequence: [
          'Key:Applications',
          'Key:KeyPad6',
          'Key:KeyPad4',
          'Key:KeyPad5',
          'Key:Soft3',
          'Key:Soft1',
          'Key:Soft1'
        ]
      }, {
        type: '8811',
        sequence: [
          'Key:Applications',
          'Key:KeyPad5',
          'Key:KeyPad4',
          'Key:KeyPad5',
          'Key:Soft3',
          'Key:Soft1',
          'Key:Soft1'
        ]
      }, {
        type: '8831',
        sequence: [
          'Init:Services',
          'Key:Soft3',
          'Key:KeyPad4',
          'Key:KeyPad4',
          'Key:Soft4',
          'Key:Soft2'
        ]
      }]
    },
    backgrounds() {
      return [{
        types: ['7941', '7942', '7961', '7962'],
        folder: '320x196x4'
      }, {
        types: ['7945', '7965'],
        folder: '320x212x16'
      }, {
        types: ['7970', '7971'],
        folder: '320x212x12'
      }, {
        types: ['7975'],
        folder: '320x216x16'
      }, {
        types: ['8941', '8945', '9951', '9971'],
        folder: '640x480x24'
      }, {
        types: ['8800'],
        folder: '800x480x24'
      }];
    },
    backgroundSearch({ host, path }) {
      const baseURL = `http://${host}:6970`;
      return req.get({
        url: baseURL + `/Desktops/${path}/List.xml`,
        method: 'get'
      }).then(({data}: any) => {
        if(!data) return null;
        const doc = new DOMParser().parseFromString(data);
        const thumbs: any = xpath.select(this.paths.thumb, doc);
        const images = xpath.select(this.paths.image, doc);
        return Promise.map(images, (img: any, i) => ({
          tn: thumbs[i].value.replace('TFTP:', '/'),
          image: img.value.replace('TFTP:', '/'),
          name: img.value.match(/\/\S+\/(\S+\.png)/)[1]
        }));
      }).then(backgrounds => {
        if(!backgrounds) return null;
        return Promise.map(backgrounds, (bg: any) => {
          return this.getBackground({
            url: baseURL + bg.tn
          }).then(img => {
            if(!img) bg.imgPreview = 'not found';
            else bg.imgPreview = img;
            return bg;
          });
        })
      })
    },
    getBackground({url}) {
      return req.get({
        url,
        method: 'get',
        responseType: 'arraybuffer'
      }).then(resp => resp.data);
    },
    cmds: {
      keys: [{
        name: 'Applications',
        displayName: 'Press the Applications Key'
      }, {
        name: 'KeyPad0',
        displayName: 'Press the 0 key'
      }, {
        name: 'KeyPad1',
        displayName: 'Press the 1 key'
      }, {
        name: 'KeyPad2',
        displayName: 'Press the 2 key'
      }, {
        name: 'KeyPad3',
        displayName: 'Press the 3 key'
      }, {
        name: 'KeyPad4',
        displayName: 'Press the 4 key'
      }, {
        name: 'KeyPad5',
        displayName: 'Press the 5 key'
      }, {
        name: 'KeyPad6',
        displayName: 'Press the 6 key'
      }, {
        name: 'KeyPad7',
        displayName: 'Press the 7 key'
      }, {
        name: 'KeyPad8',
        displayName: 'Press the 8 key'
      }, {
        name: 'KeyPad9',
        displayName: 'Press the 9 key'
      }, {
        name: 'KeyPadPound',
        displayName: 'Press the # key'
      }, {
        name: 'KeyPadStar',
        displayName: 'Press the * key'
      }, {
        name: 'Soft1',
        displayName: 'Press SoftKey 1'
      }, {
        name: 'Soft2',
        displayName: 'Press SoftKey 2'
      }, {
        name: 'Soft3',
        displayName: 'Press SoftKey 3'
      }, {
        name: 'Soft4',
        displayName: 'Press SoftKey 4'
      }, {
        name: 'Soft5',
        displayName: 'Press SoftKey 5'
      }, {
        name: 'Speaker',
        displayName: 'Press Speaker Button'
      }, {
        name: 'VolUp',
        displayName: 'Press Volume Up'
      }, {
        name: 'VolDwn',
        displayName: 'Press Volume Down'
      }, {
        name: 'Hold',
        displayName: 'Press Hold Button'
      }, {
        name: 'Directories',
        displayName: 'Press Directories Key'
      }, {
        name: 'Mute',
        displayName: 'Press Mute Key'
      }, {
        name: 'Onhook',
        displayName: 'Press Onhook Key'
      }, {
        name: 'Offhook',
        displayName: 'Press Offhook Key'
      }, {// Hold for 69/89/99
        name: 'FixedFeature3',
        displayName: 'Hold Key for 69/89/9900 Series Phones'
      }, {
        name: 'Settings',
        displayName: 'Press Settings Key'
      }],
      init: {
        name: 'Services',
        displayName: 'Init: Clears Display (out of Menus etc)'
      }
    },
    commands(deviceType) {
      let keys: any;
      switch(deviceType) {
        case '6900':
          keys = this.cmds.keys
            .filter((c: any) =>
              c.name !== 'Applications' &&
              c.name !== 'Hold' &&
              c.name !== 'Directories')
            .map(c => {
              c['type'] = 'key'
              return c;
            });
          return keys.concat([{ type: 'init', ...this.cmds.init }]);
        case '7900':
          keys = this.cmds.keys
            .filter((c: any) =>
              c.name !== 'Applications' &&
              c.name !== 'Onhook' &&
              c.name !== 'Offhook')
            .map(c => {
              c['type'] = 'key'
              return c;
            });
          return keys.concat([{ type: 'init', ...this.cmds.init }]);
        case '7800':
          return this.cmds.keys
            .filter((c: any) =>
              c.name !== 'Onhook' &&
              c.name !== 'Offhook' &&
              c.name !== 'Soft5')
            .map(c => {
              c['type'] = 'key'
              return c;
            });
        case '8800':
          return this.cmds.keys
            .filter((c: any) => 
              c.name !== 'Onhook' &&
              c.name !== 'Offhook')
            .map(c => {
              c['type'] = 'key'
              return c;
            });
        case '8900':
        case '9900':
          return this.cmds.keys
            .filter((c: any) =>
              name !== 'Directories' &&
              name !== 'Hold' &&
              name !== 'Onhook' &&
              name !== 'Offhook')
            .map(c => {
              c['type'] = 'key'
              return c;
            });
      }
    },
    bgXmlBuilder() {
      let d: any = (new DOMImplementation()).createDocument('', '', null);
      let setEl = d.createElement('setBackground'),
        bgEl = d.createElement('background'),
        imgEl = d.createElement('image'),
        icnEl = d.createElement('icon');
      bgEl.appendChild(imgEl);
      bgEl.appendChild(icnEl);
      setEl.appendChild(bgEl);
      return d.toString();
    },
    saveBgMacro(devices) {
      let macro: any = {
        name: 'Backgrounds',
        jobs: []
      };
      macro.jobs = devices.reduce((a: any[], dev: any) => {
        if(dev.selectedImg) {
          a.push({
            types: dev.types,
            background: {
              tn: dev.backgrounds[dev.selectedIndx].tn,
              img: dev.backgrounds[dev.selectedIndx].image,
              imagePreview: dev.backgrounds[dev.selectedIndx].imgPreview,
              xml: this.bgXmlBuilder()
            }
          });
        }
        return a;
      }, []);
      console.log(macro.jobs);
    },
    saveMacro(macro) {
      // Generate XML
      let { cmds } = macro;
      return Promise.map(cmds, (c: any) => {
        let d: any = (new DOMImplementation()).createDocument('', '', null);
        let el1: Element = d.createElement('CiscoIPPhoneExecute'),
          el2: Element = d.createElement('ExecuteItem');
        el2.setAttribute('URL', c.name);
        el1.appendChild(el2);
        d.appendChild(el1);
        console.log(d.toString());
        c['xml'] = d.toString();
        return c;
      }).then(commands => {
        macro['cmds'] = commands;
        if(macro._id) {
          return macroDb.update(macro);
        } else {
          return macroDb.add(macro);
        }
      })
    }
  };
})();
