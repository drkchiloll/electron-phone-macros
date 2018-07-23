import {
  React, Component, path
} from './index';
import { access, constants } from 'fs';
const { F_OK } = constants;

export class LogViewer extends Component<any, any> {
  componentDidMount() {
    if(process.platform === 'darwin') {
      let logpath = path.join(__dirname, './logs');
      access(logpath, F_OK, err => {
        if(!err) {
          
        }
      });
    }
  }
  render() {
    return (
      <div>Logs</div>
    )
  }
}