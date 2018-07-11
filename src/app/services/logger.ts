import { join } from 'path';
import { createLogger, transports, format, Logger } from 'winston';
const { combine, prettyPrint, timestamp } = format;
import * as moment from 'moment';

export class Log {
  static create(path, options={}) {
    return createLogger({
      transports: [ 
        new transports.File({
          level: 'info',
          filename: path,
          ...options
        })
      ],
      format: combine(
        timestamp({
          format: moment().format('YYYY-MM-DD HH:mm:ss')
        }),
        prettyPrint()
      )
    });
  }
}
const logpath = process.platform === 'win32' ?
  `C:\\PhoneMacros\\logs` : __dirname;
export const errorLog: Logger = Log.create(
  join(logpath, './errors.log'), {
    maxsize: 2048,
    zippedArchive: true,
    maxFiles: 10
  }
);

