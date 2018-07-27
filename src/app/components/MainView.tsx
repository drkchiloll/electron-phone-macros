import {
  React, $, Promise, Cucm, Paper,
  RaisedButton, Card,
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
import { shell } from 'electron';
import { mainState } from '../lib/main-state';

export class MainView extends Component<any, any> {
  public jtapi = jtapi;
  constructor() {
    super();
    this.state = mainState.init();
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
      devices[device.type][device.index].cleared = action;
      this.setState({ devices });
      if(img) {
        let image = this.processImg(img);
        if(index >= 0) selectedDevices[index]['img'] = image;
      } else if(action && action !== 'in progress') {
        return this.getImg(device).then(image => {
          this.jtapi.handleImgWrite({
            device,
            img: (() => {
              if(!image) return null;
              let i = image.replace('data:image/png;base64,', '');
              return Buffer.from(i, 'base64').toString('binary');
            })(),
            index: cmd.sequenceId + 1,
            cmd: { description: 'Resulting ScreenShot' }
          });
          if(index >= 0) selectedDevices[index]['img'] = image;
          selectedDevices[index]['done'] = action;
          const notDone = selectedDevices.filter(sd => !sd.done);
          let executeJobLabel = '';
          if(notDone.length === 0) {
            console.log('done');
            this.jtapi.provider.disconnectProvider();
            this.jtapi.runner.removeAllListeners('update');
            this.jtapi.runner.removeAllListeners('update-end');
            executeJobLabel = 'Execute Job';
            this.jtapi.createDoc().then(filename => {
              this.setState({ openDoc: true, docx: filename });
            });
          }
          return this.setState({ selectedDevices, executeJobLabel });
        });
      }
      this.setState({ selectedDevices });
    // })
  }

  getMacros = macroDb
    .get().then(macros => this.setState({ macros }))

  updateMacros = macros => this.setState({ macros });

  handleSearchChange = ({index, search}) => {
    let { ipAddresses } = this.state;
    ipAddresses[index] = search;
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
      if(devices && Object.keys(devices).length > 0) this.search();
    }
    this.setState({
      ipAddresses,
      devices: ipAddresses[0] === '' ? null : devices,
      selectedDevices: []
    });
  }

  style: any = () => {
    const { searchLabel, devices, executeJobLabel } = this.state;
    return {
      main: { width: 450 },
      mainpaper: { background: '#CFD8DC', borderRadius: '4%' },
      rbtn: { width: 350 },
      rbdiv: {
        display: searchLabel ? 'none': 'block'
      },
      execdiv: {
        display: executeJobLabel ? 'none' : 'block'
      },
      cdiv: {
        position: 'absolute',
        top: 0,
        left: 455,
        width: 900,
        display: devices ? 'block': 'none'
      },
      card: {
        border: '1px solid #B0BEC5',
        marginBottom: 10,
        backgroundColor: '#CFD8DC',
        boxShadow: 0
      },
      gdiv: {
        marginTop: 5,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        width: 450
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

  search = () => {
    let { ipAddresses, modelNum, selectedMacros, devices } = this.state;
    if(ipAddresses.length === 1 && !ipAddresses[0]) {
      this.setState({ devices: null, selectedDevices: [] });
      return;
    }
    this.setState({ searchLabel: '' });
    let filteredTypes: any;
    if(selectedMacros.length > 0) {
      let types = selectedMacros.reduce((a: any[], { types }) => {
        a = a.concat(types);
        return a;
      }, []);
      filteredTypes = modelNum.filter(({ modelname }) => {
        let model = modelname.split(' ')[1];
        return types.find(t => model.includes(t.substring(0, 2)));
      })
    } else {
      filteredTypes = modelNum;
    }
    const { account } = this.props;
    mainState.searchWork({
      account,
      addresses: ipAddresses,
      types: filteredTypes,
      phones: devices,
      jtapi: this.jtapi
    });
    mainState.workEmitter
      .on('devices-tokeep', devices => this.setState({ devices }));
    mainState.workEmitter
      .on('device-update', devices => this.setState({devices}));
    mainState.workEmitter
      .on('work-error', err =>
        this.setState({devices: null, searchLabel: 'Search'}));
    mainState.workEmitter
      .on('dev-upcomplete', phones => {
        this.setState({
          devices: phones,
          searchLabel: 'Search'
        });
      });
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
    `${Buffer.from(img).toString('base64')}`

  getImg = device => this.jtapi
    .getBackground(device.ip, device.model)
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
      <i style={{color: '#B0BEC5'}}
        className='fa fa-cog fa-spin fa-lg fa-fw'
      />
    </div>
  );

  execIcon = () => (
    <div style={this.style().execdiv}>
      <i style={{ color: '#B0BEC5' }}
        className='fa fa-circle-o-notch fa-spin fa-lg fa-fw'
      />
    </div>
  );

  render() {
    let {
      ipAddresses, devices,
      searchLabel, job, macros,
      selectedMacros, selectedDevices,
      executeJobLabel, openDoc, docx
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
        <div style={{position: 'relative'}}>
          <div style={this.style().main}>
            <Paper zDepth={1} style={this.style().mainpaper}>
              <SearchPanel
                searches={ipAddresses}
                changed={this.handleSearchChange}
                query={this.queryClick}
                cr={this.search}
              />
            </Paper>
            <RaisedButton style={this.style().rbtn} label={searchLabel}
              icon={this.searchIcon()}
              disabled={disabled}
              fullWidth={true}
              disabledBackgroundColor='#ECEFF1'
              onClick={this.search} />
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
                  {selectedDevices.map((d: any) => {
                    return (
                      <GridTile
                        style={{ height: mainState.gridHeight(d.model) }}
                        key={d.deviceName}
                        title={<strong>{d.deviceName}</strong>}
                        titleStyle={this.style().tilestyle}
                        titleBackground={this.style().tbg}
                      >
                        <img width={450} src={d.img} alt='background' />
                      </GridTile>
                    )
                  })}
                </GridList>
              </div> :
              null
            }
            {
              openDoc ?
                <RaisedButton
                  label='Open Results'
                  style={this.style().rbtn}
                  primary={true}
                  fullWidth={true}
                  onClick={() => {
                    shell.openItem(docx);
                    setTimeout(() => {
                      return this.jtapi.removeFile(docx)
                        .then(() => this.setState(mainState.init()));
                    }, 25000)
                  }}
                /> : null
            }
          </div>
          <div style={this.style().cdiv}>
            {
              devices ?
                Object.keys(devices).map((type, i) => {
                  if(!devices || devices[type].length === 0) return;
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
                          check={searchLabel ? true : false}
                          renderLoader={d => {
                            if(d instanceof Array) {
                              this.handleSelectionLoad(d, type);
                            } else {
                              d['type'] = type;
                              this.handleSelectLoad(d);
                            }
                          }}
                          devices={devices[type]}
                          updateSelection={
                            devs => this.handleSelect(type, devs)
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
      </div>
    );
  }

  handleSelectionLoad = (devs, type) => {
    let timer = 1500;
    if(devs.length === 1) timer = 0;
    setTimeout((devices, t) => {
      let { selectedDevices } = this.state;
      devices.forEach((d, indx) => {
        d['type'] = t;
        d['index'] = indx;
        const existing = selectedDevices.find(sd =>
          sd.deviceName === d.deviceName)
        if(!existing) {
          selectedDevices.push(d);
        }
      });
      this.setState({ selectedDevices });
    }, timer, devs, type)
  }

  handleSelectLoad = dev => {
    let { selectedDevices } = this.state;
    selectedDevices.push(dev);
    this.setState({ selectedDevices });
  }

  handleSelect = (type, devs) => {
    let { devices, selectedDevices } = this.state;
    this.setState({ devices });
    const selected = devs.reduce((a: any, d: any, idx) => {
      const index = selectedDevices.findIndex(sd =>
        sd.deviceName === d.name);
      if(!d.checked) {
        if(index !== -1) {
          a.splice(index, 1);
        }
        return a;
      }
      if(index !== -1) {
        selectedDevices[index]['img'] = d.img;
        return a;
      }
      return a;
    }, selectedDevices);
    this.setState({ selectedDevices: selected });
  }
}