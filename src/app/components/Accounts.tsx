import {
  React, $, Promise,
  Drawer, MenuItem, Dialog, FlatButton,
  BottomNavigation, BottomNavigationItem,
  FontIcon, Paper, Divider, TextField,
  Subheader, ListItem, SelectField, Snackbar,
  SelectableList, Cucm, moment, Component
} from './index';
import UserGroup from 'material-ui/svg-icons/social/group';
import { accountDb } from '../lib/account-db';
import { userPermissions } from '../lib';

export class Accounts extends Component<any,any> {
  constructor() {
    super();
    this.state = {
      accounts: [{
        name: 'New Account', host: '', version: '8.5',
        username: '', password: '', selected: true
      }],
      openAccounts: false,
      selectedAcct: 0,
      account: null,
      openSnack: false,
      acctMsg: ''
    };
  }
  componentWillMount() {
    let accounts;
    accountDb.get().then((records: any) => {
      this.setState({ accounts: records });
      if(records.length !== 0) {
        return Promise.map(records, (record: any) => {
          const { lastTested } = record;
          const testDiff =
            new Date().getTime() - new Date(lastTested).getTime();
          if(testDiff > 86400000) {
            record['status'] = 'red';
            return accountDb.update(record).then(() => {
              return record;
            });
          }
          return record;
        })
      }
    }).then((records) => {
      accounts = records;
      // console.log(accounts);
      let selectedAcct = accounts.findIndex(acct => acct.selected),
        account = accounts[selectedAcct];
      this.setState({ accounts, selectedAcct, account });
    });

  }
  componentWillUnmount() {
    console.log('this component dismounted');
  }
  handleAccountsToggle = () => {
    let { openAccounts } = this.state;
    this.setState({openAccounts: !openAccounts});
  }
  changeAcctValues = (e:any, val:any) => {
    let { name } = e.target,
      { accounts, selectedAcct } = this.state;
    accounts[selectedAcct][name] = val;
    this.setState({ accounts });
  }

  passAccountProps = account => this.props.setAccount(account);

