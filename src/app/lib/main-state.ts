import { Promise } from 'bluebird';
import { Cucm } from './cucm';
import { EventEmitter } from 'events';
import {
  devAssQuery as associated,
  updDevAssoc as updateAssociated,
} from '../components';
import { writeFile } from 'fs';
import { join } from 'path';
import * as J2V from 'json2csv';
const J2VParser = J2V.Parser;

export const mainState = {
  workEmitter: new EventEmitter(),
  init() {
    return {
      ipAddresses: [''],
      account: null,
      searchLabel: 'Search',
      devices: null,
      modelNum: null,
      job: 'Select Job(s) to Run:',
      macros: [],
      selectedMacros: [],
      selectedDevices: [],
      devicesWithImages: [],
      executeJobLabel: 'Execute Job',
      openDoc: false,
      docx: null
    }
  },
  afterJobReset() {
    return {
      devices: null,
      job: 'Select Job(s) to Run:',
      selectedMacros: [],
      selectedDevices: [],
      openDoc: false,
      docx: null,
      ipAddresses: ['']
    }
  },
  gridHeight(model) {
    switch(model) {
      case '8811':
      case '8841':
      case '8851':
      case '8861':
      case '8845':
      case '8865':
      case '7941':
      case '7942':
      case '7945':
      case '7961':
      case '7962':
      case '7965':
      case '7970':
      case '7971':
      case '7975':
      case '8961':
      case '9951':
      case '9971':
        return 225;
      case '8831':
      case '8832':
        return 128;
      case '7821':
      case '7841':
      case '7861':
      case '6945':
      case '6961':
        return 162;
        break;
      case '6921':
        return 81;
        break;
      default:
        return 225;
    }
  },
  iterateAddresses({cucm, phones, type, addrs, a}): any {
    let removeDevices = false;
    return Promise.each(addrs, (ip: string, indx) => {
      let part = ip.replace('*', '');
      const ipMatch = phones[type].findIndex(d => d.ip === part),
        startMatch = phones[type].findIndex(d => part.startsWith(d.ip));
      if(ipMatch > -1 || startMatch > -1) {
        if(a.indexOf(ip) === -1) a.push(ip);
        return;
      } else {
        // Remove Devices from View
        return Promise.each(phones[type], (p: any) => {
          let match = addrs.find(addr => {
            const m1 = p.ip.startsWith(addr.replace('*', '')),
              m2 = p.ip === addr.replace('*', '');
            if(m1 || m2) return addr;
            else return undefined;
          });
          if(!match) {
            let typeindex = cucm.models[type].findIndex(t => t.ip === p.ip);
            if(typeindex !== -1) {
              cucm.models[type].splice(typeindex, 1);
              removeDevices = true;
            }
          }
        }).then(() => ({
          addressesToRemove: a,
          removeDevices
        }))
      }
    })
  },
  reducePhones({types, phones, addresses, cucm}) {
    let deviceRemoval = false;
    return Promise.reduce(types, (a:any, type: string) => {
      return this.iterateAddresses({
        cucm,
        phones,
        type,
        addrs: addresses,
        a
      }).then(({ addressesToRemove, removeDevices }) => {
        a.concat(addressesToRemove);
        if(removeDevices) deviceRemoval = true;
        return a;
      })
    }, []).then(addsToRemove => ({ addsToRemove, deviceRemoval }));
  },
  queryHandler(cucm: Cucm, addresses, types, jtapi) {
    const { username } = cucm.profile;
    return Promise.map(addresses, (ip: string) => {
      return cucm.createRisDoc({ ip })
        .then(d => {
          return cucm.risquery({ body: d, modelNum: types })
        })
        .then((devices) => this.workEmitter.emit('device-update', cucm.models),
          err => this.workEmitter.emit('work-error'))
        .then(() => cucm.query(associated.replace('%user%', username), true))
        .then((associations: any[]) => {
          let devices = cucm.models;
          if(devices && Object.keys(devices).length > 0) {
            return Promise.reduce(Object.keys(devices), (a: any, type: string) => {
              return Promise.map(devices[type], (d: any) => {
                if(!associations.find(({ devicename }) => devicename === d.name)) {
                  let update = updateAssociated
                    .replace('%userid%', username)
                    .replace('%devicename%', d.name);
                  return cucm.query(
                    update,
                    false
                  ).then(result => {
                    d['associated'] = true;
                    return jtapi.getBackground(d.ip, d.model).then(bg => {
                      if(bg) d.img = `data:image/png;base64,` +
                        `${Buffer.from(bg).toString('base64')}`
                      this.workEmitter.emit('device-update', devices);
                      return d;
                    });
                  })
                } else {
                  d['associated'] = true;
                  return jtapi.getBackground(d.ip, d.model).then(bg => {
                    if(bg) d.img = `data:image/png;base64,` +
                      `${Buffer.from(bg).toString('base64')}`
                    this.workEmitter.emit('device-update', devices);
                    return d;
                  });
                }
              }).then(devices => {
                a[type] = devices;
                return a;
              })
            }, {}).then((phones) => {
              this.workEmitter.emit('dev-upcomplete', phones);
            });
          }
        })
    })
  },
  emitter(evt: string, models) {
    this.workEmitter.emit(evt, models);
  },
  searchWork(params: any) {
    let { cucm, account, addresses, types, phones, jtapi } = params;
    let ipsToRemove = false;
    jtapi.account = account;
    // Do Any Phones Exist
    // Do Any Addresses Match a Phone Subnet
    if(addresses.length === 0) {
      cucm.models = null;
      this.workEmitter.emit('dev-upcomplete', cucm.models);
      return;
    }
    return new Promise((res, rej) => {
      if(phones && Object.keys(phones).length > 0) {
        let phTypes = Object.keys(phones);
        return this.reducePhones({
          cucm, types: phTypes, phones, addresses
        }).then(({ addsToRemove, deviceRemoval}) => {
          ipsToRemove = deviceRemoval;
          res(addsToRemove);
        });
      } else {
        res([]);
      }
    }).then((filteredAddresses: string[]) => {
      if(ipsToRemove) {
        this.emitter('dev-upcomplete', cucm.models);
      }
      // console.log(filteredAddresses)
      if(filteredAddresses.length > 0) {
        return Promise.filter(addresses, (a: string) => {
          if(filteredAddresses.findIndex(adrs => adrs === a) === -1) return true;
          return false;
        }).then((newadrses) => {
          if(newadrses.length === 0)
            return this.emitter('dev-upcomplete', cucm.models);
          return this.queryHandler(cucm, newadrses, types, jtapi);
        })
      } else {
        if(addresses.length === 0) this.emitter('dev-upcomplete', cucm.models);
        return this.queryHandler(cucm, addresses, types, jtapi);
      }
    })
  },
  clean(devices) {
    return Object.keys(devices).reduce((a: any, type: string) => {
      if(devices[type].length === 0) return a;
      devices[type].forEach(({name, ip, dn, model, firmware}: any) => {
        a.push({ name, ip, dn, model, firmware });
      });
      return a;
    }, []);
  },
  createCsv(devices, done) {
    const fields = [{
      label: 'DeviceName',
      value: 'name'
    }, {
      label: 'Description',
      value: 'description'
    }, {
      label: 'Status',
      value: 'status'
    }, {
      label: 'IP Addresses',
      value: 'ip'
    }, {
      label: 'Directory Number',
      value: 'dn'
    }, {
      label: 'Phone Model',
      value: 'model'
    }, {
      label: 'User',
      value: 'user'
    }, {
      label: 'CurrentFirmware',
      value: 'firmware'
    }];
    let registered = devices;
    const j2vp = new J2VParser({ fields });
    const csv = j2vp.parse(registered);
    writeFile(join(__dirname, './registered.csv'), csv, 'utf-8', err => {
      done(join(__dirname, './registered.csv'));
    })
  }
}