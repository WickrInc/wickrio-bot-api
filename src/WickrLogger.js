const fs = require('fs')
const path = require('path')
const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')

let logger

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

let level = 'info'
let maxSize = '10m'
let maxFiles = '5'
if (process.env.log_tokens !== undefined) {
  const logTokens = JSON.parse(process.env.log_tokens)
  if (
    typeof logTokens.LOG_LEVEL === 'string' &&
    npmLogLevels.includes(logTokens.LOG_LEVEL)
  ) {
    level = logTokens.LOG_LEVEL
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
  } else {
    console.error(
      `${logTokens.LOG_MAX_FILES} is not a valid number of files. Max number of files set to ${maxSize}`
    )
  }
} else {
  console.error('Log tokens not found in processes.json, using default values')
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
  exitOnError: false,
}

module.exports = logger = winston.createLogger(logConfiguration)
logger.info(
  `WickrLogger setup with Log Level: ${level}, Max File Size: ${maxSize}, and Max Number of files: ${maxFiles}`
)
// module.exports = WickrLogger
