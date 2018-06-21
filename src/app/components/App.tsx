import {
  React, $, Tabs, Tab, FontIcon, Dialog, FlatButton,
  Accounts, MainView, Api, Cucm, phModelQuery,
  Component
} from './index';

export class App extends Component<any, any> {
  constructor() {
    super();
    this.state = {
      tabValue: 'mainView',
      openAcct: false,
      tabIndx: 1,
      db: null,
      api: null,
      modelNum: null
    };
  }
  componentWillMount() {
    let api = new Api({ db: 'acctDb', dbName: 'accounts' }),
        modelDb = new Api({ db: 'modelDb', dbName: 'models' }),
        account:any;
    this.setState({ api });
    return modelDb.get().then((recs:any) => {
      if(recs.length === 0) {
        return api.get().then((recs: any) => {
          if(recs.length > 0) {
            account = recs.filter((r: any) => r.selected)[0];
          }
          return account;
        });
      } else {
        this.setState({ modelNum: recs });
        return;
      }
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
    let saveQuery = false;
    if(tabValue === 'save') saveQuery = true;
    this.setState({
      openAcct: (tabValue === 'accts') ? true: false,
      tabValue,
      saveQuery
    });
  }
  render() {
    return (
      <div>
        <div style={{width: 180}}>
          <Tabs className='tabs-container'
            inkBarStyle={{ background: '#d7dddd' }}
            tabItemContainerStyle={{ width: 180 }}
            initialSelectedIndex={this.state.tabIdx}
            value={this.state.tabValue}
            onChange={this._tabSelect}>
            <Tab icon={
                <span className='fa-stack fa-lg'>
                  <i className='fa fa-server fa-stack-2x'/>
                </span>
              }
              label='Accounts'
              value='accts'>
              <Accounts api={this.state.api}
                openDia={this.state.openAcct}
                acctClose={this._handleClose} />
            </Tab>
          </Tabs>
          <hr color='black' style={{ width: 180 }} />
        </div>
        <div>
          <MainView api={this.state.api} 
            modelNum={this.state.modelNum} />
        </div>
      </div>
    );
  }
}