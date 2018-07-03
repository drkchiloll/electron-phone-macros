import {
  React, Component, TextField, IconButton, FontIcon, Divider
} from './index';

export class SearchPanel extends Component<any, any> {
  render() {
    const { searches } = this.props;
    return (
      <div>
        { searches.map((s: any, i: number) =>
          <div key={i}>
            <div style={{marginLeft: '10px', position: 'relative'}}>
              <TextField
                hintText='10.255.2.*'
                name={`ip_${i}`}
                underlineShow={true}
                floatingLabelFixed={true}
                floatingLabelText='IP Address'
                floatingLabelStyle={{ font: '18px helvetica' }}
                style={{ left: 0, width: 230 }}
                value={s}
                onChange={this.props.changed}
              />
              <IconButton className='fa-plus'
                style={{position: 'absolute', bottom: 15, right: 30}}
                onClick={e => this.props.query(e, i)}
              >
                <FontIcon className='fa fa-plus fa-lg' color='green' />
              </IconButton>
              <IconButton className='fa-minus'
                style={{position: 'absolute', bottom: 15, right: 0}}
                onClick={e => this.props.query(e, i)}
              >
                <FontIcon className='fa fa-minus fa-lg' color='red' />
              </IconButton>
            </div>
          </div>
        )}
      </div>
    )
  }
}