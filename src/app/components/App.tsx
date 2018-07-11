import {
  React, Tabs, Tab,
  Accounts, MainView,
  Component, Promise
} from './index';
import { PhoneMacros } from './PhoneMacros';
import { accountDb } from '../lib/account-db';
import { javaChecker } from '../lib/java-check'

export class App extends Component<any, any> {
  constructor() {
    super();
    this.state = {
      tabValue: 'device-search',
      openAcct: false,
      tabIndx: 1,
      account: null
    };
  }
  componentWillMount() {
    let account:any;
    Promise.all([
      accountDb.get().then((accounts: any) => {
        if (accounts.length > 0) {
          account = accounts.find((r: any) => r.selected);
          this.setState({ account });
        }
      })
    ])
  }
  _handleClose = () => {
    this.setState({
      openAcct: false,
      tabIdx: 1,
      tabValue: 'device-search'
    });
  }
  _tabSelect = tabValue => {
    console.log(tabValue);
    this.setState({
      openAcct: (tabValue === 'accounts') ? true: false,
      tabValue
    });
  }
  updateAccount = account => this.setState({ account });

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
            acctClose={this._handleClose}
            setAccount={this.updateAccount} />
        </Tab>
        <Tab icon={
            <span className='fa-stack fa-lg'>
              <i className='fa fa-phone fa-lg' />
            </span>
          }
          label='Device Search'
          value='device-search'
        >
          {
            tabValue !== 'device-search' ? null :
              <MainView account={account} />
          }
        </Tab>
        <Tab icon={
            <span className='fa-stack fa-lg'>
              <i className='fa fa-superpowers fa-lg' />
            </span>
          }
          label='Phone Macros'
          value='templates'
        >
          {
            tabValue !== 'templates' ? null :
              <PhoneMacros account={account} />
          }
        </Tab>
      </Tabs>
    );
  }
}