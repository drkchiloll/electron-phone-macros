import {
  React, BottomNavigation, BottomNavigationItem,
  Dialog, RaisedButton, FlatButton, $, fs, Promise,
  Cucm
} from './index';
import { ExportMacro } from './ExportMacro';
import { macroDb } from '../lib/macro-db';
import { shell } from 'electron';
import { RisQuery } from 'cucm-risdevice-query';
import { mainState } from '../lib/main-state';

const styles:any = {
  nav: {
    position: 'absolute',
    top: 0,
    left: 515,
    height: 75,
    width: 265,
    backgroundColor: '#CFD8DC'
  },
  dialog: {
    width: 600,
    margin: '25px 0 0 25%',
    top: -250
  },
  file: {
    display: 'none'
  }
};

export class FeatureButtons extends React.Component<any, any> {
  constructor() {
    super();
    this.state = {
      filename: 'macros',
      macros: null,
      addmacros: false
    }
  }
  cucm = null;
  _navIcon = cls => {
    return (
      <span className='fa-stack fa-lg' >
        <i className={`fa fa-${cls} fa-lg`} />
      </span>
    );
  }
  _getMacros = () => {
    macroDb.get().then(macros => this.setState({ macros }));
  }
  cancel = () => {
    this.setState({ macros: null });
  }
  _uploadMacros = () => {
    let macroFile = $('#macro-upload').prop('files')[0];
    fs.readFile(macroFile.path, 'utf-8', (err, data) => {
      let macros: any[] = JSON.parse(data);
      return Promise.each(macros, macro => {
        delete macro._id;
        return macroDb.add(macro);
      }).then(() => this.setState({ addmacros: false }));
    });
  }
  render() {
    const { macros, filename, addmacros } = this.state;
    return (
      <div>
        <BottomNavigation style={styles.nav}>
          <BottomNavigationItem
            className='import-macros'
            label='Import Macros'
            icon={this._navIcon('upload')}
            onClick={() => this.setState({ addmacros: true })}
          />
          <BottomNavigationItem
            className='export-macros'
            label='Export Macros'
            icon={this._navIcon('external-link')}
            onClick={this._getMacros}
          />
          <BottomNavigationItem
            className='open-report'
            label='Device Report'
            icon={this._navIcon('file-text-o')}
            onClick={this.runSweep} />
        </BottomNavigation>
        { macros ? <ExportMacro cancel={this.cancel} {...this.state} />: null }
        <Dialog
          open={addmacros}
          title='Import Macros'
          modal={true}
          style={styles.dialog}
          actions={[
            <FlatButton
              label='Cancel'
              primary={true}
              onClick={() => this.setState({ addmacros: false })}
            />
          ]}>
            <RaisedButton
              label='Add'
              containerElement='label'
            >
              <input
                name='mymacro'
                type='file'
                id='macro-upload'
                style={styles.file}
                onChange={this._uploadMacros}
              />
            </RaisedButton>
        </Dialog>
      </div>
    )
  }
  generateQuery = skip => {
    return `select ${skip ? 'skip ' + skip: ''} first 200 d.name as devicename, ` + 
      `d.description, n.dnorpattern as primarydn, t.name as model ` + 
      `from device d\n` +
      `inner join devicenumplanmap dmap on dmap.fkdevice = d.pkid\n` +
      `inner join numplan n on dmap.fknumplan = n.pkid\n` +
      `inner join typemodel t on d.tkmodel = t.enum\n` +
      `where d.tkclass = 1 AND dmap.numplanindex = 1\n` +
      `order by t.name`
  }

  queryRunner = (p: any) => {
    return this.cucm.query(p.statement).then(results => {
      p.devices = p.devices.concat(results);
      if(results.length === 200) {
        let cquery = this.generateQuery(p.skip);
        p.skip = p.skip * 2;
        return this.queryRunner({
          statement: cquery,
          skip: p.skip,
          devices: p.devices
        })
      } else {
        return p.devices;
      }
    });
  }

  deviceHandler = devices => {
    let dees = [];
    return Promise.reduce(devices, (a, d: any, index) => {
      if(a.length === 999) {
        a.push(d.devicename);
        dees.push(a);
        a = [];
      } else {
        a.push(d.devicename);
      }
      if(index === devices.length - 1) {
        dees.push(a);
      }
      return a;
    }, []).then(() => dees);
  }

  runSweep = () => {
    const { account: { username, password, host, version } } = this.props;
    let cquery = this.generateQuery(0);
    let skip: number = 200, devices: any[];
    let newDevices: any = [];
    this.cucm = new Cucm({ ...this.props.account });
    return this.queryRunner({
      statement: cquery,
      skip: 200,
      devices: []
    }).then(devices => {
      return this.deviceHandler(devices).then((deviceNames: any[]) => {
        return Promise.map(deviceNames, (devs: string[]) => {
          const ris = RisQuery.createRisDoc({
            version,
            query: devs,
            options: { status: undefined }
          });
          return this.cucm.risquery({
            body: ris,
            bypass: true
          }).then((risres: any) => {
            const risos = RisQuery.parseResponse(risres);
            risos.forEach((d: any) => {
              const dev = devices.find((device:any) => device.devicename === d.name);
              d.description = dev.description;
              d.model = dev.model;
              newDevices.push(d);
              return;
            });
          })
        }).then(() => {
          mainState.createCsv(newDevices, (csv) => shell.openItem(csv));
        });
      });
    })
  }
}