import * as targz from 'targz'
import { Promise, resolve } from 'bluebird';
import { join } from 'path';
import { exists } from 'fs';
import { platform } from 'os';
import { remote, BrowserWindow } from 'electron';

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
        `file://${__dirname}/images/loading.gif`
      );
    },
    run() {
      console.log(platform())
      if(platform() !== 'darwin') {
        return this.present().then(present => {
          console.log(present)
          if(!present) {
            this.load();
            return this.xtractJava().then(() => {
              this.loadingWindow.destroy();
              return 'done';
            });
          }
        });
      } else {
        return Promise.resolve('done');
      }
    }
  };
  return service;
})();
