const fs = require('fs')
const path = require('path')
const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')

const logDir = 'logs'
const npmLogLevels = [
  'error',
  'warn',
  'info',
  'http',
  'verbose',
  'debug',
  'silly',
]

class WickrLogger {
  constructor() {
    const settingsObj = this.loggerSettings('info', '10m', 5)
    this.logger = this.createLogger(
      settingsObj.level,
      settingsObj.maxSize,
      settingsObj.maxFiles
    )
  }

  // Pass in default settings so the logger will be created with those if it fails to read from processes.json
  loggerSettings(level, maxSize, maxFiles) {
    let pjson
    try {
      const processes = fs.readFileSync('./processes.json')
      if (!processes) {
        console.error('Error reading processes.json in createLogger!')
      }
      pjson = JSON.parse(processes)
    } catch (err) {
      console.error(err)
    }

    if (pjson.apps[0].env.log_tokens !== undefined) {
      const logTokens = pjson.apps[0].env.log_tokens
      if (
        typeof logTokens.LOG_LEVEL === 'string' &&
        npmLogLevels.includes(logTokens.LOG_LEVEL)
      ) {
        level = logTokens.LOG_LEVEL
        console.log(`Log level set to ${level}`)
      } else {
        console.error(
          `${logTokens.LOG_LEVEL} is not a valid NPM log level. Log level set to ${level}`
        )
      }
      if (
        typeof logTokens.LOG_FILE_SIZE === 'string' &&
        !isNaN(parseFloat(logTokens.LOG_FILE_SIZE))
      ) {
        maxSize = logTokens.LOG_FILE_SIZE
        console.log(`Max file size set to ${maxSize}`)
      } else {
        console.error(
          `${logTokens.LOG_FILE_SIZE} is not a valid max file size. Max file size set to ${maxSize}`
        )
      }
      if (
        typeof logTokens.LOG_MAX_FILES === 'string' &&
        !isNaN(parseFloat(logTokens.LOG_MAX_FILES))
      ) {
        maxFiles = logTokens.LOG_MAX_FILES
        console.log(`Max number of files set to ${maxFiles}`)
      } else {
        console.error(
          `${logTokens.LOG_MAX_FILES} is not a valid number of files. Max number of files set to ${maxSize}`
        )
      }
    } else {
      console.error(
        'Log tokens not found in processes.json, using default values'
      )
    }
    return {
      level,
      maxSize,
      maxFiles,
    }
  }

  createLogger(level, maxSize, maxFiles) {
    console.log('Creating logger')
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
            ? `${[info.timestamp]} ${info.level}: ${info.message}\n${
                info.stack
              }`
            : `${[info.timestamp]} ${info.level}: ${info.message}`
        )
      ),
      exitOnError: false,
    }
    const logger = winston.createLogger(logConfiguration)
    console.log('Logger created')
    logger.info(
      `WickrLogger setup with Log Level: ${level}, Max File Size: ${maxSize}, and Max Number of files: ${maxFiles}`
    )
    return logger
  }
}

module.exports = WickrLogger
