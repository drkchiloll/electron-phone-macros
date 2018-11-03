import {
  React, Tabs, Tab, Accounts, MainView, Component,
  Dialog, TextField
} from './index';
import { PhoneMacros } from './PhoneMacros';
import { FeatureButtons } from './FeatureButtons';
import { Update } from './Update';
import { RegDialog } from './RegDialog';
import { accountDb } from '../lib/account-db';
import { ipcRenderer } from 'electron';
import { REGISTRATION as registry } from '../lib/registrations';
import { javaChecker } from '../lib/java-check';
import * as sudo from 'sudo-prompt';

export class App extends Component<any, any> {
  constructor() {
    super();
    this.state = {
      registered: false,
      tabValue: 'templates',
      openAcct: false,
      tabIndx: 1,
      account: null,
      update: false
    };
  }
  componentWillMount() {
    let account:any;
    this.setState({ registered: registry.verify() });
    accountDb.get().then((accounts: any) => {
      if (accounts.length > 0) {
        account = accounts.find((r: any) => r.selected);
        this.setState({ account });
      }
    })
    ipcRenderer.on('update', () => this.setState({ update: true }));
  }
  _handleClose = () => {
    this.setState({
      openAcct: false,
      tabIdx: 1,
      tabValue: 'device-search'
    });
  }
  _tabSelect = tabValue => {
    this.setState({
      openAcct: (tabValue === 'accounts') ? true: false,
      tabValue
    });
  }
  updateAccount = account => this.setState({ account });

  render() {
    const {
      account, openAcct, tabValue, update, registered
    } = this.state;
    return (
      <div style={{ position: 'relative' }}>
        <Tabs className='tabs-container'
          inkBarStyle={this.style.tabBar}
          tabItemContainerStyle={this.style.tabContainer}
          initialSelectedIndex={this.state.tabIdx}
          value={tabValue}
          onChange={this._tabSelect}>
          <Tab icon={this._renderTabIcon('server')}
            label='Accounts'
            value='accounts'
          >
            <Accounts account={account}
              openDia={openAcct}
              acctClose={this._handleClose}
              setAccount={this.updateAccount} />
          </Tab>
          <Tab icon={this._renderTabIcon('phone')}
            label='MACRO-RUNNER'
            value='device-search'
          >
            {
              tabValue !== 'device-search' ? null :
                <MainView account={account} />
            }
          </Tab>
          <Tab icon={this._renderTabIcon('superpowers')}
            label='MACRO-BUILDER'
            style={{marginLeft:10}}
            value='templates'
          >
            {
              tabValue !== 'templates' ? null :
                <PhoneMacros account={account} />
            }
          </Tab>
        </Tabs>
        <FeatureButtons account={account} />
        {update ? <Update update={update} close={this.closeUpdator} /> : null}
        { !registered ? <RegDialog closeReg={this.closeReg} />: null }
      </div>
    );
  }
  _renderTabIcon = type => {
    return <span className='fa-stack fa-lg'>
      <i className={`fa fa-${type} fa-lg`} />
    </span>
  }
  closeUpdator = () => this.setState({ update: false })
  closeReg = () => this.setState({ registered: true })
  style: any = {
    tabBar: { background: '#546E7A', border: '.5px solid #546E7A' },
    tabContainer: {
      width: 505,
      height: 75,
      borderTop: '.5px solid #B0BEC5',
      borderRight: '.5px solid #B0BEC5',
      borderLeft: '.5px solid #B0BEC5',
      borderBottom: '.25px dashed #B0BEC5'
    }
  }
}