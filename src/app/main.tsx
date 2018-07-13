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
    <App />
  </MuiThemeProvider>
);

ReactDOM.render(Root, $('#app')[0]);
