import * as java from 'java';
import { Promise } from 'bluebird';
import { RisQuery as ris } from 'cucm-risdevice-query';
import { join } from 'path';
import { EventEmitter } from 'events';
import { DOMParser } from 'xmldom';
import { req } from './requests';
export class JTAPI {
  public account: any;
  private classes: string[] = [
    './java/dataterminal_11.0.jar',
    './java/dataterminal_9.1.2.jar',
    './java/dataterminal_8.5.jar'
  ];
  private JtapiPeerFactory: any;
  private classpath: string;
  private provider: string;
  public Condition: any;
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

export const jtapi = (() => {
  const service: any = {
    cti: null,
    account: null,
    runner: new EventEmitter(),
    execMacro(terminal, dev, cmd) {
      if(cmd.name.includes('Pause')) {
        const timer = parseInt(cmd.name.replace('Key:Pause','') + '000', 10);
        console.log(timer);
        return new Promise((resolve, reject) =>
          setTimeout(() => resolve('done'), timer));
      } else {
        return new Promise((resolve, reject) => {
          setTimeout((term, d, c) => {
            term.execAction([d.deviceName, c.xml], (err, msg) => {
              setTimeout(() => {
                term.getResp((err, resp) => {
                  resolve(resp);
                });
              }, 1000);
            });
          }, 0, terminal, dev, cmd);
        });
      }
    },
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
    getBackground(ip) {
      let url = `http://${ip}/CGI/Screenshot`;
      let { username, password } = this.account;
      return req.get({
        url,
        method: 'get',
        responseType: 'arraybuffer',
        auth: { username, password }
      }).then(({ data }) => data).catch(() => null);
    },
    updateEmitter(event, d, cmd, resp) {
      let { username, password } = this.account;
      const url = `http://${d.ip}/CGI/Screenshot`;
      let update: any = {
        device: d,
        cmd: cmd ? cmd.name : undefined,
        responseMessage: resp || undefined
      };
      return this.getBackground(d.ip).then(img => {
        if(img) update['img'] = img;
        this.runner.emit(event, update);
        return;
      });
    },
    macroRunner(cmds, d, provider) {
      return Promise.mapSeries(cmds, (cmd: any, indx) => {
        return this.terminal(provider).then(t => {
          return this.execMacro(t, d, cmd).then(resp => {
            this.updateEmitter('update', d, cmd, resp)
            if(indx === cmds.length - 1) {
              setTimeout(() => {
                this.updateEmitter('update-end', d, cmd, resp);
              }, 3000);
              t.close();
            }
            return;
          });
        });
      });
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
      this.account = account;
      return Promise.map(macros, (macro: any) => {
        // Map Through Types
        let compute = { types: macro.types, devices };
        return this.computeDevicesToPush(compute)
          .then(d => this.getProvider(macro.cmds, d)
          .then(results => this.deviceRunner(results)))
      })
    },
    deviceQuery({ account, devices }) {
      this.account = account;
      const risDoc = ris.createRisDoc({
        version: account.version,
        query: devices
      });
      let device: any;
      return req.get({
        url: `https://${account.host}:8443${ris.risPath}`,
        data: risDoc,
        method: 'post',
        headers: { 'Content-Type': 'text/xml' },
        auth: { username: account.username, password: account.password }
      }).then(({ data }) => {
        device = ris.parseResponse(data)[0];
        return this.getBackground(device.ip).then(img => {
          device['img'] = img;
          return device;
        });
      });
    },
    runSingle({ account, macro, device }) {
      device['deviceName'] = device.name;
      this.cti = new JTAPI(account);
      this.account = account;
      const { cmds } = macro;
      const { deviceName } = device;
      return this.cti.connect().then(provider => {
          return Promise.mapSeries(cmds, (c: any, idx) => {
            return this.terminal(provider).then(t => {
              return this.execMacro(t, device, c).then(resp => {
                return this.updateEmitter('update', device, c, resp)
                  .then(() => {
                    if(idx === cmds.length - 1) {
                      this.runner.emit('update-end');
                      this.runner.removeAllListeners('update');
                      this.runner.removeAllListeners('update-end');
                      t.close();
                    }
                    return;
                  })
                // this.runner.emit('update', c);
              })
            })
          })
        })
    }
  };
  return service;
})();