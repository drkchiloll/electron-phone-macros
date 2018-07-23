import {
  React, BottomNavigation, BottomNavigationItem,
  Dialog, RaisedButton, FlatButton, $, fs, Promise
} from './index';
import { ExportMacro } from './ExportMacro';
import { macroDb } from '../lib/macro-db';

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
          ]}
        >
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
}