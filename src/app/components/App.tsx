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
    const { account, openAcct, tabValue, update, registered } = this.state;
    return (
      <div style={{ position: 'relative' }}>
        <Tabs className='tabs-container'
          inkBarStyle={{ background: '#546E7A', border: '.5px solid #546E7A' }}
          tabItemContainerStyle={{
            width: 505,
            height: 75,
            borderTop: '.5px solid #B0BEC5',
            borderRight: '.5px solid #B0BEC5',
            borderLeft: '.5px solid #B0BEC5',
            borderBottom: '.25px dashed #B0BEC5'
          }}
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
            label='MACRO-RUNNER'
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
  closeUpdator = () => this.setState({ update: false })
  closeReg = () => this.setState({ registered: true })
}