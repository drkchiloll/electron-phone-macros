import * as java from 'java';
import { Promise } from 'bluebird';
import { RisQuery as ris } from 'cucm-risdevice-query';
import { join } from 'path';
import { mkdirSync, existsSync, mkdir } from 'fs';
import { EventEmitter } from 'events';
import { req } from './requests';
import { Log, errorLog } from '../services/logger';
import { writeFile } from 'fs';

const logpath = process.platform === 'win32' ?
  `C:\\PhoneMacros\\logs\\` : join(__dirname, './logs');

export class JTAPI {
  public account: any;
  private classes: string[] = [
    './java/phoneterm_11_5.jar',
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
    this.classpath = account.version.startsWith('12') ||
      account.version.startsWith('11') ||
      account.version.startsWith('10') ?
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
    finish(params) {
      const { provider, device, cmd, resp, timer = 0 } = params;
      const { ctiTerminal, logging } = device;
      return new Promise((resolve, reject) => {
        setTimeout((p, t) => {
          t.isRegistered((err, registered) => {
            if(registered) return resolve(registered);
            else {
              p.timer = 2500;
              return this.finish(p);
            }
          })
        }, timer, params, ctiTerminal)
      }).then(() => {
        this.runner.emit('update-end', {
          device, cmd, resp
        });
        if(logging) {
          logging.logger.log('info', 'final update', {
            cmd: cmd.name,
            cmdData: cmd.xml || 'Device is now Registered',
            deviceResponse: resp || 'none'
          });
        }
        this.provider = provider;
        return;
      })
    },
    execMacro(terminal, dev, cmd) {
      if(cmd.name.includes('Pause')) {
        const timer = parseInt(cmd.name.replace('Key:Pause','') + '000', 10);
        console.log(timer);
        return new Promise((resolve, reject) =>
          setTimeout(() => {
            resolve('pause complete');
          }, timer));
      } else {
        return new Promise((resolve, reject) => {
          setTimeout((term, d, c) => {
            term.execAction([d.deviceName, c.xml], (err, phone) => {
              if(c.sequenceId === 1) d['ctiTerminal'] = phone;
              setTimeout(t => {
                t.getDataResponse((err, resp) => {
                  return resolve({resp});
                });
              }, 1000, term);
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
      }).then(({ data }) => data).catch(error => {
        errorLog.log('error', 'Getting BackGround', {
          forDevice: ip,
          errors: error.toStrin()
        });
        return null;
      });
    },
    updateEmitter(event, d, cmd, resp) {
      let { username, password } = this.account;
      const { logging } = d;
      const url = `http://${d.ip}/CGI/Screenshot`;
      let update: any = {
        device: d,
        cmd,
        responseMessage: resp || undefined
      };
      if(logging) {
        logging.logger.log('info', `CMD Sequence: ${cmd.sequenceId}`, {
          cmd: cmd.name,
          cmdData: cmd.xml || 'none',
          deviceResponse: resp || undefined
        });
      }
      return this.getBackground(d.ip).then(img => {
        if(logging) {
          this.handleImgWrite({
            device: d,
            img,
            index: cmd.sequenceId,
            encoding: 'binary'
          });
        }
        if(img) update['img'] = img;
        this.runner.emit(event, update);
        return;
      });
    },
    macroRunner(cmds, d, provider) {
      return Promise.mapSeries(cmds, (cmd: any, indx) => {
        return this.terminal(provider).then(t => {
          return this.execMacro(t, d, cmd).then(({resp}) => {
            return this.updateEmitter(
              'update', d, cmd, resp
            ).then(() => {
              if(indx === cmds.length - 1) {
                return this.finish({
                  provider: t,
                  device: d,
                  cmd,
                  resp
                })
              }
              return;
            });
          });
        });
      }).catch(error => {
        errorLog.log('error', 'Macro Runner Error', {
          onDevice: d,
          error
        });
      })
    },
    logPathDir(path) {
      if(process.platform === 'win32') {
        if(!existsSync(logpath)) {
          mkdirSync(logpath);
        }
      }
      mkdirSync(join(logpath, path));
      return;
    },
    deviceRunner({cmds, provider, devices}) {
      const jobName = new Date().getTime();
      const logPath = `./${jobName}`;
      this.logPathDir(logPath);
      return Promise.map(devices, (d: any) => {
        const dlogpath = `./${d.deviceName}`;
        mkdirSync(join(logpath, `${logPath}/${d.deviceName}`));
        const thispath = join(logpath, `${logPath}/${d.deviceName}/job.log`);
        d['logging'] = {
          logger: Log.create(thispath),
          logfile: jobName
        };
        return this.macroRunner(cmds, d, provider, this);
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
          .then(results => this.deviceRunner(results)));
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
            return this.execMacro(t, device, c).then(data => {
              return this.updateEmitter('update', device, c, data.resp)
                .then(() => {
                  if(idx === cmds.length - 1) {
                    return this.finish({
                      provider: t,
                      device,
                      c,
                      resp: data.resp
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
    handleImgWrite({device, img, index, encoding='base64'}) {
      const { deviceName, logging: { logfile } } = device;
      const filename = `${deviceName}_${index}.png`;
      if(encoding === 'base64') {
        img = img.replace('data:image/png;base64,', '');
      }
      writeFile(
        join(logpath, `./${logfile}/${deviceName}/${filename}`),
        new Buffer(img, encoding),
        err => {}
      );
    },
    deviceTableHandling({ selection, devices }) {
      return Promise.mapSeries(devices, (d: any, indx) => {
        if(selection === 'all') {
          d.checked = true;
          return this.getBackground(d.ip).then(img => {
            d.img = d.img = `data:image/png;base64,` +
              Buffer.from(img, 'binary').toString('base64');
            return d;
          })
        } else if(selection === 'none') {
          d.checked = false;
        } else if(selection === indx) {
          if(d.checked) d.checked = false;
          else {
            d.checked = true;
            return this.getBackground(d.ip).then(img => {
              d.img = `data:image/png;base64,` +
                Buffer.from(img, 'binary').toString('base64');
              return d;
            });
          }
        }
        return d;
      });
    }
  };
  return service;
})();