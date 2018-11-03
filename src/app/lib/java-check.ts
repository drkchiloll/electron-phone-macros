import * as targz from 'targz'
import { Promise } from 'bluebird';
import { join } from 'path';
import { exists, open } from 'fs';
import { exec } from 'child_process';
import { BrowserWindow } from 'electron';

export const javaChecker = (() => {
  const service: any = {
    loadingWindow: BrowserWindow,
    present() {
      const path = 'C:\\PhoneMacros\\Java';
      return new Promise(resolve => {
        exists(path, (present:boolean) => resolve(present));
      });
    },
    xtractJava() {
      return new Promise(resolve => {
        targz.decompress({
          src: join(__dirname, './jdk-10.0.1.jdk.tgz'),
          dest: '/Libary/Java/JavaVirtualMachines/'
        }, (err) => resolve('done'))
      })
    },
    load() {
      this.loadingWindow = new BrowserWindow({
        autoHideMenuBar: true,
        frame: false,
        alwaysOnTop: true
      });
      this.loadingWindow.loadURL(
        `file://${__dirname}/loading.html`
      );
    },
    setHomeAndPath() {
      return new Promise(resolve => {
        if(process.env['JAVA_HOME']) return resolve('done');
        const home = `setx -m JAVA_HOME "C:\\PhoneMacros\\Java\\jdk-10.0.1"`,
          path = `setx -m PATH "%PATH%;%JAVA_HOME%\\bin`;
        exec(home, (e, sout, serr) => {
          exec(path, (e, sout, serror) => resolve('done'))
        })
      })
    },
    run() {
      if(process.platform !== 'darwin') {
        return Promise.all([
          this.present().then(present => {
            if(!present) {
              this.load();
              return this.xtractJava().then(() => {
                this.loadingWindow.destroy();
                return 'done';
              });
            }
          })
        ]);
      } else {
        return Promise.resolve('done');
      }
    },
    openDir(path) {
      return new Promise((resolve, reject) => {
        open(path, 'r', (e, fd) => {
          if(e) reject(e);
          else resolve();
        })
      })
    },
    check() {
      const lib = '/Library',
        java = '/Java',
        jvms = '/JavaVirtualMachines',
        jdk = '/jdk-10.0.1.jdk';
      return this.openDir(`${lib}${java}`)
        .then(() => this.openDir(`${lib}${java}${jvms}${jdk}`))
    }
  };
  return service;
})();
