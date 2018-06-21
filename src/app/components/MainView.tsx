import {
  React, $, Promise, moment, Cucm,
  TextField, Paper, FontIcon, IconButton,
  Divider, RaisedButton, risDoc, Card,
  CardHeader, CardText, Table, TableBody, TableHeader,
  TableHeaderColumn, TableRow, TableRowColumn, devAssQuery,
  updDevAssoc, Component
} from './index';

export class MainView extends Component<any, any> {
  constructor() {
    super();
    this.state = {
      ipAddresses: [''],
      account: null,
      searchLabel: 'Search',
      devices: null
    };
  }
  componentWillMount() {
    this.props.api.get().then((recs:any) => {
      this.setState({
        account: recs.filter((r:any) => r.selected)[0]
      });
    });
  }
  handleSearchChange = (e: any, value: string) => {
    let { ipAddresses } = this.state;
    const searchIdx = e.target.name.split('_')[1];
    ipAddresses[searchIdx] = value;
    this.setState({ ipAddresses });
  }
  queryClick = (event, indx) => {
    let { ipAddresses, devices } = this.state;
    if($(event.target).hasClass('fa-plus')) {
      if(indx === 0 && !ipAddresses[0]) return;
      else if(indx > 0 && !ipAddresses[indx]) return;
      ipAddresses.push('');
    } else if($(event.target).hasClass('fa-minus')) {
      if(ipAddresses.length === 1) ipAddresses[0] = '';
      else ipAddresses.splice(indx, 1);
    }
    this.setState({
      ipAddresses,
      devices: ipAddresses[0] === '' ? null : devices
    });
  }
  style = () => {
    const { searchLabel, devices } = this.state;
    return {
      main: { width: 350, float: 'left' },
      mainpaper: { background: '#d7dddd' },
      rbtn: { width: 350 },
      rbdiv: {
        display: searchLabel ? 'none': 'block'
      },
      cdiv: {
        marginLeft: 360,
        width: 900,
        display: devices ? 'block': 'none'
      },
      card: { marginBottom: 10 }
    }
  }
  _searchPanel = searches => {
    return searches.map((search:any, i:number) => {
      return (
        <div key={i}>
          <div style={{ marginLeft: '10px' }}>
            <TextField hintText='10.255.2.*'
              name={`ip_${i}`}
              underlineShow={true}
              floatingLabelFixed={true}
              floatingLabelText='IP Address'
              floatingLabelStyle={{ font: '18px helvetica' }}
              style={{ left: 0, width: 230 }}
              value={search}
              onChange={this.handleSearchChange} />
            <IconButton
              style={{
                position: 'relative',
                bottom: 20,
                left: 15
              }}
              className='fa-plus'
              onClick={e => this.queryClick(e, i)}>
              <FontIcon className='fa fa-plus fa-lg' color='green' />
            </IconButton>
            <IconButton
              className='fa-minus'
              style={{
                position: 'relative',
                bottom: 20,
                left: 10
              }}
              onClick={e => this.queryClick(e, i)}>
              <FontIcon className='fa fa-minus fa-lg' color='red' />
            </IconButton>
          </div>
          <Divider style={{ borderBottom: 'solid 1px black' }} />
        </div>
      );
    });
  }
  _addrsquery = (cucm:any, o:any, modelNum) => {
    let devices:any;
    return cucm.createRisDoc(o).then((doc:any) => {
      return Promise.all([
        cucm.risquery({ body: doc, modelNum }),
        cucm.query(devAssQuery.replace('%user%', cucm.profile.username), true)
      ]).then((resp: any) => {
        devices = resp[0];
        let associations = resp[1];
        return Promise.reduce(Object.keys(devices), (a: any, types: string) => {
          return Promise.map(devices[types], ({ name }:any, i) => {
            if(!associations.find(({ devicename }) => devicename === name)) {
              devices[types][i]['associated'] = false;
              a.push(name);
            } else {
              devices[types][i]['associated'] = true;
            }
            return a;
          }, {concurrency:1})
        }, []).then((results) => {
          this.setState({ devices: cucm.models });
          return;
          // return Promise.each(results, (devicename:string) =>
          //   cucm.update(
          //     updDevAssoc
          //       .replace('%devicename%', devicename)
          //       .replace('%userid%', cucm.profile.username)
          //   ))
        });
      });
    })
  }
  _search = () => {
    this.setState({ searchLabel: '' });
    let {
      ipAddresses, account: {username, password, host, version}
    } = this.state,
      { modelNum } = this.props;
    let cucm = new Cucm({ host, version, username, password });
    cucm.models = null;
    let devices: any;
    return Promise.each(ipAddresses, (addrs:string) => {
      let risdoc: any = { doc: risDoc, ip: addrs },
          newAddresses = [];
      return this._addrsquery(cucm, risdoc, modelNum);
    }).then(() => {
      this.setState({ devices: cucm.models, searchLabel: 'Search' });
    })
  }
  computeTableHeight = devices => {
    if(devices.length <= 2) return '100px';
    else if(devices.length >= 3 && devices.length <= 7) return '250px';
    else if(devices.length > 7) return '350px';
  }
  selectRow = rows => {
    let { devices } = this.state;
    if(rows === 'all') {
      devices.forEach((device: any) => {
        device.checked = true;
        return;
      });
    } else if(rows === 'none') {
      devices.forEach((device: any) => {
        device.checked = false;
        return;
      })
    } else {
      devices.forEach((device: any, i: number) => {
        if(device.checked && rows.findIndex(row => i === row) === -1) {
          device.checked = false;
          this.setState({ devices });
          return;
        }
        rows.forEach((row: number) => {
          if(row === i) {
            device.checked = true;
            this.setState({ devices });
            return;
          }
        });
      });
    }
  }
  _renderTable = devices => {
    return (
      <Table height={this.computeTableHeight(devices)}
        fixedHeader={true}
        selectable={true}
        multiSelectable={true}
        onRowSelection={this.selectRow} >
        <TableHeader displaySelectAll={true}
          adjustForCheckbox={true}
          enableSelectAll={true} >
          <TableRow>
            <TableHeaderColumn>IP Address</TableHeaderColumn>
            <TableHeaderColumn>Name</TableHeaderColumn>
            <TableHeaderColumn>Type</TableHeaderColumn>
            <TableHeaderColumn>ITL Cleared</TableHeaderColumn>
            <TableHeaderColumn>Device Association</TableHeaderColumn>
          </TableRow>
        </TableHeader>
        <TableBody displayRowCheckbox={true}
          deselectOnClickaway={true}
          stripedRows={true} >
          {devices.map((device:any, i:number) => (
            <TableRow key={i} selected={device.checked}>
              <TableRowColumn>{device.ip}</TableRowColumn>
              <TableRowColumn>{device.name}</TableRowColumn>
              <TableRowColumn>{device.model}</TableRowColumn>
              <TableRowColumn>
                {
                  device.cleared ?
                    <FontIcon className='fa fa-check-circle-o' color='green' /> :
                    <FontIcon className='fa fa-times-circle fa-2x' color='red' />
                }
              
              </TableRowColumn>
              <TableRowColumn>
                {
                  device.associated ?
                    <FontIcon className='fa fa-check' color='green' /> :
                    <FontIcon className='fa fa-times fa-2x' color='red' />
                }
              </TableRowColumn>
              
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
  render() {
    let { ipAddresses, account, devices, searchLabel } = this.state,
        disabled = (account && ipAddresses[0]) ? false : true;
    return (
      <div>
        <div style={this.style().main}>
          <Paper zDepth={4} style={this.style().mainpaper}>
            { this._searchPanel(this.state.ipAddresses) }
          </Paper>
          <RaisedButton style={this.style().rbtn} label={searchLabel}
            icon={
              <div style={this.style().rbdiv}>
                <i className="fa fa-cog fa-spin fa-lg fa-fw"></i>
                <span className="sr-only">Loading...</span>
              </div>} 
            disabled={disabled}
            onClick={this._search} />
        </div>
        <div style={this.style().cdiv}>
          {
            this.state.devices ? 
              Object.keys(this.state.devices).map((type, i) => {
                if(this.state.devices[type].length === 0) return;
                return (
                  <Card key={i} style={this.style().card}
                    initiallyExpanded={true}
                    onExpandChange={() => this.setState({ devices })} >
                    <CardHeader title={`Cisco ${type}`}
                      subtitle={`Total: ${devices[type].length}`}
                      avatar={`./images/${type}.jpg`}
                      actAsExpander={true}
                      showExpandableButton={true} />
                    <CardText expandable={true}>
                      {this._renderTable(devices[type])}
                    </CardText>
                  </Card>
                );
              })
              :
              <div></div>
          }
        </div>
      </div>
    );
  }
}