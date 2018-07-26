import {
  React, Component, TextField, IconButton, FontIcon, Divider,
  AutoComplete
} from './index';
const storage = localStorage;

export class SearchPanel extends Component<any, any> {
  addToMemory = (req, indx) => {
    let memory = this.remember();
    if(memory.findIndex(m => m === req) === -1) {
      if(memory.length === 0) memory.push(req);
      else memory.unshift(req);
      if(memory.length > 10) memory.pop();
      storage.setItem('memory', JSON.stringify(memory));
    }
    this.props.cr();
  }
  remember = () => {
    let memory = JSON.parse(storage.getItem('memory'));
    if(!memory) {
      storage.setItem('memory', JSON.stringify([]));
      memory = [];
    }
    return memory;
  }
  render() {
    const { searches } = this.props;
    // console.log(searches);
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
                  this.props.changed({
                    index: i,
                    search
                  });
                }}
                onNewRequest={this.addToMemory}
              />
              <IconButton className='fa-plus'
                iconClassName='fa fa-plus'
                iconStyle={{color: 'green'}}
                style={{position: 'absolute', bottom: 2, right: 32}}
                onClick={e => this.props.query(e, i)}
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