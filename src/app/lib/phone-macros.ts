import { req } from './requests';
import { DOMParser, DOMImplementation as builder } from 'xmldom';
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
      }, {// Hold for 69/89/99
        name: 'FixedFeature3',
        displayName: 'Hold Key for 69/89/9900 Series Phones'
      }, {
        name: 'Settings',
        displayName: 'Press Settings Key'
      }, {
        name: 'NavUp',
        displayName: 'Navigate Up',
      }, {
        name: 'NavDwn',
        displayName: 'Navigate Down',
      }, {
        name: 'NavLeft',
        displayName: 'Navigate Left'
      }, {
        name: 'NavRight',
        displayName: 'Navigate Right'
      }, {
        name: 'NavSelect',
        displayName: 'Navigate Select Button'
      }, {
        name: 'Pause',
        displayName: 'Pause'
      }],
      init: {
        name: 'Services',
        displayName: 'Init: Clears Display (out of Menus etc)'
      },
      dial: {
        name: 'Dial',
        displayName: 'Dial:'
      },
      sendDigits: {
        name: 'SendDigits',
        displayName: 'SendDigits:'
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
          return keys.concat([{
            type: 'init', ...this.cmds.init
          }, {
            type: 'dial', ...this.cmds.dial
          }]);
        case '7900':
          keys = this.cmds.keys
            .filter((c: any) =>
              c.name !== 'Applications')
            .map(c => {
              c['type'] = 'key'
              return c;
            });
          keys.push({
            name: '7900-StarStarPound',
            displayName: 'Unlock Key Sequence (**#)',
            type: 'key'
          })
          keys.push({
            name: '7900-ResetPhone',
            displayName: 'Reset Phone (**#**)',
            type: 'key'
          });
          keys.push({ type: 'dial', ...this.cmds.dial});
          return keys;
        case '7800':
          keys = this.cmds.keys
            .filter((c: any) =>
              c.name !== 'Soft5')
            .map(c => {
              c['type'] = 'key'
              return c;
            });
          keys.push({type: 'dial', ...this.cmds.dial});
          return keys;
        case '8800':
          keys = this.cmds.keys
            .map(c => {
              c['type'] = 'key'
              return c;
            });
          keys.push({
            name: 'Reset',
            displayName: 'Reset Security. Settings: Soft3/1/1 (8800/8900/9900)',
            type: 'key'
          });
          keys.push({
            name: 'Reset 8831',
            displayName: 'Reset Security Settings: Soft4/2 (8831)',
            type: 'key'
          })
          keys.push({ type: 'dial', ...this.cmds.dial });
          keys.push({type: 'dial', ...this.cmds.sendDigits});
          keys.push({ type: 'init', ...this.cmds.init });
          return keys;
        case '8900':
        case '9900':
          keys = this.cmds.keys
            .filter((c: any) =>
              name !== 'Directories' &&
              name !== 'Hold')
            .map(c => {
              c['type'] = 'key'
              return c;
            });
          keys.push({
            name: 'Reset',
            displayName: 'Reset Security. Settings: Soft3/1/1 (8800/8900/9900)',
            type: 'key'
          });
          keys.push({ type: 'dial', ...this.cmds.dial });
          keys.push({ type: 'dial', ...this.cmds.sendDigits });
          return keys;
      }
    },
    docBuilderHelper(doc, element, cmd) {
      const el = doc.createElement('ExecuteItem');
      if(cmd.includes('Key:')) {
        cmd = cmd.replace('Key:', '');
        el.setAttribute('URL', `Key:${cmd}`);
      } else if(cmd.includes('Init:') ||
        cmd.includes('Dial') || cmd.includes('Send')
      ) {
        el.setAttribute('URL', cmd);
      } else {
        el.setAttribute('URL', `Key:${cmd}`);
      }
      element.appendChild(el);
    },
    generateXml(cmd) {
      console.log(cmd);
      const d = (new builder()).createDocument(null, null, null),
        el1: Element = d.createElement('CiscoIPPhoneExecute');
      d.appendChild(
        d.createProcessingInstruction(
          'xml', 'version="1.0" encoding="utf-8" standalone="yes"'
        )
      );
      if(cmd.name === 'Key:Reset') {
        ['Soft3', 'Soft1', 'Soft1'].forEach(c =>
          this.docBuilderHelper(d, el1, c));
      } else if(cmd.name === 'Key:Reset 8831') {
        ['Soft4', 'Soft2'].forEach(c =>
          this.docBuilderHelper(d, el1, c));
      } else if(cmd.name === 'Key:7900-StarStarPound') {
        ['KeyPadStar', 'KeyPadStar', 'KeyPadPound'].forEach(c =>
          this.docBuilderHelper(d, el1, c))
      } else if(cmd.name === 'Key:7900-ResetPhone') {
        ['KeyPadStar','KeyPadStar','KeyPadPound','KeyPadStar','KeyPadStar']
          .forEach(c => this.docBuilderHelper(d, el1, c));
      } else {
        this.docBuilderHelper(d, el1, cmd.name);
      }
      d.appendChild(el1);
      return d.toString();
    },
    saveMacro(macro) {
      // Generate XML
      let { cmds } = macro;
      return Promise.map(cmds, (c: any) => {
        c['xml'] = this.generateXml(c);
        return c;
      }).then(commands => {
        macro['cmds'] = commands;
        if(macro._id) {
          return macroDb.update(macro);
        } else {
          return macroDb.add(macro);
        }
      })
    },
    cmdHelper(params: any) {
      let { selected, list, macro, desc } = params;
      let mcmd = JSON.parse(JSON.stringify(list.find(c =>
        c.displayName === selected || c.name === selected)));
      mcmd['description'] = desc;
      if(mcmd.name.includes('Send') || mcmd.name.includes('Dial')) {
        mcmd.name = selected;
      } else {
        mcmd.name = `${mcmd.type === 'key' ? 'Key:' : 'Init:'}` + mcmd.name;
      }
      mcmd.xml = this.generateXml(mcmd);
      if(macro.cmds.find(c => c.editing)) {
        mcmd['editing'] = false;
        const index = macro.cmds.findIndex(c => c.editing);
        mcmd['sequenceId'] = index + 1;
        macro.cmds[index] = mcmd;
      } else {
        mcmd['sequenceId'] = macro.cmds.length + 1;
        macro.cmds.push(mcmd);
      }
      return macro;
    }
  };
})();
