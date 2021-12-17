import fs from 'fs'
import path from 'path'

const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')

class WickrLogger {
  constructor(logDir, level, maxSize, maxFiles) {
    if (!fs.existsSync(logDir)) {
      // Create the directory if it does not exist
      fs.mkdirSync(logDir)
    }

    const rotateTransport = new DailyRotateFile({
      filename: path.join(logDir, 'log'),
      datePattern: 'output',
      level,
      maxSize,
      maxFiles,
    })

    const errorTransport = new DailyRotateFile({
      filename: path.join(logDir, 'error'),
      datePattern: 'output',
      maxSize,
      maxFiles,
      level: 'error',
    })

    // transport.on('rotate', function(oldFilename, newFilename) {
    //   // do something fun
    // })

    const logConfiguration = {
      transports: [rotateTransport, errorTransport],
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DDTHH:mm:ss',
        }),
        winston.format.colorize(),
        winston.format.printf(info =>
          info.stack
            ? `${[info.timestamp]} ${info.level}: ${info.message}\n${info.stack}`
            : `${[info.timestamp]} ${info.level}: ${info.message}`
        )
      ),
    }
    this.logger = winston.createLogger(logConfiguration)
  }
}

module.exports = WickrLogger
