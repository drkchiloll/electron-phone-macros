import { Promise } from 'bluebird';
import { Cucm } from './cucm';
import { EventEmitter } from 'events';
import { devAssQuery as associated } from '../components';

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
  reduceAddresses(addresses, phone: any): any {
    return Promise.reduce(addresses, (ph: any, ip: string) => {
      let temp = ip.replace('*', '');
      if(temp.substring(temp.length - 1) === '.') {
        // 10.253.* = 10.253
        temp = temp.replace(temp.substring(temp.length - 1), '');
      } // 10.25* = 10.25
      if(phone.ip.startsWith(temp)) {
        ph = phone;
        return ph;
      } else {
        return ph;
      }
    }, {});
  },
  reducePhones(phones, addresses) {
    return Promise.reduce(phones, (a: any[], phone: any) => {
      return this.reduceAddresses(addresses, phone).then(res => {
        if(Object.keys(res).length > 0) a.push(res);
        return a;
      });
    }, [])
  },
  queryHandler(cucm: Cucm, addresses, types, jtapi) {
    const { username } = cucm.profile;
    return Promise.map(addresses, (ip: string) => {
      return cucm.createRisDoc({ ip })
        .then(d => cucm.risquery({ body: d, modelNum: types }))
        .then((devices) => this.workEmitter.emit('device-update', cucm.models),
          err => this.workEmitter.emit('work-error'))
        .then(() => cucm.query(associated.replace('%user%', username), true))
        .then((associations: any[]) => {
          let devices = cucm.models;
          return Promise.reduce(Object.keys(devices), (a: any, type: string) => {
            return Promise.map(devices[type], (d: any) => {
              if(!associations.find(({ devicename }) => devicename === d.name)) {
                d['associated'] = false;
                this.workEmitter.emit('device-update', cucm.models);
                return d;
              } else {
                d['associated'] = true;
                return jtapi.getBackground(d.ip, d.model).then(bg => {
                  if(bg) d.img = `data:image/png;base64,` +
                    `${Buffer.from(bg).toString('base64')}`
                  this.workEmitter.emit('device-update', cucm.models);
                  return d;
                });
              }
            }).then(devices => {
              a[type] = devices;
              return a;
            })
          }, {}).then((phones) => {
            this.workEmitter.emit('dev-upcomplete', phones);
          })
        })
    })
  },
  emitter(evt: string, models) {
    this.workEmitter.emit(evt, models);
  },
  searchWork(params: any) {
    let { cucm, account, addresses, types, phones, jtapi } = params;
    let ipsToRemove = [];
    jtapi.account = account;
    // Do Any Phones Exist
    // Do Any Addresses Match a Phone Subnet
    return new Promise((res, rej) => {
      if(phones && Object.keys(phones).length > 0) {
        let types = Object.keys(phones);
        return Promise.reduce(types, (a:any, phType: string) => {
          return Promise.each(addresses, (ip: string, index) => {
            let partial = ip.replace('*', '');
            if(phones[phType].findIndex(({ip}) => ip === partial) > -1 ||
               phones[phType].findIndex(({ip}) => partial.startsWith(ip)) > -1) {
              if(a.indexOf(ip) === -1) a.push(ip);
              return;
            } else {
              return Promise.each(phones[phType], (p: any) => {
                let match = addresses.find(adr => {
                  if(p.ip.startsWith(adr.replace('*', '')) ||
                     p.ip === adr.replace('*', '')) {
                       return adr;
                  } else {
                    return undefined;
                  }
                })
                if(!match) {
                  if(!ipsToRemove.find((i: any) => p.ip === i.ip)) {
                    ipsToRemove.push(p);
                  }
                }
                return;
              });
            }
          }).then(() => a);
        }, []).then((addsToRemove) => res(addsToRemove));
      } else {
        res([]);
      }
    }).then((filteredAddresses: string[]) => {
      if(ipsToRemove.length > 0) {
        let clone = JSON.parse(JSON.stringify(cucm.models));
        return Promise.each(Object.keys(clone), (type) => {
          return Promise.each(clone[type], (d: any, index) => {
            let phone = ipsToRemove.find((ip: any) => ip.ip === d.ip);
            if(phone) {
              return Promise.filter(cucm.models[type], (ph: any) => {
                if(phone.ip !== ph.ip) return true;
                return false;
              }).then(results => {
                cucm.models[type] = results;
                return;
              })
            } else {
              return;
            }
          })
        }).then(() => this.emitter('dev-upcomplete', cucm.models));
      }
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
  }
}