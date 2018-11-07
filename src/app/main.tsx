import './vendor';
import {
  React, ReactDOM, $, App,
  getMuiTheme, MuiThemeProvider,
  darkBlack, fullWhite
} from './components/index';
import { remote } from 'electron';
import { FireDB } from './lib/app-registration/firebase-db';
import { REGISTRATION as registration } from './lib/registrations';

const fireSubscribe = reg => {
  const fire = new FireDB();
  return fire.login().then(() => {
    fire.ref.where('id', '==', reg.id)
      .onSnapshot(snapshot => {
        let [changes] = snapshot.docChanges();
        if(changes.type === 'added' || changes.type === 'modified') {
          let doc = changes.doc.data();
          if(doc.killSwitch) {
            alert('You are not authorized to use this Application');
            remote.app.quit();
          } else if(doc.update) {
            remote.getCurrentWebContents().send('update');
          }
        }
      });
  });
};

let regData: any;
try {
  regData = JSON.parse(localStorage.getItem('registration'));
  if(regData) {
    fireSubscribe(regData);
  }
} catch(e) {}

const lightMuiTheme = getMuiTheme({
  tabs: {
    selectedTextColor: darkBlack,
    textColor: darkBlack,
    backgroundColor: '#CFD8DC'
  },
  textField: {
    floatingLabelColor: darkBlack
  },
  flatButton: {
    primaryTextColor: darkBlack
  },
  snackbar: {
    textColor: fullWhite
  },
  palette: {
    primary1Color: '#546E7A'
  },
  menuItem: {
    selectedTextColor: '#1A237E'
  },
  tableRow: {
    hoverColor: '#78909C',
    stripeColor: '#ECEFF1',
    selectedColor: '#78909C'
  }
});

const Root = (
  <MuiThemeProvider muiTheme={lightMuiTheme}>
    <App registration={regData} subscribe={fireSubscribe} />
  </MuiThemeProvider>
);

ReactDOM.render(Root, $('#app')[0]);
