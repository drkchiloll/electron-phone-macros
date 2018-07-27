import {
  React, Component, Table, TableBody, TableHeader,
  TableHeaderColumn, TableRow, TableRowColumn,
  FontIcon
} from './index';
import { jtapi } from '../lib/jtapi';

export class DeviceTable extends Component<any, any> {
  public jtapi = jtapi;
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

  handleSelectAll = selection => {
    if(selection === 'all' || selection === 'none')
      this.handleRowSelect(selection);
  }

  handleRowSelect = selection => {
    let { devices } = this.props;
    if(selection != 'all' && selection != 'none') {
      let d = devices[selection];
      if(!d.checked) {
        this.props.renderLoader({
          deviceName: d.name,
          ip: d.ip,
          model: d.model,
          done: false,
          img: d.img || undefined,
          index: selection
        });
      }
    } else if(selection === 'all') {
      const DEVICES = devices.map(d =>
        ({
          deviceName: d.name,
          ip: d.ip,
          model: d.model,
          done: false,
          img: d.img || undefined
        }))
      this.props.renderLoader(DEVICES);
    }
    return this.jtapi.deviceTableHandling({devices, selection})
      .then(devs => {
        if(devs) {
          return this.props.updateSelection(devs);
        }
      });
  }

  render() {
    const { devices, check } = this.props;
    return (
      <Table height={'auto'}
        fixedHeader={true}
        selectable={check}
        multiSelectable={true}
        onRowSelection={this.handleSelectAll}
        onCellClick={this.handleRowSelect}
        bodyStyle={{overflowX: 'hidden'}}
        wrapperStyle={{overflowX: 'hidden'}}
      >
        <TableHeader
          displaySelectAll={true}
          adjustForCheckbox={true}
          enableSelectAll={(() => {
            return devices.find((d: any) => !d.associated) ? false : true
          })()}
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
              selectable={device.associated && check ? true : false}
              selected={device.checked}
            >
              <TableRowColumn>
                <div onClick={e => e.stopPropagation()}>
                  {device.ip}
                </div>
              </TableRowColumn>
              <TableRowColumn style={{width: 155}}>
                <div onClick={e => e.stopPropagation()}>
                  {device.name}
                </div>
              </TableRowColumn>
              <TableRowColumn>
                <div onClick={e => e.stopPropagation()}>
                  {device.model}
                </div>
              </TableRowColumn>
              <TableRowColumn>
                <div onClick={e => e.stopPropagation()}>
                  {device.associated ?
                    <FontIcon className='fa fa-check fa-lg' /> :
                    <FontIcon className='fa fa-times fa-2x' />
                  }
                </div>
              </TableRowColumn>
              <TableRowColumn>
                <div onClick={e => e.stopPropagation()}>
                  {device.cleared === 'in progress' ?
                    <FontIcon className='fa fa-spinner fa-spin fa-lg fa-fw' /> :
                  device.cleared ?
                    <FontIcon className='fa fa-check' /> :
                    <FontIcon className='fa fa-times-circle fa-2x' />
                  }
                </div>
              </TableRowColumn>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }
}