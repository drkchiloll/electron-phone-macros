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
                id={`search_field_${i}`}
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
                iconClassName='fa fa-plus'
                iconStyle={{color: 'green'}}
                style={{position: 'absolute', bottom: 15, right: 32}}
                onClick={e => this.props.query(e, i)}
              />
              <IconButton className='fa-minus'
                iconClassName='fa fa-minus'
                iconStyle={{ color: 'red' }}
                style={{position: 'absolute', bottom: 15, right: 0}}
                onClick={e => this.props.query(e, i)}
              />
            </div>
          </div>
        )}
      </div>
    )
  }
}