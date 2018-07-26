import * as React from 'react';
import { Drawer, IconButton, RefreshIndicator } from 'material-ui';
import ReloadIcon from 'material-ui/svg-icons/av/loop';
import CloseIcon from 'material-ui/svg-icons/navigation/close';

import { updateService as updator } from '../lib/updator';

export class Update extends React.Component<any, any> {
  state = {
    message: 'Checking for Updates...',
    updated: false,
    didUpdate: false
  }

  componentWillMount() {
    let message: string;
    if(this.props.update) {
      updator.start().then(didUpdate => {
        console.log(didUpdate);
        console.log('I am trying to update..hahahah');
        if(didUpdate) {
          message = 'App Update Completed';
        } else {
          message = 'You have the Latest Version';
        }
        this.setState({ updated: true, didUpdate, message });
      });
    }
  }

  render() {
    const { update } = this.props;
    let { updated, message, didUpdate } = this.state;
    return (
      <Drawer open={update} openSecondary={true}
        width={365}
        containerStyle={{
          position: 'absolute',
          top: 0,
          height: 70,
          border: '1px solid black',
          borderRadius: '6px',
          right: update ? window.innerWidth / 2.8 : -1
        }} >
        <h4 style={{ marginLeft: '25px', width: 200 }} >
          {message}
        </h4>
        {
          updated && didUpdate ?
            <IconButton onClick={() => window.location.reload()}
              tooltip='reload'
              tooltipPosition='bottom-center'
              tooltipStyles={{ top: 25 }}
              style={{
                position: 'absolute',
                top: 8,
                left: 280
              }} >
              <ReloadIcon />
            </IconButton> :
            !updated ?
              <RefreshIndicator size={20} loadingColor='black'
                status='loading'
                top={18}
                left={265} /> :
              updated && !didUpdate ?
                <IconButton onClick={() => this.props.close()}
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 20,
                    height: 30,
                    width: 30
                  }}
                  tooltip='close'
                  tooltipPosition='bottom-left'
                  tooltipStyles={{ top: 25 }} >
                  <CloseIcon />
                </IconButton> :
                null
        }
      </Drawer>
    )
  }
}