import {
  React, Component, Subheader,
  Paper, MenuItem, TextField,
  phone, blueGrey500, SelectField,
  RaisedButton, FloatingActionButton,
  blue300, MacroSequences, Api, IconButton
} from './index';
import * as ToggleButton from 'react-toggle-button';
import ContentAdd from 'material-ui/svg-icons/content/add';


export class MacroForm extends Component<any, any> {
  public grid = 6;
  constructor(props) {
    super(props);
    this.state = {
      deviceList: [],
      selectedCmd: '',
      cmdList: [],
      macroName: '',
      sequenceDesc: '',
      testMode: false,
      macro: {
        name: '',
        types: [],
        cmds: [],
      }
    };
  }
  componentDidMount() {
    const { macro } = this.props;
    if(macro) {
      this.setState({
        macroName: macro.name,
        macro,
        deviceList: macro.types
      });
      this.handleSelect(null, null, macro.types);
      this._renderItem(macro.types);
    }
  }
  _renderItem = deviceList => {
    const devices = phone.devices;
    let items = [];
    Object.keys(devices).forEach(k => {
      devices[k].forEach((type: string) => {
        items.push(
          <MenuItem value={type}
            key={type}
            insetChildren={true}
            primaryText={`Cisco ${type}`}
            checked={deviceList && deviceList.indexOf(type) > -1}
            leftIcon={
              deviceList && deviceList.indexOf(type) > -1 ?
                <i className='fa fa-check-square-o fa-lg'
                  style={{marginTop: '5px'}} /> :
                <i className='fa fa-square-o fa-lg'
                  style={{marginTop: '5px'}} />
            }
          />
        );
      });
    });
    return items;
  }
  _renderCmdList = cmdList => {
    return cmdList.map((c: any) => {
      return (
        <MenuItem
          key={c.name}
          value={c.displayName}
          primaryText={c.displayName}
        />
      )
    });
  }
  handleSelect = (e, indx, deviceList) => {
    let cmdList = [];
    if(deviceList.length > 0) {
      let type = deviceList[deviceList.length - 1];
      type = type.substring(0, 2) + '00';
      cmdList = phone.commands(type);
    }
    this.setState({ deviceList, cmdList });
  }
  addCommand = (e, indx, value) => {
    if(!value) return;
    this.setState({ selectedCmd: value });
  }
  handleInputs = (e, value) => {
    if(e.target.name === 'macroName')
      this.setState({ macroName: value });
    else this.setState({ sequenceDesc: value });
  }
  addSequence = () => {
    let {
      selectedCmd, cmdList,
      macro, sequenceDesc
    } = this.state;
    let command: any;
    if(macro.cmds.find(c => c.editing)) {
      command = JSON.parse(JSON.stringify(cmdList.find((c: any) =>
        c.displayName === selectedCmd)));
      command['description'] = sequenceDesc;
      command['editing'] = false;
      if(command.type === 'key') {
        command.name = `Key:${command.name}`;
      } else {
        command.name = `Init:${command.name}`;
      }
      let curIndx = macro.cmds.findIndex(c => c.editing);
      command['sequenceId'] = curIndx + 1;
      macro.cmds[curIndx] = command;
    } else {
      command = JSON.parse(JSON.stringify(cmdList.find((c: any) =>
        c.displayName === selectedCmd)));
      command['description'] = sequenceDesc;
      command['sequenceId'] = macro.cmds.length + 1;
      if(command.type === 'key') {
        command.name = `Key:${command.name}`;
      } else {
        command.name = `Init:${command.name}`;
      }
      macro.cmds.push(command);
    }
    this.setState({
      selectedCmd: '',
      sequenceDesc: '',
      macro
    });
  }
  editSequenceItem = cmd => {
    this.setState({
      selectedCmd: cmd.displayName,
      sequenceDesc: cmd.description
    });
    let { macro } = this.state;
    macro.cmds.forEach(c => {
      if(c.sequenceId === cmd.sequenceId) {
        c['editing'] = true;
      }
    })
  }
  removeSequence = id => {
    let { macro } = this.state;
    let cmds = JSON.parse(JSON.stringify(macro.cmds));
    let remove = cmds.findIndex(c => c.sequenceId === id);
    cmds.splice(remove, 1);
    if(cmds.length > 0) {
      cmds.forEach((c, i) => c['sequenceId'] = i+1);
      macro['cmds'] = cmds;
    } else {
      macro['cmds'] = [];
    }
    this.setState({ macro });
  }
  saveMacro = () => {
    let {
      macro, deviceList, macroName
    } = this.state;
    macro.types = deviceList;
    macro.name = macroName;
    phone.saveMacro(macro);
    this.props.close();
  }
  render() {
    const {
      deviceList, selectedCmd, cmdList,
      macroName, sequenceDesc, macro, testMode
    } = this.state;
    return (
      <div>
        <Paper zDepth={1} style={this.styles.mpaper}>
          <IconButton
            tooltip='BACK'
            tooltipPosition='bottom-right'
            tooltipStyles={{ top: 25 }}
            iconClassName='fa fa-hand-o-left'
            onClick={() => this.props.close()}
          />
          <IconButton
            tooltip='Save'
            tooltipPosition='bottom-right'
            tooltipStyles={{ top: 25 }}
            iconClassName='fa fa-floppy-o'
            onClick={this.saveMacro} />
          <div style={{ position: 'absolute', top: 12, right:20 }}>
            <span style={{marginLeft:-10, fontSize:'.95em'}}>
              Test Mode
            </span><br/>
            <ToggleButton
              activeLabel='ON'
              inactiveLabel='OFF'
              value={testMode}
              thumbStyle={{borderRadius:2}}
              trackStyle={{borderRadius:2}}
              onToggle={testMode => this.setState({testMode: !testMode })}
            />
          </div>
          <div style={this.styles.pridiv}>
            <TextField
              name='macroName'
              value={macroName}
              onChange={this.handleInputs}
              style={this.styles.name}
              floatingLabelFixed={true}
              floatingLabelText='Name of Macro' />
            <SelectField
              style={this.styles.selectDev}
              floatingLabelFixed={true}
              floatingLabelText='Device Type Selections'
              multiple={true}
              value={deviceList}
              onChange={this.handleSelect}
            >
              { this._renderItem(deviceList) }
            </SelectField>
            <br/>
            <SelectField
              style={this.styles.selectcmd}
              floatingLabelFixed={true}
              floatingLabelText='Command List'
              value={selectedCmd}
              onChange={this.addCommand} >
              { this._renderCmdList(cmdList)}
            </SelectField>
            <TextField
              name='sequenceDesc'
              value={sequenceDesc}
              onChange={this.handleInputs}
              style={this.styles.cmddesc}
              floatingLabelFixed={true}
              floatingLabelText='Description of Command to Macro' />
            <FloatingActionButton mini={true}
              backgroundColor={blueGrey500}
              style={this.styles.fltbtn1}
              onClick={this.addSequence}
            >
              <ContentAdd />
            </FloatingActionButton>
            <br/>
            {
              macro.cmds.length > 0 ?
                <MacroSequences
                  macro={macro}
                  remove={this.removeSequence}
                  edit={this.editSequenceItem}
                  updateMacro={(macro) => this.setState({ macro })} /> :
                null
            }
          </div>
        </Paper>;
      </div>
    );
  }
  styles: any = {
    mpaper: {
      position: 'relative',
      marginTop: '10px',
      width: 880,
      height: '100%',
      overflow: 'auto'
    },
    pridiv: {
      padding: 0,
      marginLeft: '15px',
      marginBottom: '15px'
    },
    name: { width: 300, marginRight: 45 },
    selectDev: {
      position: 'absolute',
      top: 48,
      left: 335,
      width: 500
    },
    selectcmd: {
      width: 300,
      marginTop: '10px',
      marginBottom: '10px'
    },
    cmddesc: {
      width: 500,
      position: 'absolute',
      left: 335,
      top: 130
    },
    fltbtn1: {
      position: 'absolute',
      left: 830,
      top: 150
    }
  }
}
