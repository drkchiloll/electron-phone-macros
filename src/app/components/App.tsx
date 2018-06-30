import {
  React, $, Tabs, Tab, FontIcon, Dialog, FlatButton,
  Accounts, MainView, Api, Cucm, phModelQuery,
  Component
} from './index';
import { PhoneMacros } from './PhoneMacros';
import { Backgrounds } from './Backgrounds';
import { accountDb } from '../lib/account-db';

export class App extends Component<any, any> {
  constructor() {
    super();
    this.state = {
      tabValue: 'mainView',
      openAcct: false,
      tabIndx: 1,
      account: null
    };
  }
  componentWillMount() {
    let account:any;
    accountDb.get().then((accounts: any) => {
      if(accounts.length > 0) {
        account = accounts.find((r: any) => r.selected);
        this.setState({ account });
      }
    });
  }
  _handleClose = () => {
    this.setState({
      openAcct: false,
      tabIdx: 1,
      tabValue: 'mainView'
    });
  }
  _tabSelect = tabValue => {
    console.log(tabValue);
    this.setState({
      openAcct: (tabValue === 'accounts') ? true: false,
      tabValue
    });
  }
  render() {
    const { account, openAcct, tabValue } = this.state;
    return (
      <Tabs className='tabs-container'
        inkBarStyle={{ background: 'black' }}
        tabItemContainerStyle={{width: 600, marginBottom: 10 }}
        initialSelectedIndex={this.state.tabIdx}
        value={tabValue}
        onChange={this._tabSelect}>
        <Tab icon={
            <span className='fa-stack fa-lg'>
              <i className='fa fa-server fa-lg'/>
            </span>
          }
          label='Accounts'
          value='accounts'
        >
          <Accounts account={account}
            openDia={openAcct}
            acctClose={this._handleClose} />
        </Tab>
        <Tab icon={
            <span className='fa-stack fa-lg'>
              <i className='fa fa-phone fa-lg' />
            </span>
          }
          label='Device Search'
          value='device-search'
        >
          <MainView account={account} />
        </Tab>
        <Tab icon={
            <span className='fa-stack fa-lg'>
              <i className='fa fa-superpowers fa-lg' />
            </span>
          }
          label='Phone Macros'
          value='templates'
        >
          <PhoneMacros />
        </Tab>
        <Tab
          label='BACKGROUNDS'
          value='backgrounds'
          icon={
            <span className='fa-stack fa-lg'>
              <i className='fa fa-picture-o fa-lg' />
            </span>
          }
        >
          <Backgrounds account={account} />
        </Tab>
      </Tabs>
    );
  }
}