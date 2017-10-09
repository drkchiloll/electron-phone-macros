import {
  React, $, Tabs, Tab, FontIcon, Dialog, FlatButton,
  Accounts, WorkingComponent
} from './index';

export class App extends React.Component<any, any> {
  constructor() {
    super();
    this.state = {
      tabValue: 'mainView',
      openAcct: false,
      tabIndx: 1,
      db: null
    };
    this._handleClose = this._handleClose.bind(this);
    this._tabSelect = this._tabSelect.bind(this);
  }
  _handleClose() {
    this.setState({
      openAcct: false,
      tabIdx: 1,
      tabValue: 'mainView'
    });
  }
  _tabSelect(tabValue: string) {
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
        <div>
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
              <Accounts openDia={this.state.openAcct} acctClose={this._handleClose} />
            </Tab>
          </Tabs>
          <hr color='black'/>
        </div>
        <div style={{ width: 300 }}>
          <WorkingComponent />
        </div>
      </div>
    );
  }
}

