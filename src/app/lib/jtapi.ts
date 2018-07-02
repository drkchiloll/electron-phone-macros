import * as java from 'java';
import { Promise } from 'bluebird';
import { join } from 'path';
import { EventEmitter } from 'events';
import { DOMParser } from 'xmldom';

// java.asyncOptions = {
//   asyncSuffix: undefined,
//   syncSuffix: '',
//   promiseSuffix: 'Promise',
//   promisify: Promise.promisify
// };

export class JTAPI {
  public account: any;
  private classes: string[] = [
    './dataterminal_11_0',
    './dataterminal_9_1_2',
    './dataterminal_8_5'
  ];
  private JtapiPeerFactory: any;
  private classpath: string;
  private provider: string;
  public Condition: any;
  public Arrays: any;
  public CiscoTerminal: any;
  constructor(account: any) {
    this.account = account;
    this.provider = `${account.host};login=${account.username}`+
      `;passwd=${account.password}`;
    this.classpath = account.version.startsWith('11') ?
      join(__dirname, this.classes[0]) :
      account.version.startsWith('9') ?
      join(__dirname, this.classes[1]) :
      account.version.startsWith('8') ?
      join(__dirname, this.classes[2]) :
      '';
    java.classpath.push(this.classpath);
    this.JtapiPeerFactory = java.import('javax.telephony.JtapiPeerFactory');
    this.Condition = java.import('com.cisco.cti.util.Condition');
    this.Arrays = java.import('java.util.Arrays');
    this.CiscoTerminal = java.import('DataTerminal');
  }

  private getProvider(provider, peer) {
    return new Promise((resolve, reject) => {
      peer.getProvider(provider, (err, jtapiProvider) =>
        resolve(jtapiProvider));
    });
  }

  getPeer() {
    // const JtapiPeerFactory = java.import('javax.telephony.JtapiPeerFactory');
    return new Promise((resolve, reject) => {
      this.JtapiPeerFactory.getJtapiPeer(null, (err, peer) => resolve(peer));
    });
  }

  connect() {
    return this.getPeer()
      .then(peer => this.getProvider(this.provider, peer));
  }

  createList(jtapiProvider) {
    const condition = new this.Condition();
    return new Promise((resolve, reject) => {
      java.callStaticMethod(
        'java.util.Arrays',
        'asList',
        jtapiProvider,
        condition,
        (err, list) => resolve(list)
      );
    })
  }
}

const bgdocHandler = ({account, background}) => {
  const doc = new DOMParser().parseFromString(background.xml);
  const imgEl: any = doc.getElementsByTagName('image')[0];
  imgEl.appendChild(
    doc.createTextNode(
      `http://${account.host}:6970${background.img}`
    )
  );
  const icnEl: any = doc.getElementsByTagName('icon')[0];
  icnEl.appendChild(
    doc.createTextNode(
      `http://${account.host}:6970${background.tn}`
    )
  );
  return doc.toString();
}

const exec = (terminal, dev, cmd) => {
  const timer = cmd.sequenceId === 1 ? 0 :
    cmd.name.includes('Pause') ? 3000 :
    cmd.sequenceId * 150;
  return new Promise((resolve, reject) => {
    setTimeout((term, d, xml) => {
      term.execAction([d, xml], (err, msg) => {
        setTimeout(() => {
          term.getResp((err, resp) => {
            resolve(resp);
          });
        }, 1500);
      });
    }, timer, terminal, dev, cmd.xml);
  });
};

export const jtapi = (() => {
  const service: any = {
    cti: null,
    runner: new EventEmitter(),
    devices: null,
    computeDevicesToPush({types, devices}) {
      return Promise.reduce(types, (a: any, type) => Promise.filter(
        devices, (d: any) => d.model === type).then(matches => {
          a = a.concat(matches);
          return a;
        }), []).then(d => d);
    },
    terminal(provider) {
      return this.cti.createList(provider)
        .then(list => new this.cti.CiscoTerminal(list));
    },
    macroRunner(cmds, d, provider) {
      return Promise.mapSeries(cmds, (cmd, indx) => {
        return this.terminal(provider).then(t => {
          return exec(t, d.deviceName, cmd).then(resp => {
            console.log(resp);
            if(indx === cmds.length-1) t.close();
            return resp;
          })
        })
      })
    },
    deviceRunner({cmds, provider, devices}) {
      return Promise.map(devices, (d: any) => {
        return this.macroRunner(cmds, d, provider, this);
      })
    },
    getProvider(cmds, d) {
      return this.cti.connect()
        .then(provider => ({ cmds, provider, devices: d }));
    },
    run({ account, macros, devices }) {
      this.cti = new JTAPI(account);
      return Promise.map(macros, (macro: any) => {
        // Map Through Types
        let compute = { types: macro.types, devices };
        return this.computeDevicesToPush(compute)
          .then(d => this.getProvider(macro.cmds, d)
          .then((results) => this.deviceRunner(results)))
      })
    }
  };
  return service;
})();