import {
  React, Component, Card,
  CardHeader, CardText, Paper,
  phone, Avatar, List, ListItem, blueGrey200,
  Dialog, Promise, Checkbox, SelectableList,
  RaisedButton, MacroForm, Api, IconButton
} from './index';
import * as ToggleButton from 'react-toggle-button';
import { MacroTester } from './MacroTester';
import RemoveMacroIcon from 'material-ui/svg-icons/content/clear';
import { macroDb } from '../lib/macro-db';
import * as robot from 'robotjs';

export class PhoneMacros extends Component<any, any> {
  constructor(props) {
    super(props);
    this.state = {
      macros: [],
      newMacro: false,
      clickedMacro: null,
      testMode: false,
      mouse: null
    };
  }
  componentDidMount() {
    this.getMacros();
  }

  getMacros = () => {
    macroDb.get()
      .then(macros => this.setState({ macros }))
      .then(() => {
        macroDb.macroEvent.on('m-add', this.updateMacros);
        macroDb.macroEvent.on('m-update', this.updateMacros);
        macroDb.macroEvent.on('m-remove', this.updateMacros);
      })
  }

  updateMacros = macros => {
    this.setState({ macros });
  }
  
  closeMacro = () => {
    this.setState({
      newMacro: false,
      clickedMacro: null,
    });
    this.getMacros();
  }

  cardExpandChange = (state, macro) => {
    let { clickedMacro } = this.state;
    if(!clickedMacro) this.setState({ clickedMacro: macro });
    else {
      if(!state && macro.name === clickedMacro.name) {
        this.setState({ clickedMacro: null });
      } else if(state && macro.name !== clickedMacro.name) {
        this.setState({ clickedMacro: macro });
      }
    }
  }

  addMacro = () => {
    let { macros } = this.state;
    macros.unshift({
      _id: 'temp',
      name: '',
      types: ['8800'],
      cmds: []
    })
    const mouse = robot.getMousePos();
    this.setState({ macros });
    setTimeout((m) => {
      robot.moveMouseSmooth(m.x, m.y+50)
      robot.mouseClick();
    }, 500, mouse)
  }

  render() {
    const { macros, newMacro, clickedMacro, testMode } = this.state;
    return (
      <div>
          <div style={{position: 'relative'}}>
            <div style={{ position: 'absolute', top: 5, left: 865 }}>
              <span style={{ marginLeft: -10, fontSize: '.95em' }}>
                Test Mode
            </span><br />
              <ToggleButton
                activeLabel='ON'
                inactiveLabel='OFF'
                value={testMode}
                thumbStyle={{ borderRadius: 2 }}
                trackStyle={{ borderRadius: 2 }}
                onToggle={testMode => this.setState({ testMode: !testMode })}
              />
            </div>
            <RaisedButton label='Add New Macro' style={this.styles.addbtn}
              onClick={this.addMacro} />
            
            {
              macros.map((m: any, i: number) =>
                <Card
                  key={m._id}
                  style={this.styles.card}
                  initiallyExpanded={false}
                  onExpandChange={state => this.cardExpandChange(state, m)}
                >
                  <CardHeader
                    title={m.name}
                    avatar='images/8800.jpg'
                    actAsExpander={true}
                    showExpandableButton={false}
                    subtitle={`Cisco ${m.types.join(', Cisco ')}`}
                  />
                  <IconButton
                    tooltip='Remove Macro'
                    tooltipPosition='bottom-left'
                    iconStyle={{ height: 15, width: 15 }}
                    style={{ position: 'absolute', top: 0, right: 0 }}
                    onClick={(e) => this.removeMacro(m, i)}
                  >
                    <RemoveMacroIcon />
                  </IconButton>
                  <CardText expandable={true}>
                    <MacroForm macro={m} account={this.props.account} />
                  </CardText>
                </Card>
              )
            }
          </div>
        <div style={{ position: 'relative' }}>
          {
            !testMode ? null :
              <MacroTester
                account={this.props.account}
                macro={clickedMacro} />
          }
        </div>
      </div>
    );
  }

  removeMacro = (m, i) => {
    let { macros } = this.state;
    macroDb.remove(m._id).then(() => {
      macros.splice(i, 1);
      this.setState({ macros });
    });
  }

  styles: any = {
    addbtn: { marginTop: 15 },
    card: {
      position: 'relative',
      margin: '10px 0 10px 0',
      width: 920,
      backgroundColor: '#B0BEC5'
    }
  }
}