import {
  React, Component, Table, TableBody, TableHeader,
  TableHeaderColumn, TableRow, TableRowColumn,
  FontIcon
} from './index';

export class DeviceTable extends Component<any, any> {
  constructor() {
    super();
  }
  computeTableHeight = devices => {
    if(devices.length <= 2) return '100px';
    else if(devices.length >= 3 && devices.length <= 7) return '250px';
    else if(devices.length > 7) return '350px';
  }
  _tableHeader = () => [
      'IP Address', 'Name', 'Type', 'Device Association', 'ITL Cleared'
    ].map(item =>
      <TableHeaderColumn
        style={{ width: item==='Name' ? 155 : 100 }}
        key={item}
      >
        {item}
      </TableHeaderColumn>
    );

  render() {
    const { devices } = this.props;
    return (
      <Table height={this.computeTableHeight(devices)}
        fixedHeader={true}
        selectable={true}
        multiSelectable={true}
        onRowSelection={() => {}}
      >
        <TableHeader
          displaySelectAll={true}
          adjustForCheckbox={true}
          enableSelectAll={true}
        >
          <TableRow>{this._tableHeader()}</TableRow>
        </TableHeader>
        <TableBody displayRowCheckbox={true}
          deselectOnClickaway={true}
          stripedRows={true} >
          {devices.map((device: any, i: number) => (
            <TableRow key={i} selected={device.checked} displayBorder={true}>
              <TableRowColumn>{device.ip}</TableRowColumn>
              <TableRowColumn style={{width: 155}}>{device.name}</TableRowColumn>
              <TableRowColumn >{device.model}</TableRowColumn>
              <TableRowColumn>
                {device.associated ?
                  <FontIcon className='fa fa-check' color='green' /> :
                  <FontIcon className='fa fa-times fa-2x' color='red' />
                }
              </TableRowColumn>
              <TableRowColumn>
                {device.cleared ?
                  <FontIcon className='fa fa-check-circle-o' color='green' /> :
                  <FontIcon className='fa fa-times-circle fa-2x' color='red' />
                }
              </TableRowColumn>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }
}