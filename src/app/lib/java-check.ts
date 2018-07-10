import * as targz from 'targz'
import { Promise, resolve } from 'bluebird';
import { join } from 'path';
import { exists } from 'fs';
import { platform } from 'os';
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
          src: join(__dirname, './jdk-10.0.1.tar.gz'),
          dest: 'C:\\PhoneMacros\\Java\\'
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
        const home = `setx JAVA_HOME "C:\\PhoneMacros\\Java\\jdk-10.0.1"`,
          path = `setx PATH "%PATH%;%JAVA_HOME%\\bin`;
        exec(home, (e, sout, serr) => {
          exec(path, (e, sout, serror) => resolve('done'))
        })
      })
    },
    run() {
      console.log(platform())
      if(platform() !== 'darwin') {
        return Promise.all([
          this.setHomeAndPath(),
          this.present().then(present => {
            console.log(present)
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
    }
  };
  return service;
})();
