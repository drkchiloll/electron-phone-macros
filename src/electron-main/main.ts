import * as electron from 'electron';
import { app, BrowserWindow, Menu } from 'electron';
import { AppMenu } from './menu';

class MyApplication {
	mainWindow: Electron.BrowserWindow = null;

	constructor(public app: Electron.App){
		this.app.on('window-all-closed', this.onWindowAllClosed);
		this.app.on('ready', this.onReady);
	}

	onWindowAllClosed(){
		if(process.platform != 'darwin'){
			app.quit();
		}
	}

	onReady(){
		this.mainWindow = new BrowserWindow({
			width: 1370,
			height: 900,
			minWidth: 1370,
			minHeight: 600,
			acceptFirstMouse: true
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