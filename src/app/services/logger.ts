import { createLogger, transports, format } from 'winston';
const { combine, timestamp, prettyPrint } = format;

export class Log {
  static create(path) {
    return createLogger({
      transports: [ new transports.File({
        level: 'info',
        filename: path
      }) ],
      format: combine(
        timestamp(),
        prettyPrint()
      )
    });
  }
}