import {
  React, $, Promise, moment, Cucm,
  TextField, Paper, FontIcon, IconButton,
  Divider, RaisedButton, risDoc, Card,
  CardHeader, CardText, Table, TableBody,
  TableHeader, TableHeaderColumn, TableRow,
  TableRowColumn, devAssQuery, updDevAssoc,
  Component, Subheader
} from './index';
import { GridList, GridTile } from 'material-ui';

import { DeviceTable } from './DeviceTable';
import { SearchPanel } from './SearchPanel';
import { MacroSelector } from './MacroSelector';
import { ModelEnum } from '../lib/model-db';
import { macroDb } from '../lib/macro-db';
import { jtapi } from '../lib/jtapi';

export class MainView extends Component<any, any> {
  public jtapi = jtapi;
  constructor() {
    super();
    this.state = {
      ipAddresses: [''],
      account: null,
      searchLabel: 'Search',
      devices: null,
      modelNum: null,
      job: 'Select Job(s) to Run:',
      macros: [],
      selectedMacros: [],
      selectedDevices: [],
      devicesWithImages: [],
      executeJobLabel: 'Execute Job'
    };
  }

  componentWillUnmount() {
    console.log('I unmounted');
  }

  componentDidMount() {
    if(this.props.account) {
      this.setState({ account: this.props.account });
    }
    Promise.all([
      ModelEnum.get().then(modelNum => this.setState({ modelNum })),
      this.getMacros
    ]);
  }

  updateEvents = (updates: any, action) => {
    let { devices, selectedDevices } = this.state,
      { account: { username, password }} = this.props,
      { device, img } = updates;
    if(updates.responseMessage === 'no resp') {
      setTimeout((dev) => {
        this.jtapi.getBackground({
          url: `http://${device.ip}/CGI/Screenshot`,
          method: 'get',
          responseType: 'arraybuffer',
          auth: { username, password }
        }).then(img => this.updateEvents({
          device: dev, img, responseMessage: undefined
        }, 'update-end'));
      }, 3500, device);
    }
    if(img) {
      let image = `data:image/png;base64,` +
        `${Buffer.from(img, 'binary').toString('base64')}`;
      const indx = selectedDevices.findIndex(d =>
        d.deviceName === device.deviceName)
      if(indx >= 0) selectedDevices[indx]['img'] = image;
    }
    devices[device.type][device.index].cleared = action;
    this.setState({ devices, selectedDevices });
  }

  getMacros = macroDb
    .get()
    .then(macros => this.setState({ macros }))

  updateMacros = macros => this.setState({ macros });

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

