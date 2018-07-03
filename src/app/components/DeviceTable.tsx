import {
  React, Component, Table, TableBody, TableHeader,
  TableHeaderColumn, TableRow, TableRowColumn,
  FontIcon
} from './index';
import { IconButton, CircularProgress } from 'material-ui';

export class DeviceTable extends Component<any, any> {
  constructor() {
    super();
  }
  _tableHeader = () => [
      'IP Address', 'Name', 'Type', 'Device Association', 'Job Status'
    ].map(item =>
      <TableHeaderColumn
        style={{ width: item==='Name' ? 155 : 100 }}
        key={item}
      >
        {item}
      </TableHeaderColumn>
    );

  handleRowSelect = selections => {
    // all none Number[]
    let { devices } = this.props;
    devices = devices.map((d, indx) => {
      if(selections === 'all') d.checked = true;
      else if(selections === 'none') d.checked = false;
      else {
        const match: number = selections.indexOf(indx);
        if(d.checked) {
          if(match === -1) d.checked = false;
        } else {
          if(match !== -1) d.checked = true;
        }
      }
      return d;
    })
    this.props.updateSelection(devices);
  }

  render() {
    const { devices } = this.props;
    return (
      <Table height={'auto'}
        fixedHeader={true}
        selectable={true}
        multiSelectable={true}
        onRowSelection={this.handleRowSelect}
      >
        <TableHeader
          displaySelectAll={true}
          adjustForCheckbox={true}
          enableSelectAll={true}
        >
          <TableRow>{this._tableHeader()}</TableRow>
        </TableHeader>
        <TableBody
          displayRowCheckbox={true}
          deselectOnClickaway={false}
          stripedRows={true} >
          {devices.map((device: any, i: number) => (
            <TableRow
              key={i}
              selectable={device.associated ? true : false}
              selected={device.checked}
            >
              <TableRowColumn>{device.ip}</TableRowColumn>
              <TableRowColumn style={{width: 155}}>{device.name}</TableRowColumn>
              <TableRowColumn >{device.model}</TableRowColumn>
              <TableRowColumn>
                {device.associated ?
                  <FontIcon className='fa fa-check fa-lg' /> :
                  <FontIcon className='fa fa-times fa-2x' />
                }
              </TableRowColumn>
              <TableRowColumn>
                {device.cleared === 'in progress' ?
                  <FontIcon className='fa fa-spinner fa-spin fa-lg fa-fw' /> :
                 device.cleared ?
                  <FontIcon className='fa fa-check' /> :
                  <FontIcon className='fa fa-times-circle fa-2x' />
                }
              </TableRowColumn>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }
}