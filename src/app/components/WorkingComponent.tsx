import {
  React, $, Promise, moment, Cucm,
  TextField, Paper, FontIcon, IconButton,
  Divider, RaisedButton, risDoc, Card,
  CardHeader, CardText, Table, TableBody, TableHeader,
  TableHeaderColumn, TableRow, TableRowColumn, devAssQuery,
  updDevAssoc
} from './index';

export class WorkingComponent extends React.Component<any, any> {
  constructor() {
    super();
    this.state = {
      ipAddresses: [''],
      account: null,
      searchLabel: 'Search',
      devices: null
    };
    this._search = this._search.bind(this);
    this._renderTable = this._renderTable.bind(this);
  }
  componentWillMount() {
    this.props.api.get().then((recs:any) => {
      this.setState({
        account: recs.filter((r:any) => r.selected)[0]
      });
    });
  }
  _searchPanel(searches) {
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
              style={{ left: 0 }}
              value={search}
              onChange={(e:any, value:string) => {
                let { ipAddresses } = this.state,
                    searchIdx = e.target.name.split('_')[1];
                ipAddresses[searchIdx] = value;
                this.setState({ ipAddresses });
              }} />
            <IconButton
              style={{
                position: 'relative',
                left: 15,
                bottom: 20
              }}
              className='fa-plus'
              onClick={(e) => {
                let { ipAddresses } = this.state;
                if($(e.target).hasClass('fa-plus')) {
                  // Do not allow the Additional Search Box if Current Box is Undefined
                  if(i===0 && !ipAddresses[0]) return;
                  else if(i > 0 && !ipAddresses[i]) return;
                  ipAddresses.push('');
                }
                this.setState({ ipAddresses });
              }}>
              <FontIcon className='fa fa-plus fa-lg' color='green' />
            </IconButton>
            <IconButton
              className='fa-minus'
              style={{
                position: 'relative',
                left: 15,
                bottom: 20
              }}
              onClick={(e) => {
                let { ipAddresses } = this.state;
                if($(e.target).hasClass('fa-minus')) {
                  if (ipAddresses.length === 1) ipAddresses[0] = '';
                  else ipAddresses.splice(i, 1);
                }
                this.setState({
                  ipAddresses,
                  devices: ipAddresses[0] === '' ? null : this.state.devices });
              }}>
              <FontIcon className='fa fa-minus fa-lg' color='red' />
            </IconButton>
          </div>
          <Divider style={{ borderBottom: 'solid 1px black' }} />
        </div>       
      );
    });
  }
  _search() {
    this.setState({ searchLabel: '' });
    let {
      ipAddresses, account: {username, password, host, version}
    } = this.state,
      { modelNum } = this.props;
    let cucm = new Cucm({ host, version, username, password });
    cucm.models = null;
    let devices: any;
    return Promise.each(ipAddresses, (addrs) => {
      return cucm.createRisDoc({ doc: risDoc, ip: addrs }).then((doc) => {
        // console.log(doc);
        return Promise.all([
          cucm.risquery({ body: doc, modelNum }),
          cucm.query(devAssQuery.replace('%user%', cucm.profile.username), true)
        ]).then((resp:any) => {
          devices = resp[0];
          let associations = resp[1];
          return Promise.reduce(Object.keys(devices), (a:any, types:string) => {
            devices[types].forEach(({name}:any, i:number) => {
              if(!associations.find(({ devicename }) => devicename === name)) {
                devices[types][i]['associated'] = false;
                a.push(name);
              } else {
                devices[types][i]['associated'] = true;
              }
            });
            return a;
          }, []).then((results) => {
            return;
            // return Promise.each(results, (devicename:string) =>
            //   cucm.update(
            //     updDevAssoc
            //       .replace('%devicename%', devicename)
            //       .replace('%userid%', cucm.profile.username)
            //   ))
          });
        });
      });
    }).then(() => {
      this.setState({ devices, searchLabel: 'Search' });
    })
  }
  _renderTable(devices) {
    let height:string;
    if(devices.length <= 2) height = '100px';
    else if(devices.length >= 3 && devices.length <= 7) height = '250px';
    else if(devices.length > 7) height = '350px';
    return (
      <Table height={height}
        fixedHeader={true}
        selectable={true}
        multiSelectable={true}
        onRowSelection={(rows:any) => {
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
            devices.forEach((device:any, i:number) => {
              if(device.checked && rows.findIndex((row:number) => i===row) === -1) {
                device.checked = false;
                this.setState({ devices: this.state.devices });
                return;
              }
              rows.forEach((row:number) => {
                if(row === i) {
                  device.checked = true;
                  this.setState({ devices: this.state.devices });
                  return;
                }
              });
            });
          }
        }} >
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
    let { ipAddresses, account, devices } = this.state,
        disabled = (account && ipAddresses[0]) ? false : true;
    return (
      <div>
        <div style={{width: 380, float: 'left'}}>
          <Paper zDepth={4} style={{ background: '#d7dddd' }}>
            { this._searchPanel(this.state.ipAddresses) }
          </Paper>
          <RaisedButton style={{ width: 380}} label={this.state.searchLabel}
            icon={
              <div style={{ display: this.state.searchLabel ? 'none': 'block' }}>
                <i className="fa fa-cog fa-spin fa-lg fa-fw"></i>
                <span className="sr-only">Loading...</span>
              </div>} 
            disabled={disabled}
            onClick={this._search} />
        </div>
        <div style={{
          marginLeft: 400,
          width: 990,
          display: this.state.devices ? 'block' : 'none',
        }}>
          {
            this.state.devices ? 
              Object.keys(this.state.devices).map((type, i) => {
                if(this.state.devices[type].length === 0) return;
                return (
                  <Card key={i} style={{marginBottom: 10}}
                    initiallyExpanded={true}
                    onExpandChange={() => {
                      this.setState({ devices: this.state.devices });
                    }} >
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