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
      }, {
        name: 'Pause3',
        displayName: 'Pause for 3 Seconds'
      }, { name: 'NavUp',
        displayName: 'Navigate Up',
      }, {
        name: 'NavDwn',
        displayName: 'Navigate Down',
      }, {
        name: 'NavSelect',
        displayName: 'Navigate Select Button'
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
          keys = this.cmds.keys
            .filter((c: any) => 
              c.name !== 'Onhook' &&
              c.name !== 'Offhook')
            .map(c => {
              c['type'] = 'key'
              return c;
            });
          return keys.concat([{
            name: 'NavLeft',
            displayName: 'Navigate Left',
            type: 'key'
          }, {
            name: 'NavRight',
            displayName: 'Navigate Right',
            type: 'key'
          }])
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
    saveBgMacro(devices) {
      let macro: any = {
        name: 'Bulk Background Change',
        jobs: [],
        types: []
      };
      macro.jobs = devices.reduce((a: any[], dev: any) => {
        if(dev.selectedImg) {
          macro.types = macro.types.concat(dev.types);
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
      return macroDb.add(macro);
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
