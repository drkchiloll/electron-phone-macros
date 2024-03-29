import {
  React, Component, Drawer, TextField,
  RaisedButton, AutoComplete, CardMedia,
  CardTitle, Card, CardText, IconButton, FlatButton
} from './index';
import { jtapi } from '../lib/jtapi';
import { GridList, GridTile } from 'material-ui';
import { ModelEnum } from '../lib/model-db';

export class MacroTester extends Component<any, any> {
  public jtapi = jtapi;
  state = {
    request: false,
    deviceInput: false,
    input: '',
    device: {
      name: 'Click to Input Device',
      ip: ''
    },
    slides: [{ img: './images/6900.jpg' }],
    mouse: null
  }

  processImg = img => `data:image/bmp;base64,` +
    Buffer.from(img, 'binary').toString('base64');

  saveDeviceName = () => {
    let { input, slides, mouse } = this.state;
    // slides = [{ img: 'images/loading.gif' }]
    const { account } = this.props;
    this.setState({
      device: {name: input},
      deviceInput: false,
      input: '',
      request: true,
    });
    this.jtapi.deviceQuery({
      account, devices: [input]
    }).then((device: any) => {
      let img = this.processImg(device.img);
      slides = [{ img }];
      this.setState({slides, device});
    });
  }

  getImg = device => this.jtapi
    .getBackground(device.ip, device.model)
    .then(bg => !bg ? null : this.processImg(bg));

  execMacro = () => {
    const { macro, account } = this.props;
    const { username, password } = account;
    const { device, slides, mouse } = this.state;
    this.jtapi.runSingle({account, macro, device});
    this.jtapi.runner.on('update', update => {
      const img = this.processImg(update.img);
      slides.unshift({ img });
      if(slides.length > 10) slides.pop();
      this.setState({ slides });
    });
    this.jtapi.runner.on('update-end', () => {
      this.getImg(device)
        .then(img => {
          if(img != slides[0].img) {
            slides.unshift({ img });
            this.setState({ slides });
          }
        })
    });
  }
  selectionClick = () => {
    let { deviceInput } = this.state;
    this.setState({deviceInput: !deviceInput});
  }
  render() {
    const { deviceInput, device, input, request, slides }: any = this.state;
    return (
      <Drawer
        width={380}
        open={true}
        openSecondary={true}
        containerStyle={this.style.container}
      >
        <Card expanded={deviceInput}>
          <div style={this.style.gdiv} >
            <GridList
              style={this.style.glist}
              cellHeight={250}
              cols={1}
            >
              {slides.map((s:any, i:number) => {
                return (
                  <GridTile key={i}
                    style={{
                      height: device && device.firmware && device.firmware.includes('8832') ?
                        128 : 250
                    }}
                    title={
                      <FlatButton className='legend'
                        label={device.name}
                        onClick={this.selectionClick}
                        labelStyle={{ color: '#C6FF00' }} />
                    }>
                    <img
                      src={s.img}
                      height={(() => {
                        if(device && device.firmware) {
                          if(device.firmware.includes('8832')) return 128;
                        }
                        return 250;
                      })()}
                      width={380}
                    />
                  </GridTile>
                )
              })}
            </GridList>
          </div>
          <CardText expandable={true}
            style={{margin: 1, padding: 1}}>
            <TextField style={this.style.device}
              autoFocus
              value={input}
              hintText='Device SEP012345678901'
              onChange={(e, input) => this.setState({ input })} />
            <IconButton iconClassName='fa fa-floppy-o'
              onClick={this.saveDeviceName} />
          </CardText>
        </Card>
        {
          request ?
          <RaisedButton
            fullWidth={true}
            label='Execute Macro'
            onClick={this.execMacro}
          /> :
          null
        }
      </Drawer>
    );
  }
  style: any = {
    container: {
      top: 150,
      height: 'auto',
      left: 940,
      overflow: 'auto',
      overflowX: 'hidden'
    },
    device: {
      width: 200,
      marginLeft: 10
    },
    title: {
      marginBottom: 3,
      marginLeft: 10,
      fontSize: '.9em',
      color: '#C6FF00'
    },
    gdiv: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-around'
    },
    glist: {
      display: 'flex',
      flexWrap: 'nowrap',
      overflowX: 'auto'
    },
  }
}