import winston from 'winston'
import 'winston-daily-rotate-file'
import fs from 'fs'
import path from 'path'
import { LOG_LEVEL, LOG_FILE_SIZE, LOG_MAX_FILES } from './constants'
const util = require('util')

const logDir = 'logs'
if (!fs.existsSync(logDir)) {
  // Create the directory if it does not exist
  fs.mkdirSync(logDir)
}


process.env.tokens = JSON.stringify(processesJsonObject.apps[0].env.tokens)
process.env.log_tokens = JSON.stringify(
  processesJsonObject.apps[0].env.log_tokens
)

let LOG_LEVEL
let LOG_FILE_SIZE
let LOG_MAX_FILES

if (process.env.log_tokens === 'undefined') {
  processesJsonObject.apps[0].env.log_tokens = {}
  LOG_LEVEL = {}
  LOG_FILE_SIZE = {}
  LOG_MAX_FILES = {}
  LOG_LEVEL.value = 'info'
  LOG_FILE_SIZE.value = '10m'
  LOG_MAX_FILES.value = '5'
  processesJsonObject.apps[0].env.log_tokens.LOG_LEVEL = {}
  processesJsonObject.apps[0].env.log_tokens.LOG_LEVEL.value = 'info'
  processesJsonObject.apps[0].env.log_tokens.LOG_FILE_SIZE = {}
  processesJsonObject.apps[0].env.log_tokens.LOG_FILE_SIZE.value = '10m'
  processesJsonObject.apps[0].env.log_tokens.LOG_MAX_FILES = {}
  processesJsonObject.apps[0].env.log_tokens.LOG_MAX_FILES.value = '5'
} else {
  let { LOG_LEVEL, LOG_FILE_SIZE, LOG_MAX_FILES } = JSON.parse(
    process.env.log_tokens
  )
  if (LOG_LEVEL?.value === undefined) {
    if (LOG_LEVEL === undefined) {
      processesJsonObject.apps[0].env.log_tokens.LOG_LEVEL = {}
      LOG_LEVEL = {}
    }
    LOG_LEVEL.value = 'info'
    processesJsonObject.apps[0].env.log_tokens.LOG_LEVEL.value = 'info'
  }
  if (LOG_FILE_SIZE?.value === undefined) {
    if (LOG_FILE_SIZE === undefined) {
      processesJsonObject.apps[0].env.log_tokens.LOG_FILE_SIZE = {}
      LOG_FILE_SIZE = {}
    }
    LOG_FILE_SIZE.value = '10m'
    processesJsonObject.apps[0].env.log_tokens.LOG_FILE_SIZE.value = '10m'
  }
  if (LOG_MAX_FILES?.value === undefined) {
    if (LOG_MAX_FILES === undefined) {
      processesJsonObject.apps[0].env.log_tokens.LOG_MAX_FILES = {}
      LOG_MAX_FILES = {}
    }
    LOG_MAX_FILES.value = '5'
    processesJsonObject.apps[0].env.log_tokens.LOG_MAX_FILES.value = '5'
  }
}

try {
  fs.writeFileSync(
    processesJsonFile,
    // Write the JSON object with 2 spaces and indentation
    JSON.stringify(processesJsonObject, null, 2),
    err => {
      if (err) throw err
    }
  )
} catch (err) {
  console.error(err)
}







const level = LOG_LEVEL !== undefined ? LOG_LEVEL?.value : 'info'
const maxSize = LOG_FILE_SIZE !== undefined ? LOG_FILE_SIZE?.value : '10m'
const maxFiles = LOG_MAX_FILES !== undefined ? LOG_MAX_FILES?.value : '5'

const rotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'log'),
  datePattern: 'output',
  level,
  maxSize,
  maxFiles,
})

const errorTransport = new winston.transports.DailyRotateFile({
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

console.log = function () {
  logger.info(util.format.apply(null, arguments))
}
console.error = function () {
  logger.error(util.format.apply(null, arguments))
}

const logger = winston.createLogger(logConfiguration)

export default logger
