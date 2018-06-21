import './vendor';
import {
  React, ReactDOM, $, App,
  getMuiTheme, MuiThemeProvider,
  darkBlack, darkWhite, fullWhite
} from './components/index';

const lightMuiTheme = getMuiTheme({
  tabs: {
    selectedTextColor: darkBlack,
    textColor: darkBlack,
    backgroundColor: '#d7dddd',
  },
  textField: {
    floatingLabelColor: darkBlack,
    focusColor: 'rgb(120,20,17)'
  },
  flatButton: {
    primaryTextColor: darkBlack
  },
  snackbar: {
    textColor: fullWhite
  }
});

const Root = (
  <MuiThemeProvider muiTheme={lightMuiTheme}>
    <App />
  </MuiThemeProvider>
);

ReactDOM.render(Root, $('#app')[0]);
