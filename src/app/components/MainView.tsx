import {
  React, $, Promise, moment, Cucm,
  TextField, Paper, FontIcon, IconButton,
  Divider, RaisedButton, risDoc, Card,
  CardHeader, CardText, Table, TableBody, TableHeader,
  TableHeaderColumn, TableRow, TableRowColumn, devAssQuery,
  updDevAssoc, Component, Subheader
} from './index';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import { DeviceTable } from './DeviceTable';
import { SearchPanel } from './SearchPanel';
import { join } from 'path';
import * as java from 'java';
import { ModelEnum } from '../lib/model-db';
import { macroDb } from '../lib/macro-db';

export class MainView extends Component<any, any> {
  constructor() {
    super();
    this.state = {
      ipAddresses: [''],
      account: null,
      searchLabel: 'Search',
      devices: null,
      modelNum: null,
      job: 'Select Job(s) to Run:',
      macros: null
    };
  }
  componentDidMount() {
    if(this.props.account) {
      this.setState({
        account: this.props.account
      });
    }
    Promise.all([
      ModelEnum.get().then(modelNum => this.setState({ modelNum })),
      macroDb.get().then(macros => this.setState({ macros }))
    ])
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
    let { ipAddresses, modelNum } = this.state;
    const { account: { username, password, host, version } } = this.props;
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
  render() {
    let { ipAddresses, devices, searchLabel, job } = this.state;
    const { account } = this.props;
    const disabled = (account && ipAddresses[0]) ? false : true;
    return (
      <div>
        <div style={this.style().main}>
          <IconButton>
            <MoreVertIcon />
          </IconButton> <strong>{job}</strong>
          <Paper zDepth={4} style={this.style().mainpaper}>
            <SearchPanel
              searches={ipAddresses}
              changed={this.handleSearchChange}
              query={this.queryClick}
            />
          </Paper>
          <RaisedButton style={this.style().rbtn} label={searchLabel}
            icon={
              <div style={this.style().rbdiv}>
                <i className="fa fa-cog fa-spin fa-lg fa-fw"></i>
                <span className="sr-only">Loading...</span>
              </div>} 
            disabled={disabled}
            onClick={this._search} />
          <RaisedButton
            label='Execute Job'
            fullWidth={true}
            onClick={() => {
              const classPath = join(__dirname, '../src/app/dataterminal_11_0');
              java.classpath.push(classPath);
              const JtapiPeerFactory = java.import('javax.telephony.JtapiPeerFactory');
              JtapiPeerFactory.getJtapiPeer(null, (err, peer) => {
                const provider = `${account.host};login=${account.username}` +
                  `;passwd=${account.password}`;
                peer.getProvider(provider, (err, jtapiProvider) => {
                  console.log(err);
                  console.log(jtapiProvider);
                })
              })
            }} />
        </div>
        <div style={this.style().cdiv}>
          {
            devices ?
              Object.keys(devices).map((type, i) => {
                if(devices[type].length === 0) return;
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
                      <DeviceTable devices={devices[type]} />
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