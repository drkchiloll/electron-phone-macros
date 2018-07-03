import {
  React, Component, Card,
  CardHeader, CardText, Paper,
  phone, Avatar, List, ListItem, blueGrey200,
  Dialog, Promise, Checkbox, SelectableList,
  RaisedButton, MacroForm, Api, IconButton
} from './index';
import RemoveMacro from 'material-ui/svg-icons/content/clear';
import { macroDb } from '../lib/macro-db';

export class PhoneMacros extends Component<any, any> {
  constructor(props) {
    super(props);
    this.state = {
      macros: [],
      newMacro: false,
      clickedMacro: null
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

  render() {
    const { macros, newMacro, clickedMacro } = this.state;
    return (
      <div>{
        newMacro ?
          <MacroForm
            macro={clickedMacro}
            close={this.closeMacro}
          /> :
          <div>
            <RaisedButton label='Add New Macro' style={this.styles.addbtn}
              onClick={() => this.setState({ newMacro: true })} />
            {
              macros.map((m: any, i: number) =>
                <Card
                  key={m._id}
                  style={this.styles.card}
                  initiallyExpanded={false}
                  onExpandChange={() => {
                    this.setState({
                      newMacro: true,
                      clickedMacro: m
                    });
                  }}
                >
                  <CardHeader
                    title={m.name}
                    actAsExpander={true}
                    showExpandableButton={false}
                    subtitle={`Cisco ${m.types.join(', Cisco ')}`}
                  />
                  <IconButton
                    tooltip='Remove Macro'
                    tooltipPosition='bottom-left'
                    iconStyle={{ height: 15, width: 15 }}
                    style={{ position: 'absolute', top: 0, right: 0 }}
                    onClick={e => {
                      macroDb.remove(m._id).then(() => {
                        macros.splice(i, 1);
                        this.setState({ macros });
                      });
                    }}
                  >
                    <RemoveMacro />
                  </IconButton>
                </Card>
              )
            }
          </div>
        }
      </div>
    );
  }

  styles: any = {
    addbtn: { marginTop: 15 },
    card: {
      position: 'relative',
      margin: '10px 0 10px 0',
      width: 650
    }
  }
}