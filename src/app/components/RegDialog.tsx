import {
  React, Component, Dialog, TextField,
  RaisedButton, Subheader, Divider
} from './index';
import { REGISTRATION as registration } from '../lib';

export class RegDialog extends Component<any, any> {
  state = {
    submitLabel: 'Submit',
    reg: {
      id: '',
      user: '',
      email: '',
      company: ''
    },
    registered: false,
    registration: null
  }
  inputs = (e, val) => {
    let { reg } = this.state;
    reg[e.target.name] = val;
    this.setState({ reg });
  }
  registerApp = () => {
    this.setState({ submitLabel: '' });
    const { reg } = this.state;
    return registration.init(reg)
      .then(registration => {
        this.setState({
          registration,
          registered: true
        });
        this.props.subscribe(registration);
      });
  }
  action = () => ([
    <RaisedButton
      style={{display: this.state.registered ? 'inline-block': 'none'}}
      label='Close'
      onClick={this.props.closeReg}
    />,
    <RaisedButton
      style={{display: this.state.registered ? 'none': 'inline-block'}}
      label={this.state.submitLabel}
      icon={
        <i
          style={{
            display: this.state.submitLabel ? 'none': 'inline-block',
            color: '#B0BEC5'
          }}
          className='fa fa-spinner fa-pulse fa-lg fa-fw'
        />
      }
      onClick={this.registerApp}
      disabled={
        this.state.reg.id || this.state.registered ? false :
        this.state.reg.user &&
        this.state.reg.email &&
        this.state.reg.company ? false :
        true
      }
    />
  ]);
  render() {
    const { reg, registration } = this.state;
    return (
      <Dialog
        modal={true}
        open={true}
        actions={this.action()}
      >
        <Subheader>Registration</Subheader>
        <Divider/>
        <div style={this.styles().main}>
          <div style={this.styles().licform}>
            <TextField
              name='id'
              fullWidth={true}
              floatingLabelFixed={true}
              floatingLabelText='License Key'
              onChange={this.inputs}
            />
          </div>
          <div style={this.styles().mainform}>
            <TextField
              name='user'
              fullWidth={true}
              floatingLabelFixed={true}
              floatingLabelText='Your Name'
              onChange={this.inputs}
            />
            <TextField
              name='email'
              fullWidth={true}
              floatingLabelFixed={true}
              floatingLabelText='Email Address'
              onChange={this.inputs}
            />
            <TextField
              name='company'
              fullWidth={true}
              floatingLabelFixed={true}
              floatingLabelText='Company Name'
              onChange={this.inputs}
            />
          </div>
        </div>
        <div style={this.styles().alt}>
          <strong>
            Thank you for registering. Currently this application is
            in Beta. Please take note of your License Key: 
            <span style={{color: 'red'}}>
              {
                (registration && registration.id) ?
                  registration.id.toUpperCase() :
                  ''
              }
            </span>
          </strong>
        </div>
      </Dialog>
    )
  }
  styles = () => {
    const { reg, registered } = this.state;
    return {
      main: {
        display: registered ? 'none': 'inline-block',
        width: 450
      },
      licform: {
        display: reg.user ? 'none': 'inline'
      },
      mainform: {
        display: reg.id ? 'none': 'inline-block'
      },
      alt: {
        display: registered ? 'inline-block': 'none',
        marginTop: 10
      }
    }
  }
}