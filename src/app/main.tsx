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
    floatingLabelColor: darkBlack
  },
  flatButton: {
    primaryTextColor: darkBlack
  },
  snackbar: {
    textColor: fullWhite
  },
  palette: {
    primary1Color: '#01579B'
  },
  menuItem: {
    selectedTextColor: '#1A237E'
  },
  tableRow: {
    stripeColor: '#CFD8DC',
    selectedColor: '#90CAF9',
  }
});

const Root = (
  <MuiThemeProvider muiTheme={lightMuiTheme}>
    <App />
  </MuiThemeProvider>
);

ReactDOM.render(Root, $('#app')[0]);
