import {
  React, Component, TextField, IconButton, FontIcon, Divider,
  AutoComplete
} from './index';
const storage = localStorage;

export class SearchPanel extends Component<any, any> {
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
      (search.split('.').length === 3 &&
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
    this.props.query(e, index);
  }
  render() {
    const { searches } = this.props;
    return (
      <div>
        { searches.map((s: any, i: number) =>
          <div key={i} style={{border: '1px solid #B0BEC5'}}>
            <div style={{marginLeft: '10px', position: 'relative'}}>
              <AutoComplete
                id={`search_field_${i}`}
                autoFocus
                searchText={s}
                hintText='10.255.2.* (wildcard)'
                dataSource={this.remember()}
                name={`ip_${i}`}
                menuProps={{desktop:true,disableAutoFocus:true}}
                onUpdateInput={(search, data) => {
                  this.handleInput(search, i);
                }}
                onNewRequest={this.addToMemory}
              />
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
                onClick={e => this.props.query(e, i)}
              />
            </div>
          </div>
        )}
      </div>
    )
  }
}