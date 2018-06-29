import {
  React, Component, Card,
  CardHeader, CardText, Paper,
  phone, Avatar, List, ListItem, blueGrey200,
  Dialog, Promise, Checkbox, SelectableList,
  RaisedButton, MacroForm, Api, IconButton
} from './index';
import RemoveMacro from 'material-ui/svg-icons/content/clear';
import { macroDb } from '../lib/macro-db';
// import { remote } from 'electron';
// let bwin;

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
  getMacros = () =>
    macroDb.get().then(macros => this.setState({ macros }));
  
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
                  style={{
                    position: 'relative',
                    margin: '10px 0 10px 0',
                    width: 650
                  }}
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
      margin: '10px 0 10px 0',
      width: 1024
    }
  }
}