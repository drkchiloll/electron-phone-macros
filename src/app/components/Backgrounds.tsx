import {
  React, Component, Card,
  CardHeader, CardText, Paper,
  phone, Avatar, List, ListItem, blueGrey200,
  Dialog, Promise, SelectableList,
  RaisedButton, MacroForm
} from './index';
import { remote } from 'electron';
let bwin;

export class Backgrounds extends Component<any, any> {
  constructor(props) {
    super(props);
    this.state = { devices: [] };
  }
  queryBackground = () => {
    const { host } = this.props.account;
    const devices: any = phone.backgrounds();
    return Promise.reduce(devices, (a: any, d: any) => {
      return phone.backgroundSearch({
        host, path: d.folder
      }).then(types => {
        if(!types) return a;
        d.backgrounds = types;
        a.push(d);
        this.setState({ devices: a });
        return a;
      })
    }, [])
  }
  getImgAvatar = type => {
    if(type.includes('79')) return '7900.jpg';
    else if(type.includes('89')) return '9900.jpg';
    else if(type.includes('88')) return '8800.jpg';
  }
  saveJob = () => {
    const { devices } = this.state;
    phone.saveBgMacro(devices);
  }
  _renderDevices = devices => {
    const { host } = this.props.account;
    return devices.map((d: any, i: number) => {
      return (
        <Paper zDepth={2} key={`toplevel_${i}`}
          style={{ marginBottom: 10 }} >
          <SelectableList
            value={
              d.selectedIndx > -1 ? d.selectedIndx : -1
            }
            selectedItemStyle={{ backgroundColor: blueGrey200 }} >
            <ListItem primaryText={`Cisco ${d.types.join(' ')}`}
              key={d.types[0]}
              leftAvatar={
                <Avatar size={43}
                  src={`./images/${this.getImgAvatar(d.types[0])}`}
                />
              }
              initiallyOpen={false}
              primaryTogglesNestedList={true}
              nestedItems={(() => {
                if(d.backgrounds && d.backgrounds.length > 0) {
                  return d.backgrounds.map((b: any, i: number) => {
                    if(b.imgPreview === 'not found') return;
                    return (
                      <ListItem key={d.types[0] + '_' + i}
                        onClick={() => {
                          d.selectedImg = b.name
                          d.selectedIndx = i;
                          this.setState({ devices });
                        }}
                        onDoubleClick={() => {
                          if(d.selectedIndx === i) {
                            d.selectedIndx = -1;
                            this.setState({ devices });
                          }
                        }}
                        onMouseOut={() => {
                          setTimeout((browserWindow) => {
                            if(browserWindow && !browserWindow.isDestroyed())
                              bwin.close();
                          }, 1500, bwin)
                        }}
                        value={i}
                        primaryText={b.name}
                        leftAvatar={
                          <Avatar src={'data:image/png;base64,' +
                            `${Buffer.from(b.imgPreview, 'binary').toString('base64')}`}
                            size={40}
                            onClick={() => {
                              phone.getBackground({
                                url: `http://${host}:6970${b.image}`
                              }).then(image => {
                                setTimeout(img => {
                                  if(bwin && !bwin.isDestroyed()) bwin.close();
                                  const tip = new Buffer(img, 'binary').toString('base64');
                                  bwin = new remote.BrowserWindow({
                                    height: 450, width: 600, frame: false
                                  });
                                  bwin.loadURL(`data:image/png;base64,${tip}`);
                                }, 500, image)
                              })
                            }} />
                        } />
                    )
                  })
                } else return [];
              })()} />
          </SelectableList>
        </Paper>
      );
    })
  }
  render() {
    const { devices } = this.state;
    const { account } = this.props;
    return (
      <Card style={this.styles.card}
        initiallyExpanded={false}
        onExpandChange={this.queryBackground}
      >
        <CardHeader title='Bulk Background Change'
          avatar={<i className='fa fa-picture-o fa-lg' />}
          actAsExpander={true}
          showExpandableButton={true} />
        <CardText expandable={true} >
          {
            devices && devices.length > 0 ?
              this._renderDevices(devices) :
              null
          }
          <RaisedButton label='Save'
            onClick={this.saveJob} />
        </CardText>
      </Card>
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