import {
  React, $, Tabs, Tab, FontIcon, Dialog, FlatButton,
  Accounts, MainView, Api, Cucm, phModelQuery,
  Component
} from './index';
import { PhoneMacros } from './PhoneMacros';

export class App extends Component<any, any> {
  constructor() {
    super();
    this.state = {
      tabValue: 'mainView',
      openAcct: false,
      tabIndx: 1,
      db: null,
      api: null,
      modelNum: null,
      account: []
    };
  }
  componentWillMount() {
    let api = new Api({ db: 'acctDb', dbName: 'accounts' }),
        modelDb = new Api({ db: 'modelDb', dbName: 'models' }),
        account:any;
    this.setState({ api });
    return modelDb.get().then((recs:any) => {
      return api.get().then((accounts: any) => {
        if(accounts.length > 0) {
          account = accounts.find((r: any) => r.selected);
        }
        this.setState({ modelNum: recs, account });
        if(recs.length === 0) return account; 
        else return;
      });
    }).then((acct) => {
      if(acct && acct.host) {
        let cucm = new Cucm(acct);
        return cucm.query(phModelQuery, true);
      }
    }).then((results:any) => {
      // console.log(results);
      if(results && results.length > 0) {
        modelDb.add(results).then((resp: any) => {
          console.log(resp);
        });
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
    return (
      <div>
        <div style={{width: 405, marginBottom: 5}}>
          <Tabs className='tabs-container'
            inkBarStyle={{ background: 'black' }}
            tabItemContainerStyle={{ width: 405 }}
            initialSelectedIndex={this.state.tabIdx}
            value={this.state.tabValue}
            onChange={this._tabSelect}>
            <Tab icon={
                <span className='fa-stack fa-lg'>
                  <i className='fa fa-server fa-lg'/>
                </span>
              }
              label='Accounts'
              value='accounts'>
              <Accounts api={this.state.api}
                openDia={this.state.openAcct}
                acctClose={this._handleClose} />
            </Tab>
            <Tab icon={
              <span className='fa-stack fa-lg'>
                <i className='fa fa-phone fa-lg' />
              </span>
            }
              label='Device Search'
              value='device-search' >
              <MainView api={this.state.api}
                modelNum={this.state.modelNum} />
            </Tab>
            <Tab icon={
                <span className='fa-stack fa-lg'>
                  <i className='fa fa-superpowers fa-lg' />
                </span>
              }
              label='Phone Macros'
              value='templates' >
              <PhoneMacros account={this.state.account} />
            </Tab>
          </Tabs>
          {/* <hr color='black' style={{ width: 180 }} /> */}
        </div>
      </div>
    );
  }
}