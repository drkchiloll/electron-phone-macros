import {
  React, Component, Paper,
  IconButton
} from './index';
import { Row, Col } from 'react-flexbox-grid';
import ClearSequence from 'material-ui/svg-icons/content/clear';
import EditSequence from 'material-ui/svg-icons/image/edit';

export class MacroSequences extends Component<any, any> {
  render() {
    const { cmd, remove, edit } = this.props;
    // name, description, displayName
    return (
      <Paper zDepth={2}
        className='seq-paper'
        style={{
          position: 'relative',
          width: 970,
          height: 60,
          margin: '7px 0px 7px 7px',
          backgroundColor: '#29B6F6'
        }}
      >
        <IconButton
          tooltip='Remove This Sequence'
          tooltipPosition='bottom-left'
          style={{ position: 'absolute', top: 0, right: 0 }}
          onClick={() => remove(cmd.id)} >
          <ClearSequence style={{ height: 20, width: 20 }} />
        </IconButton>
        <div style={{
            position: 'absolute',
            top: 12,
            right: 40,
            height: 22,
            width: '1px',
            borderRight: '.5px solid black'
          }}
        />
        <IconButton
          tooltip='Edit Sequence'
          tooltipPosition='bottom-left'
          style={{ position: 'absolute', top: 0, right: 35 }}
          onClick={() => edit(cmd)} >
          <EditSequence style={{ height: 20, width: 20 }} />
        </IconButton>
        <div style={{ marginLeft: '10px' }}>
          <Row>
            <Col sm={4}>
              <div style={{ marginTop: '22px', borderRight: 'solid 1px black' }}>
                {cmd.displayName}
              </div>
            </Col>
            <Col sm={5}>
              <div style={{ marginTop: '22px' }}>
                {cmd.description}
              </div>
            </Col>
          </Row>
        </div>
      </Paper>
    );
  }
}