  style: any = () => {
    const { searchLabel, devices, executeJobLabel } = this.state;
    return {
      main: { width: 350 },
      mainpaper: { background: '#d7dddd' },
      rbtn: { width: 350 },
      rbdiv: {
        display: searchLabel ? 'none': 'block'
      },
      execdiv: {
        display: executeJobLabel ? 'none' : 'block'
      },
      cdiv: {
        position: 'absolute',
        top: 49,
        left: 355,
        width: 900,
        display: devices ? 'block': 'none'
      },
      card: {
        marginBottom: 10
      },
      gdiv: {
        marginTop: 20,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        width: 350
      },
      glist: {
        display: 'flex',
        flexWrap: 'nowrap',
        overflowX: 'auto'
      },
      tilestyle: {
        color: '#18FFFF',
      },
      tbg: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.3) 70%,rgba(0,0,0,0) 100%)'
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
    let { ipAddresses, modelNum, selectedMacros } = this.state;
    let filteredTypes: any;
    if(selectedMacros.length > 0) {
      let types = selectedMacros.reduce((a: any[], { types }) => {
        a = a.concat(types);
        return a;
      }, []);
      filteredTypes = modelNum.filter(({modelname}) => {
        let model = modelname.split(' ')[1];
        return types.find(t => model.includes(t.substring(0,2)));
      })
    } else {
      filteredTypes = modelNum;
    }
    const { account: { username, password, host, version } } = this.props;
    let cucm = new Cucm({ host, version, username, password });
    cucm.models = null;
    let devices: any;
    return Promise.each(ipAddresses, (addrs:string) => {
      let risdoc: any = { doc: risDoc, ip: addrs },
          newAddresses = [];
      return this._addrsquery(cucm, risdoc, filteredTypes);
    }).then(() => {
      this.setState({ devices: cucm.models, searchLabel: 'Search' });
    })
  }

  handleJobChange = (e, selectedMacros) => {
    let job: any;
    if(selectedMacros.length > 0) {
      job = selectedMacros
        .map(m => m.name)
        .join(', ');
    } else {
      job = 'Select Job(s) to Run:';
    }
    this.setState({ selectedMacros, job })
  }

  executeMacro = () => {
    this.setState({
      executeJobLabel: ''
    });
    const {
      selectedMacros, devices, selectedDevices
    } = this.state;
    const { account } = this.props;
    this.jtapi.run({
      account,
      macros: selectedMacros,
      devices: selectedDevices
    }).then(() => {
      this.setState({
        executeJobLabel: 'Execute Job'
      });
    })
    setTimeout(() => {
      this.jtapi.runner.on('update', updates =>
        this.updateEvents(updates, 'in progress'));
      this.jtapi.runner.on('update-end', (updates: any) =>
        this.updateEvents(updates, true));
    }, 500);
  }

  render() {
    let {
      ipAddresses, devices,
      searchLabel, job, macros,
      selectedMacros, selectedDevices,
      executeJobLabel
    } = this.state;
    const { account } = this.props;
    const disabled = (account && ipAddresses[0]) ? false : true;
    return (
      <div>
        <MacroSelector
          values={selectedMacros}
          macros={macros}
          change={this.handleJobChange}
        />
        <strong
          style={{
            position: 'absolute',
            top: 15,
            left: 40
          }}>{job}</strong>
        <div style={this.style().main}>
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
                <i className='fa fa-cog fa-spin fa-lg fa-fw'/>
                <span className='sr-only'>Loading...</span>
              </div>}
            disabled={disabled}
            onClick={this._search} />
          <RaisedButton
            label={executeJobLabel}
            icon={
              <div style={this.style().execdiv}>
                <i className='fa fa-circle-o-notch fa-spin fa-lg fa-fw' />
                <span className='sr-only'>Loading...</span>
              </div>}
            disabled={devices && selectedMacros.length > 0 ? false : true}
            backgroundColor='#607D8B'
            labelColor='#FAFAFA'
            fullWidth={true}
            onClick={this.executeMacro} />
          {selectedDevices.length > 0 ?
            <div style={this.style().gdiv}>
              <GridList style={this.style().glist}
                cellHeight={225}
                cols={1}
              >
                {selectedDevices.map((d: any) =>
                  <GridTile
                    key={d.deviceName}
                    title={<strong>{d.deviceName}</strong>}
                    titleStyle={this.style().tilestyle}
                    titleBackground={this.style().tbg}
                  >
                    <img width={350} src={d.img} alt='background' />
                  </GridTile>)}
              </GridList>
            </div> :
            null
          }
        </div>
        <div style={this.style().cdiv}>
          {
            devices ?
              Object.keys(devices).map((type, i) => {
                // console.log(type);
                if(devices[type].length === 0) return;
                return (
                  <Card
                    key={i}
                    style={this.style().card}
                    initiallyExpanded={true}
                  >
                    <CardHeader title={`Cisco ${type}`}
                      subtitle={`Total: ${devices[type].length}`}
                      avatar={`./images/${type}.jpg`}
                      actAsExpander={true}
                      showExpandableButton={true} />
                    <CardText expandable={true}>
                      <DeviceTable
                        devices={devices[type]}
                        updateSelection={
                          devs => this.handleDeviceSelect(type, devs)
                        }
                      />
                    </CardText>
                  </Card>
                );
              })
              :
              null
          }
        </div>
      </div>
    );
  }

  handleDeviceSelect = (type, devs) => {
    let { devices } = this.state;
    this.setState({ devices });
    let { account: {username, password} } = this.props;
    return Promise.reduce(devs, (a: any, d: any, idx) => {
      if(!d.checked) return a;
      return this.jtapi.getBackground({
        url: `http://${d.ip}/CGI/Screenshot`,
        method: 'get',
        responseType: 'arraybuffer',
        auth: { username, password }
      }).then(img => {
        let dprops: any = {
          type,
          index: idx,
          ip: d.ip,
          model: d.model,
          deviceName: d.name
        };
        if(img) dprops['img'] = `data:image/png;base64,` +
          `${Buffer.from(img, 'binary').toString('base64')}`;
        a.push(dprops);
        return a;
      });
    }, []).then(selectedDevices => {
      devices[type] = devs;
      this.setState({ devices, selectedDevices });
    })
  }
}