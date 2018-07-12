import {
  React, $, Promise, Cucm, Paper,
  RaisedButton, risDoc, Card,
  CardHeader, CardText,
  devAssQuery, Component
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

  update = (updates: any, action) => {
    let { devices, selectedDevices } = this.state,
      { device, img, cmd } = updates;
    const index = selectedDevices.findIndex(d =>
      d.deviceName === device.deviceName);
    if(cmd.sequenceId === 1) {
      const currentImg = selectedDevices[index].img;
      this.jtapi.handleImgWrite({
        device,
        img: currentImg,
        index: 0
      });
    }
    devices[device.type][device.index].cleared = action;
    this.setState({ devices });
    if(img) {
      let image = this.processImg(img);
      if(index >= 0) selectedDevices[index]['img'] = image;
    } else if(action && action !== 'in progress') {
      this.getImg(device).then(img => {
        this.jtapi.handleImgWrite({
          device,
          img,
          index: cmd.sequenceId + 1
        });
        if(index >= 0) selectedDevices[index]['img'] = img;
        selectedDevices[index]['done'] = action;
        const notDone = selectedDevices.filter(sd => !sd.done);
        let executeJobLabel = '';
        if(notDone.length === 0) {
          console.log('done');
          this.jtapi.provider.disconnectProvider();
          this.jtapi.runner.removeAllListeners('update');
          this.jtapi.runner.removeAllListeners('update-end');
          executeJobLabel = 'Execute Job';
        }
        return this.setState({ selectedDevices, executeJobLabel });
      });
    }
    this.setState({ selectedDevices });
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
      mainpaper: { background: '#CFD8DC' },
      rbtn: { width: 350 },
      rbdiv: {
        display: searchLabel ? 'none': 'block'
      },
      execdiv: {
        display: executeJobLabel ? 'none' : 'block'
      },
      cdiv: {
        position: 'absolute',
        top: 75,
        left: 355,
        width: 900,
        display: devices ? 'block': 'none'
      },
      card: {
        border: '1px solid #B0BEC5',
        marginBottom: 10,
        backgroundColor: '#CFD8DC'
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

  handleJobChange = (e, indx, selectedMacros) => {
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

  processImg = img => `data:image/png;base64,` +
    Buffer.from(img, 'binary').toString('base64');

  getImg = device => this.jtapi
    .getBackground(device.ip)
    .then(bg => !bg ? null : this.processImg(bg));

  executeMacro = () => {
    this.setState({
      executeJobLabel: ''
    });
    const {
      selectedMacros, devices, selectedDevices
    } = this.state;
    const { account } = this.props;
    setTimeout(() => {
      this.jtapi.runner.on('update', updates =>
        this.update(updates, 'in progress'));
      this.jtapi.runner.on('update-end', (updates: any) =>
        this.update(updates, true));
    }, 500);
    this.jtapi.run({
      account,
      macros: selectedMacros,
      devices: selectedDevices
    });
  }

  searchIcon = () => (
    <div style={this.style().rbdiv}>
      <i className='fa fa-cog fa-spin fa-lg fa-fw' />
    </div>
  );

  execIcon = () => (
    <div style={this.style().execdiv}>
      <i className='fa fa-circle-o-notch fa-spin fa-lg fa-fw' />
    </div>
  );

  render() {
    let {
      ipAddresses, devices,
      searchLabel, job, macros,
      selectedMacros, selectedDevices,
      executeJobLabel
    } = this.state;
    const { account } = this.props;
    this.jtapi.account = account;
    const disabled = (account && ipAddresses[0]) ? false : true;
    return (
      <div>
        <MacroSelector
          values={selectedMacros}
          macros={macros}
          change={this.handleJobChange}
        />
        <div style={this.style().main}>
          <Paper zDepth={4} style={this.style().mainpaper}>
            <SearchPanel
              searches={ipAddresses}
              changed={this.handleSearchChange}
              query={this.queryClick}
              cr={this._search}
            />
          </Paper>
          <RaisedButton style={this.style().rbtn} label={searchLabel}
            icon={this.searchIcon()}
            disabled={disabled}
            disabledBackgroundColor='#ECEFF1'
            onClick={this._search} />
          <RaisedButton
            label={executeJobLabel}
            icon={this.execIcon()}
            disabled={devices && selectedMacros.length > 0 ? false : true}
            disabledBackgroundColor='#ECEFF1'
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
                if(devices[type].length === 0) return;
                return (
                  <Card
                    zDepth={0}
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
    let { devices, selectedDevices } = this.state;
    this.setState({ devices });
    const selected = devs.reduce((a: any, d: any, idx) => {
      const match = selectedDevices.find(sd => sd.deviceName === d.name);
      if(!d.checked) {
        if(match) {
          // Remove from SelectedDevices
          a.splice(
            selectedDevices.findIndex(sd => sd.deviceName === d.name),
            1
          );
        }
        return a;
      }
      if(selectedDevices.length > 0 && match) return a;
      if(d.img) {
        d.img = this.processImg(d.img);
      }
      a.push({
        type,
        index: idx,
        ip: d.ip,
        model: d.model,
        deviceName: d.name,
        done: false,
        img: d.img || undefined
      });
      return a;
    }, selectedDevices);
    this.setState({ selectedDevices });
    // return Promise.map(selected, (sel: any) => {
    //   return this.getImg({ ip: sel.ip })
    //     .then(img => {
    //       sel['img'] = img;
    //       return sel;
    //     });
    // }).then(selectedDevices => {
    //   devices[type] = devs;
    //   this.setState({ selectedDevices, devices });
    // });
  }
}