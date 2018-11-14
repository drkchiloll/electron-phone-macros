import {
  React, Component, TextField, IconButton, FontIcon, Divider,
  AutoComplete
} from './index';
const storage = localStorage;

export class SearchInputPanel extends Component<any, any> {
  public carriageTimeout;
  addToMemory = (req, indx) => {
    this.carriageTimeout = setTimeout(() => this.props.cr(), 1500);
  }
  remember = () => {
    let memory = JSON.parse(storage.getItem('memory'));
    if(!memory) {
      storage.setItem('memory', JSON.stringify([]));
      memory = [];
    }
    return memory;
  }
  handleInput = (search, index) => {
    let memory = this.remember();
    if(search.includes('*') ||
      (search.split('.').length === 4 &&
       search.split('.')[3])) {
      if(memory.findIndex(m => m === search) === -1)
        memory.unshift(search);
      if(memory.length > 10) memory.pop();
      storage.setItem('memory', JSON.stringify(memory));
    }
    this.props.changed({ index, search });
  };
  addToQuery = (e, index) => {
    clearTimeout(this.carriageTimeout);
    this.props.updatePanel(e, index);
  }
  render() {
    const { searches, searching } = this.props;
    return (
      <div>
        { searches.map((s: any, i: number) =>
          <div key={i} style={{border: '1px solid #B0BEC5'}}>
            <div style={{marginLeft: '10px', position: 'relative'}}>
              <AutoComplete
                id={`search_field_${i}`}
                autoFocus
                searchText={s}
                errorText={(() => {
                  if(!s) return '';
                  if(s.includes('*') || s.split('.').length === 4) {
                    const tmp = s.split('.');
                    const tmpLen = tmp.length;
                    let ip: string;
                    if(tmpLen === 4 && s.includes('*')) {
                      ip = tmp[0]+'.'+tmp[1]+'.'+tmp[2]+'.1'
                    } else if(tmpLen === 3) {
                      ip = `${tmp[0]}.${tmp[1]}.1.1`
                    } else if(tmpLen === 4) {
                      ip = s;
                    }
                    const re = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/;
                    return re.test(ip) ? '' : 'improperly formatted ip address';
                  }
                })()}
                hintText='10.255.2.* (wildcard)'
                dataSource={this.remember()}
                name={`ip_${i}`}
                menuProps={{desktop:true,disableAutoFocus:true}}
                onUpdateInput={(search, data) => {
                  this.handleInput(search, i);
                }}
                onNewRequest={this.addToMemory}
              />
              {
                i === searches.length - 1 ?
                  <IconButton
                    style={{ position: 'absolute', bottom: 2, right: 65 }}
                    iconClassName={
                      !searching ?
                        'fa fa-spinner fa-spin':
                        'fa fa-search fa-lg'
                    }
                    iconStyle={{ color: !s ? 'grey': 'blue' }}
                    disabled={(() => {
                      if(!s) return true;
                      return false;
                    })()}
                    onClick={this.props.cr}
                  /> : null
              }
              <IconButton className='fa-plus'
                iconClassName='fa fa-plus'
                iconStyle={{color: 'green'}}
                style={{position: 'absolute', bottom: 2, right: 32}}
                onClick={e => this.addToQuery(e, i)}
              />
              <IconButton className='fa-minus'
                iconClassName='fa fa-minus'
                iconStyle={{ color: 'red' }}
                style={{position: 'absolute', bottom: 2, right: 0}}
                onClick={e => this.props.updatePanel(e, i)}
              />
            </div>
          </div>
        )}
      </div>
    )
  }
}