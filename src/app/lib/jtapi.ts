import * as java from 'java';
import { Promise } from 'bluebird';
import { RisQuery as ris } from 'cucm-risdevice-query';
import { join } from 'path';
import { unlink, writeFile } from 'fs';
import { EventEmitter } from 'events';
import { req } from './requests';
import { errorLog } from '../services/logger';
import { ModelEnum } from './model-db';
import { moment } from '../components';
import { DocBuilder } from './doc-builder';
import { phone } from './phone-macros';

export class JTAPI {
  public account: any;
  private classes: string[] = [
    './java/phoneterm_11_5.jar',
    './java/phoneterm_9.1.2.jar',
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
    this.classpath = account.version.startsWith('12') ||
      account.version.startsWith('11')  ?
        join(__dirname, this.classes[0]) :
      account.version.startsWith('9') ||
      account.version.startsWith('10') ?
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
      peer.getProvider(provider, (err, jtapiProvider) => {
        if(err) errorLog.log('error', 'JTAPI Provider Error', { err });
        resolve(jtapiProvider)
      })
    });
  }

  getPeer() {
    return new Promise((resolve, reject) => {
      this.JtapiPeerFactory
        .getJtapiPeer(null, (err, peer) => {
          if(err)
            errorLog.log('error', 'JTAPI Peer Error', { err });
          resolve(peer)
        });
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

export const jtapi = (() => {
  const service: any = {
    cti: null,
    account: null,
    runner: new EventEmitter(),
    provider: null,
    runnerLog: null,
    finish(params) {
      const { provider, device, cmd, resp, macroName, timer = 0 } = params;
      const { ctiTerminal, logging } = device;
      return new Promise((resolve, reject) => {
        setTimeout((p, t) => {
          t.isRegistered((err, registered) => {
            if(err) {
              errorLog.log('error', 'Terminal Error', {
                error: err,
                onDevice: {
                  name: p.device.deviceName,
                  ip: p.device.ip,
                  model: p.device.model
                }
              });
            }
            if(registered) {
              console.log(p);
              const name = p.macroName.toLowerCase() || 'undefined';
              if(p.device && p.device.model) {
                const isDevice99 = p.device.model.startsWith('99'),
                  mreset: boolean = name.includes('reset') || name.includes('itl');
                if(isDevice99 && mreset) {
                  let cmd = phone.generateXml({
                    name: 'Key:Soft1'
                  });
                  t.sendData(cmd, (e, r) => {
                    console.log(r);
                    return resolve(registered);
                  })
                } else {
                  return resolve(registered);
                }
              }
            } else {
              if(p.device.model.startsWith('78'))
                p.timer = 4500;
              if(p.device.model.startsWith('99') ||
                p.device.model.startsWith('89')) p.timer = 35000;
              else p.timer = 2500;
              return this.finish(p);
            }
          })
        }, timer, params, ctiTerminal)
      }).then(() => {
        this.runner.emit('update-end', {
          device, cmd, resp
        });
        this.provider = provider;
        return;
      })
    },
    registered(t) {
      return new Promise(resolve => {
        t.isRegistered((err, registered) => resolve(registered));
      });
    },
    execMacro(terminal, dev, cmd) {
      if(cmd.name.includes('Pause')) {
        const timer = parseInt(cmd.name.replace('Key:Pause','') + '000', 10);
        return new Promise((resolve, reject) =>
          setTimeout(() => resolve({ resp: 'pause complete' }), timer));
      } else {
        return new Promise((resolve, reject) => {
          setTimeout((term, d, c) => {
            let timer = 1000;
            if(d.model && (d.model.startsWith('79') || d.model.startsWith('69'))) {
              timer = (c.sequenceId * 150) + 1000;
            }
            term.execAction([d.deviceName, c.xml], (err, phone) => {
              if(c.sequenceId === 1) {
                if(err) {
                  errorLog.log('error', 'Error On Terminal', {
                    error: err,
                    onDevice: {
                      name: d.deviceName,
                      ip: d.ip,
                      model: d.model,
                      ctiTerminal: phone
                    }
                  });
                }
                d['ctiTerminal'] = phone;
              }
              setTimeout(t => {
                t.getDataResponse((err, resp) => {
                  return resolve({ resp });
                });
              }, timer, term);
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
    getBackground(ip, model?) {
      let url: string;
      let { username, password } = this.account;
      if(model && model.startsWith('69')) {
        return req.get({
          url: `http://${ip}/CGI/Screenshot`,
          method: 'get',
          auth: { username, password }
        }).then(() => {
          url = `http://${ip}/CGI/lcd4.bmp`;
          return req.get({
            url,
            method: 'get',
            responseType: 'arraybuffer',
            auth: { username, password }
          }).then(({ data }) => data)
        })
      } else {
        url = `http://${ip}/CGI/Screenshot`;
      }
      return req.get({
        url,
        method: 'get',
        responseType: 'arraybuffer',
        auth: { username, password }
      }).then(({ data }) => data).catch(error => {
        const err = error.toString();
        errorLog.log('error', 'Getting BackGround', {
          forDevice: ip,
          errors: err
        });
        if(err.includes('REFUSED') || err.includes('TIMEOUT'))
          return null;
        return this.getBackground(ip, model).catch(error => {
          errorLog.log('error', 'Getting BackGround 2nd Try', {
            forDevice: ip,
            errors: error.toString()
          });
          return null;
        });
      });
    },
    updateEmitter(event, d, cmd, resp) {
      let { username, password } = this.account;
      const url = `http://${d.ip}/CGI/Screenshot`;
      let update: any = {
        device: d,
        cmd,
        responseMessage: resp || undefined
      };
      return this.getBackground(d.ip, d.model).then(img => {
        if(this.runnerLog) {
          this.handleImgWrite({
            device: d,
            img,
            index: cmd.sequenceId,
            encoding: 'binary',
            cmd
          });          
        }
        if(img) update['img'] = img;
        this.runner.emit(event, update);
        return 1;
      });
    },
    macroRunner(cmds, d, provider, macroName) {
      return Promise.mapSeries(cmds, (cmd: any, indx) => {
        return this.terminal(provider).then(t => {
          return this.execMacro(t, d, cmd).then(({resp}) => {
            return this.updateEmitter(
              'update', d, cmd, resp
            ).then(() => {
              if(indx === cmds.length - 1 || resp === 'finished') {
                const fin = {
                  cmd,
                  resp,
                  provider: t,
                  device: d,
                  macroName
                };
                return this.finish(fin);
              } else {
                return 1;
              }
            });
          });
        });
      }).catch(error => {
        errorLog.log('error', 'Macro Runner Error', {
          onDevice: d,
          error
        });
        return this.macroRunner(cmds, d, provider)
          .catch(e => errorLog.log('error', '2nd Runner Error'));
      });
    },
    deviceRunner({cmds, provider, devices}, macroName) {
      if(!this.runnerLog) {
        this.runnerLog = {
          name: moment().format('dddd, MMMM Do YYYY, h:mm:ss a'),
          totalDevices: devices.length,
          devices: []
        }
      } else {
        const { totalDevices } = this.runnerLog;
        this.runnerLog.totalDevices = totalDevices + devices.length;
      }
      return Promise.map(devices, (d: any) => {
        this.runnerLog.devices.push({
          deviceName: d.deviceName,
          ip: d.ip,
          model: d.model,
          sequences: [{
            description: 'Initial ScreenShot',
            image: (() => {
              let img = d.img.replace('data:image/png;base64,', '');
              return Buffer.from(img, 'base64').toString('binary');
            })()
          }]
        });
        return this.macroRunner(cmds, d, provider, macroName);
      });
    },
    getProvider(cmds, d) {
      return this.cti.connect()
        .then(provider => ({ cmds, provider, devices: d }));
    },
    run({ account, macros, devices }) {
      this.runner.removeAllListeners('update');
      this.runner.removeAllListeners('update-end');
      this.cti = new JTAPI(account);
      this.account = account;
      return Promise.map(macros, (macro: any) => {
        // Map Through Types
        let compute = { types: macro.types, devices };
        return this.computeDevicesToPush(compute)
          .then(d => this.getProvider(macro.cmds, d)
          .then(results => this.deviceRunner(results, macro.name)));
      })
    },
    deviceQuery({ account, devices }) {
      this.account = account;
      const risDoc = ris.createRisDoc({
        version: account.version,
        query: devices,
        options: { status: 'Registered' }
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
        console.log(device);
        return ModelEnum.get().then((models: any[]) => {
          console.log(models);
          if(models.findIndex(m => m.modelnumber === device.modelNumber) !== -1) {
            device['model'] =
              models.find(m => m.modelnumber === device.modelNumber).modelname.replace(
                'Cisco ', ''
              );
            console.log(device);
          }
          return;
        });
      }).then(() => {
        return this.getBackground(device.ip, device.model).then(img => {
          device['img'] = img;
          return device;
        });
      })
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
            return this.execMacro(t, device, c).then(data => {
              return this.updateEmitter('update', device, c, data.resp)
                .then(() => {
                  if(idx === cmds.length - 1) {
                    return this.finish({
                      provider: t,
                      device,
                      c,
                      resp: data.resp,
                      macroName: macro.name
                    }).then(() => {
                      this.provider.disconnectProvider();
                      this.runner.removeAllListeners('update');
                      this.runner.removeAllListeners('update-end');
                    })
                  }
                  return;
                })
            })
          })
        })
      })
    },
    handleImgWrite({device, img, index, encoding='base64', cmd}) {
      const { deviceName } = device;
      const dIndex = this.runnerLog.devices.findIndex(d =>
        d.deviceName === deviceName);
      this.runnerLog.devices[dIndex].sequences.push({
        description: cmd.description,
        image: img
      });
      return;
    },
    deviceTableHandling({ selection, devices }) {
      return Promise.mapSeries(devices, (d: any, indx) => {
        if(selection === 'all') {
          d.checked = true;
          if(d.img) return d;
          return this.getBackground(d.ip).then(img => {
            d.img = `data:image/png;base64,` +
              Buffer.from(img).toString('base64');
            return d;
          })
        } else if(selection === 'none') {
          d.checked = false;
        } else if(selection === indx) {
          if(d.checked) d.checked = false;
          else {
            d.checked = true;
            if(d.img) return d;
            return this.getBackground(d.ip, d.model).then(img => {
              d.img = img;
              d.img = `data:image/png;base64,` +
                Buffer.from(img).toString('base64');
              return d;
            });
          }
        }
        return d;
      });
    },
    createDoc() {
      const fn = new Date().getTime(),
        docbuilder = new DocBuilder();
      return docbuilder.initialize()
        .then(() => docbuilder.createDoc(this.runnerLog))
        .then(docBlob => {
          return new Promise((res, rej) => {
            writeFile(
              join(__dirname, `${fn}.docx`), docBlob, err => {
                return res(join(__dirname, `${fn}.docx`));
              }
            );
          });
        });
    },
    removeFile(filepath) {
      return new Promise((resolve, reject) => {
        unlink(filepath, (err) => {
          if(err) console.log(err);
          resolve();
        });
      });
    }
  };
  return service;
})();