const fs = require('fs')
const path = require('path')
const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')

const logDir = 'logs'

class WickrLogger {
  constructor() {
    let level = 'info'
    let maxSize = '10m'
    let maxFiles = '5'
    if (process.env.log_tokens !== undefined) {
      const logTokens = JSON.parse(process.env.log_tokens)
      level = logTokens.LOG_LEVEL
      maxSize = logTokens.LOG_FILE_SIZE
      maxFiles = logTokens.LOG_MAX_FILES
    }
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

  getLogger() {
    return this.logger
  }
}

module.exports = WickrLogger
