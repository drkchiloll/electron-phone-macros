process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
import * as electron from 'electron';
import { app, BrowserWindow, Menu } from 'electron';
import { AppMenu } from './menu';
// import { javaChecker } from '../app/lib/java-check';
import * as ContextMenu from 'electron-context-menu';

class MyApplication {
  mainWindow: Electron.BrowserWindow = null;

  constructor(public app: Electron.App) {
    this.app.on('window-all-closed', this.onWindowAllClosed);
    this.app.on('ready', this.onReady);
  }

  onWindowAllClosed() {
    if(process.platform != 'darwin') {
      app.quit();
    }
  }

  onReady() {
    this.mainWindow = new BrowserWindow({
      width: 1370,
      height: 900,
      minWidth: 1370,
      minHeight: 600,
      acceptFirstMouse: true
    });
    ContextMenu({
      window: this.mainWindow
    });
    const mainURL = `file://${__dirname}/index.html`;
    this.mainWindow.loadURL(mainURL);

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
    Menu.setApplicationMenu(AppMenu);
  }
}

const myapp = new MyApplication(app)