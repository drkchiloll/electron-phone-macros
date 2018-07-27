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
        .then(() => this.workEmitter.emit('device-update', cucm.models),
          err => this.workEmitter.emit('work-error'))
        .then(() => cucm.query(associated.replace('%user%', username), true))
        .then((associations: any[]) => {
          let devices = cucm.models;
          return Promise.reduce(Object.keys(devices), (a: any, type: string) => {
            return Promise.map(devices[type], (d: any) => {
              if(!associations.find(({ devicename }) => devicename === d.name)) {
                d['associated'] = false;
                return d;
              } else {
                d['associated'] = true;
                return jtapi.getBackground(d.ip, d.model).then(bg => {
                  if(bg) d.img = `data:image/png;base64,` +
                    `${Buffer.from(bg).toString('base64')}`
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
  searchWork(params: any) {
    const { account, addresses, types, phones, jtapi } = params;
    jtapi.account = account;
    // Do Any Phones Exist
    // Do Any Addresses Match a Phone Subnet
    return new Promise((resolve, reject) => {
      if(phones && Object.keys(phones).length > 0) {
        return Promise.reduce(Object.keys(phones), (a: any, type: any) => {
          return this.reducePhones(phones[type], addresses)
            .then(results => {
              if(results.length > 0) a[type] = results;
              return a;
            })
        }, {}).then(newPhones => resolve(newPhones));
      } else {
        resolve({});
      }
    }).then((newDevices: any) => {
      if(newDevices && Object.keys(newDevices).length > 0)
        this.workEmitter.emit('dev-complete', newDevices);
      const cucm = new Cucm({
        host: account.host,
        username: account.username,
        password: account.password,
        version: account.version
      });
      if(Object.keys(newDevices).length > 0) cucm.models = newDevices;
      return this.queryHandler(cucm, addresses, types, jtapi);
    })
  }
}