  save = () => {
    let { accounts, selectedAcct } = this.state,
      account = accounts[selectedAcct],
      acctMsg: string;
    if(account._id) {
      // Update
      this.passAccountProps(account);
      accountDb.update(account).then(() => {
        acctMsg = `${account.name} updated successfully`;
        this.setState({ accounts, openSnack: true, acctMsg });
      });
    } else {
      account['status'] = 'red';
      account['lastTested'] = null;
      accountDb.add(account).then((doc) => {
        this.passAccountProps(doc);
        account._id = doc._id;
        acctMsg = `${account.name} added successfully`;
        this.setState({ accounts, openSnack: true, acctMsg, account });
      });
    }
  }
  testAccount = () => {
    let { accounts, selectedAcct } = this.state,
      account = accounts[selectedAcct],
      { host, version, username, password } = account;
    let cucm = new Cucm({ host, version, username, password }),
      statement = cucm.testAxlQuery;
    cucm.query(statement, true).then((resp: any) => {
      account['lastTested'] = moment().toDate();
      if (resp && resp instanceof Array) {
        account['status'] = 'green';
        return accountDb.update(account);
      } else if (resp.error) {
        account['status'] = 'red';
        return accountDb.update(account);
      }
    }).then(() => {
      accountDb.get({ _id: account._id }).then((record) => {
        account = record[0];
        this.setState({ account });
      });
    })
  }
  getPermissions = () => {
    let { accounts, selectedAcct } = this.state,
      account = accounts[selectedAcct],
      { host, version, username, password } = account;
    const cucm = new Cucm({ host, version, username, password });
    const cmd = userPermissions.replace('%userid%', username);
    cucm.query(cmd, true).then(resp => {
      console.log(resp);
    })
  }
  selectAccount = (e: any, selected: number) => {
    let { accounts, selectedAcct, api } = this.state;
    accounts[selected].selected = true;
    accounts[selectedAcct].selected = false;
    const account = accounts[selected],
      lastaccount = accounts[selectedAcct];
    this.passAccountProps(account);
    this.setState({
      selectedAcct: selected,
      accounts,
      account
    });
    Promise.all([
      accountDb.update(account),
      accountDb.update(lastaccount)
    ]);
  }
  removeAccount = () => {
    let { accounts, selectedAcct } = this.state,
      { _id, name } = accounts[selectedAcct];
    if(accounts.length === 1) {
      this.setState({
        acctMsg: `Don't delete your last Account..Just Overwrite It..`,
        openSnack: true
      })
      return;
    }
    this.passAccountProps(accounts[selectedAcct]);
    accountDb.remove(_id).then(() => {
      accounts.splice(selectedAcct, 1);
      const account = accounts[
        selectedAcct === 0 ? 0 : --selectedAcct
      ];
      account.selected = true;
      accountDb.update(account);
      this.setState({
        account,
        selectedAcct: selectedAcct === 0 ? 0 : --selectedAcct,
        accounts,
        acctMsg: `${name} removed successfully`,
        openSnack: true
      });
    });
  }
  render() {
    let { accounts, selectedAcct, openSnack, acctMsg } = this.state;
    let account = accounts[selectedAcct];
    let testColor: string;
    if(account && account.status) {
      testColor = account.status;
    } else {
      testColor = 'red';
    }
    const style = { marginLeft: 20 };
    const actions = [
      <FlatButton
        label='Save'
        icon={<FontIcon className='fa fa-hdd-o' />}
        primary={true}
        keyboardFocused={true}
        onClick={this.save}
      />,
      <FlatButton
        label='Test'
        icon={
          <FontIcon color={testColor} className='fa fa-plug' />
        }
        primary={true}
        onClick={this.testAccount}
      />,
      <FlatButton
        label='Verify Permissions'
        icon={<FontIcon><UserGroup/></FontIcon>}
        primary={true}
        onClick={this.getPermissions}
      />,
      <FlatButton
        label='Close'
        icon={<FontIcon className='fa fa-window-close-o' />}
        primary={true}
        onClick={() => {
          this.props.acctClose();
        }}
      />
    ];
    return (
      <div>
        <Dialog
          actions={actions}
          modal={true}
          open={this.props.openDia}
          onRequestClose={this.props.acctClose}>
          <div>
            <Drawer open={true} width={225}>
              <SelectableList value={selectedAcct}
                onChange={this.selectAccount} >
                <Subheader>Account List</Subheader>
                {
                  accounts.map((acct, i) => {
                    return (
                      <ListItem
                        key={`acct_${i}`}
                        value={i}
                        primaryText={acct.name}
                        rightIcon={
                          <FontIcon
                            color={acct.status}
                            className='fa fa-dot-circle-o'
                          />
                        }
                      />
                    );
                  })
                }
              </SelectableList>
              <div>
                <Paper zDepth={1}>
                  <BottomNavigation
                    style={{ position: 'fixed', bottom: 0 }}>
                    <BottomNavigationItem
                      label="Account"
                      icon={<FontIcon className='fa fa-user-plus' />}
                      onClick={() => {
                        accounts.push({
                          name: 'New Account', host: '',
                          version: '8.5', username: '',
                          password: ''
                        });
                        this.setState({
                          accounts,
                          selectedAcct: accounts.length - 1
                        })
                      }}
                    />
                    <BottomNavigationItem
                      label="Remove"
                      icon={<FontIcon color='red' className='fa fa-trash' />}
                      onClick={this.removeAccount}
                    />
                  </BottomNavigation>
                </Paper>
              </div>
            </Drawer>
          </div>
          <div style={{ marginLeft: '235px' }}>
            <Paper zDepth={2}>
              <TextField hintText="Connection Name"
                style={style}
                name='name'
                underlineShow={true}
                floatingLabelFixed={true}
                floatingLabelText='Account Name'
                value={accounts[selectedAcct].name}
                onChange={this.changeAcctValues}
                errorText='' />
              <TextField
                hintText="Hostname/IP Address"
                style={style}
                name='host'
                underlineShow={true}
                floatingLabelFixed={true}
                floatingLabelText='CUCM Server'
                value={accounts[selectedAcct].host}
                onChange={this.changeAcctValues} />
              <Divider />
              <SelectField floatingLabelText='UCM Version'
                style={style}
                value={accounts[selectedAcct].version}
                onChange={(e, i, val) => {
                  account.version = val
                  this.setState({ accounts });
                }} >
                { this._renderVersions() }
              </SelectField>
              <TextField
                hintText="user_name"
                style={style}
                name='username'
                underlineShow={true}
                floatingLabelFixed={true}
                floatingLabelText='UserName'
                value={accounts[selectedAcct].username}
                onChange={this.changeAcctValues} />
              <TextField
                type='password'
                hintText="password"
                name='password'
                style={style}
                underlineShow={true}
                floatingLabelFixed={true}
                floatingLabelText='Password'
                value={accounts[selectedAcct].password}
                onChange={this.changeAcctValues} />
              <Divider />
            </Paper>
          </div>
        </Dialog>
        <Snackbar
          open={openSnack}
          message={acctMsg}
          autoHideDuration={2500}
          onRequestClose={() =>
            this.setState({ openSnack: false, acctMsg: '' })}
        />
      </div>
    );
  }
  _renderVersions = () => {
    const versions = [
      '8.0', '8.5', '9.0', '9.1', '10.0',
      '10.5', '11.0', '11.5', '12.0'
    ];
    return versions.map(v =>
      <MenuItem
        key={v}
        value={v}
        primaryText={v}
      />
    )
  }
}