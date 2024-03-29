'use strict'
const fs = require('fs')
const util = require('util')
const prompt = require('prompt')
const path = require('path')

prompt.colors = false

require('dotenv').config({
  path: `.env.configure`,
})

class WickrIOConfigure {
  constructor(
    tokens,
    processesFile,
    supportAdministrators,
    supportVerification,
    supportEncrypt,
    addOnToJSON,
    adminsOptional
  ) {
    this.supportsVerification = false
    this.supportsAdministrators = false
    this.supportsEncrypt = false
    this.addOnToJSON = false
    this.adminsOptional = false
    this.loggerConfig = {
      LOG_LEVEL: 'info',
      LOG_FILE_SIZE: '10m',
      LOG_MAX_FILES: '5',
    }

    if (addOnToJSON === undefined || addOnToJSON !== true)
      this.addOnToJSON = false
    else this.addOnToJSON = true

    if (adminsOptional !== undefined) this.adminsOptional = adminsOptional

    console.log('adminsOptional=' + this.adminsOptional)

    this.tokenConfig = [
      {
        token: 'WICKRIO_BOT_NAME',
        pattern: '',
        type: 'string',
        description: 'Enter the WickrIO bot name',
        message: 'Cannot leave empty! Please enter a value',
        required: true,
        default: 'N/A',
      },
    ]
    try {
      if (fs.existsSync(processesFile)) {
        this.processesFile = processesFile
        this.processes = require(processesFile)
        this.dataStringify = JSON.stringify(this.processes)
        this.dataParsed = JSON.parse(this.dataStringify)
      } else {
        console.error(
          'processes.json file does not exist! (' + processesFile + ')'
        )
      }
      const packageFile = processesFile.replace(
        'processes.json',
        'package.json'
      )
      if (fs.existsSync(packageFile)) {
        this.packageFile = packageFile
        this.package = require(packageFile)
        this.packageDataStringify = JSON.stringify(this.package)
        this.packageDataParsed = JSON.parse(this.packageDataStringify)
        this.foreverFlag = this.packageDataParsed.scripts.start.includes(
          'forever'
        )
        this.wpmFlag = this.packageDataParsed.scripts.start.includes('wpm')
      } else {
        console.error('package.json file does not exist! (' + packageFile + ')')
      }
      const foreverFile = processesFile.replace(
        'processes.json',
        'forever.json'
      )
      if (fs.existsSync(foreverFile)) {
        this.foreverFile = foreverFile
        this.forever = require(foreverFile)
        this.foreverDataStringify = JSON.stringify(this.forever)
        this.foreverDataParsed = JSON.parse(this.foreverDataStringify)
      }
      const wpmFile = processesFile.replace('processes.json', 'wpm.json')
      if (fs.existsSync(wpmFile)) {
        this.wpmFile = wpmFile
        this.wpm = require(wpmFile)
        this.wpmDataStringify = JSON.stringify(this.wpm)
        this.wpmDataParsed = JSON.parse(this.wpmDataStringify)
      }
      const pidFile = processesFile.replace(
        'processes.json',
        'pidLocation.json'
      )
      this.pidFile = pidFile
    } catch (err) {
      console.error(err)
    }

    this.verificationToken = WickrIOConfigure.getVerificationTokens()
    this.administratorsToken = WickrIOConfigure.getAdminTokens(
      this.adminsOptional
    )
    console.log('adminsOptional=' + this.adminsOptional)

    this.encryptToken = {
      token: 'DATABASE_ENCRYPTION_CHOICE',
      pattern: 'yes|no',
      type: 'string',
      description: 'Do you want to encrypt the configuration values [yes|no]',
      message: 'Please enter either yes or no',
      required: true,
      default: 'no',
      list: [
        {
          token: 'DATABASE_ENCRYPTION_KEY',
          pattern: /^.{16,}$/,
          type: 'string',
          description: 'Enter the database encryption key',
          message: 'Please enter a value at least 16 characters long',
          required: true,
          default: '',
        },
      ],
    }

    if (tokens !== undefined) {
      for (let i = 0; i < tokens.length; i++) {
        this.tokenConfig.push(tokens[i])
      }
    }

    if (supportAdministrators === undefined || supportAdministrators !== true)
      this.setAdministrators(false)
    else this.setAdministrators(true)

    if (supportVerification === undefined || supportVerification !== true)
      this.setVerification(false)
    else this.setVerification(true)

    if (supportEncrypt === undefined || supportEncrypt !== true)
      this.setEncrypt(false)
    else this.setEncrypt(true)
  }

  displayValues() {
    console.log(
      'WickrIOConfigure:constructor: tokenConfig: ' +
        util.inspect(this.tokenConfig, { showHidden: false, depth: null })
    )
  }

  /*
   * function to return the 'verification' token(s)
   */
  static getVerificationTokens() {
    return {
      token: 'VERIFY_USERS',
      pattern: 'manual|automatic',
      type: 'string',
      description: 'Enter the mode to verify users',
      message: 'Please enter either manual or automatic',
      required: false,
      default: 'automatic',
    }
  }

  /*
   * function to return the 'admin' token(s)
   */
  static getAdminTokens(adminsOptional) {
    if (adminsOptional) {
      return {
        token: 'ADMINISTRATORS_CHOICE',
        pattern: 'yes|no',
        type: 'string',
        description: 'Do you want to use administrators [yes|no]',
        message: 'Please enter either yes or no',
        required: true,
        default: 'yes',
        list: [
          {
            token: 'ADMINISTRATORS',
            pattern: '',
            type: 'string',
            description: 'Enter the list of administrators',
            message: 'Cannot leave empty! Please enter a value',
            required: true,
            default: 'N/A',
          },
        ],
      }
    } else {
      return {
        token: 'ADMINISTRATORS',
        pattern: '',
        type: 'string',
        description: 'Enter the list of administrators',
        message: 'Cannot leave empty! Please enter a value',
        required: true,
        default: 'N/A',
      }
    }
  }

  getTokenList() {
    return this.tokenConfig
  }

  setAdministrators(turnOn) {
    const oldValue = this.supportsAdministrators

    if (turnOn === undefined || turnOn === true) {
      this.supportsAdministrators = true
    } else if (turnOn === false) {
      this.supportsAdministrators = false
      if (this.supportsVerification === true) {
        console.log(
          'setAdministrators: WARNING: turning off verification mode!'
        )
        this.setVerification(false)
      }
    } else {
      console.log('setAdministrators: invalid input: ' + turnOn)
      return false
    }

    if (oldValue === this.supportsAdministrators) return

    if (this.supportsAdministrators === true) {
      console.log(
        'Adding ' + this.administratorsToken.token + ' to the list of tokens'
      )
      this.tokenConfig.unshift(this.administratorsToken)
    } else {
      console.log(
        'Removing ' +
          this.administratorsToken.token +
          ' from the list of tokens'
      )
      this.tokenConfig = this.tokenConfig.filter(
        token => token.token !== this.administratorsToken.token
      )
    }
    return true
  }

  setVerification(turnOn) {
    const oldValue = this.supportsVerification

    // If turning on the verification mode, check if administrators is set
    if (turnOn === undefined || turnOn === true) {
      if (this.supportsAdministrators === true) {
        this.supportsVerification = true
      } else {
        console.log(
          'setVerification: MUST set administrators on before setting verification on!'
        )
        return false
      }
    } else if (turnOn === false) {
      this.supportsVerification = false
    } else {
      console.log('setVerification: invalid input: ' + turnOn)
      return false
    }

    if (oldValue === this.supportsVerification) return

    if (this.supportsVerification === true) {
      console.log(
        'Adding ' + this.verificationToken.token + ' to the list of tokens'
      )
      this.tokenConfig.push(this.verificationToken)
    } else {
      console.log(
        'Removing ' + this.verificationToken.token + ' from the list of tokens'
      )
      this.tokenConfig = this.tokenConfig.filter(
        token => token.token !== this.verificationToken.token
      )
    }
    return true
  }

  setEncrypt(turnOn) {
    this.supportsEncrypt = false
    const oldValue = this.supportsEncrypt

    // If turning on the encrypt mode
    if (turnOn === undefined || turnOn === false) {
      this.supportsEncrypt = false
    } else if (turnOn === true) {
      this.supportsEncrypt = true
    } else {
      console.log('setEncrypt: invalid input: ' + turnOn)
      return false
    }

    if (oldValue === this.supportsEncrypt) return

    if (this.supportsEncrypt === true) {
      console.log(
        'Adding ' + this.encryptToken.token + ' to the list of tokens'
      )
      this.tokenConfig.push(this.encryptToken)
    } else {
      console.log(
        'Removing ' + this.encryptToken.token + ' from the list of tokens'
      )
      this.tokenConfig = this.tokenConfig.filter(
        token => token.token !== this.encryptToken.token
      )
    }
    return true
  }

  getCurrentValues() {
    const newObjectResult = {}
    let processes
    try {
      processes = fs.readFileSync(this.processesFile, 'utf-8')
      if (!processes) {
        console.log('Error reading ' + this.processesFile)
        return newObjectResult
      }
    } catch (err) {
      console.log(err)
      return newObjectResult
    }

    const pjson = JSON.parse(processes)
    if (pjson.apps[0].env.tokens === undefined) {
      return newObjectResult
    }

    // Create a mapping of the list of tokens and their values
    for (const attributename in pjson.apps[0].env.tokens) {
      if (!pjson.apps[0].env.tokens[attributename].encrypted)
        newObjectResult[attributename] =
          pjson.apps[0].env.tokens[attributename].value
    }

    return newObjectResult
  }

  /*
   * This function will process the input token list.  If there are tokens
   * that have list of other dependent tokens then they will be processed
   * recursively.
   */
  processConfiguredTokenList(pjson, tokenList) {
    // Check if the value for any of the tokens is not set
    // If it is not set then return false
    for (let i = 0; i < tokenList.length; i++) {
      if (pjson.apps[0].env.tokens[tokenList[i].token] === undefined) {
        return false
      }

      if (tokenList[i].list !== undefined) {
        if (this.processConfiguredTokenList(pjson, tokenList[i].list) === false)
          return false
      }
    }
    return true
  }

  /*
   * This function will check if any of the tokens have NOT been configured.
   * If all tokens have values assigned then a true value is returned.
   * If any tokens do not have values assigned then a false value is returned.
   */
  processConfigured() {
    let processes
    try {
      processes = fs.readFileSync(this.processesFile, 'utf-8')
      if (!processes) {
        console.log('Error reading ' + this.processesFile)
        return false
      }
    } catch (err) {
      console.log(err)
      return false
    }

    const pjson = JSON.parse(processes)
    if (pjson.apps[0].env.tokens === undefined) {
      return false
    }

    // Check if the value for any of the tokens is not set
    return this.processConfiguredTokenList(pjson, this.tokenConfig)
  }

  processTokenList(tokenList, parentToken, schema) {
    const newObjectResult = this.getCurrentValues()
    for (let index = 0; index < tokenList.length; index++) {
      let tmpdflt = newObjectResult[tokenList[index].token]
      let requiredValue
      if (tmpdflt === undefined || tmpdflt === 'undefined') {
        requiredValue = tokenList[index].required

        if (tokenList[index].default === undefined) {
          tmpdflt = ''
        } else {
          tmpdflt = tokenList[index].default
        }
      } else {
        requiredValue = false
      }

      if (tokenList[index].type === 'file') {
        schema.properties[tokenList[index].token] = {
          pattern: tokenList[index].pattern,
          type: 'string',
          description: tokenList[index].description,
          message: tokenList[index].message,
          required: requiredValue,
          default: tmpdflt,
          ask: function () {
            if (prompt.history(parentToken) === null) {
              return false
            }
            // const name = prompt.history(parentToken).value
            return prompt.history(parentToken).value === 'yes'
          },
          conform: function (filename) {
            if (fs.existsSync(filename)) {
              return true
            } else {
              return false
            }
          },
        }
      } else {
        schema.properties[tokenList[index].token] = {
          pattern: tokenList[index].pattern,
          type: 'string',
          description: tokenList[index].description,
          message: tokenList[index].message,
          required: requiredValue,
          default: tmpdflt,
          ask: function () {
            if (prompt.history(parentToken) === null) {
              return false
            }
            // const name = prompt.history(parentToken).value
            return prompt.history(parentToken).value === 'yes'
          },
        }
      }

      if (tokenList[index].list !== undefined) {
        schema = this.processTokenList(
          tokenList[index].list,
          tokenList[index].token,
          schema
        )
      }
    }
    return schema
  }

  /**
   *
   */
  async inputTokens(integrationName) {
    const config = []

    const newObjectResult = this.getCurrentValues()
    const inputPromises = []

    for (let i = 0; i < this.tokenConfig.length; i++) {
      const inputPromise = new Promise((resolve, reject) => {
        this.inputPrompt = function (tokenEntry) {
          let schema = {
            properties: {},
          }

          // For this token if it is defined in the environment
          // Then set the input value for the token
          if (process.env[tokenEntry.token] !== undefined) {
            const input = tokenEntry.token + '=' + process.env[tokenEntry.token]
            config.push(input)

            // If this token has a list and the answer was 'yes' then proceed into the list
            if (
              tokenEntry.list === undefined ||
              process.env[tokenEntry.token] === 'no'
            ) {
              return resolve('Complete for' + tokenEntry.token)
            }
          } else {
            let dflt = newObjectResult[tokenEntry.token]
            let requiredValue = tokenEntry.required

            if (dflt === undefined || dflt === 'undefined') {
              if (tokenEntry.default === undefined) {
                dflt = ''
              } else {
                dflt = tokenEntry.default
              }
            } else {
              requiredValue = false
            }

            if (tokenEntry.type === 'file') {
              schema.properties[tokenEntry.token] = {
                pattern: tokenEntry.pattern,
                type: 'string',
                description: tokenEntry.description,
                message: tokenEntry.message,
                required: requiredValue,
                default: dflt,
                conform: function (filename) {
                  if (fs.existsSync(filename)) {
                    return true
                  } else {
                    return false
                  }
                },
              }
            } else {
              schema.properties[tokenEntry.token] = {
                pattern: tokenEntry.pattern,
                type: 'string',
                description: tokenEntry.description,
                message: tokenEntry.message,
                required: requiredValue,
                default: dflt,
              }
            }
          }

          if (tokenEntry.list !== undefined) {
            schema = this.processTokenList(
              tokenEntry.list,
              tokenEntry.token,
              schema
            )
          }

          prompt.get(schema, async function (err, answer) {
            if (answer[tokenEntry.token] === '') {
              if (newObjectResult[tokenEntry.token] === undefined) {
                answer[tokenEntry.token] = tokenEntry.default
              } else {
                answer[tokenEntry.token] = newObjectResult[tokenEntry.token]
              }
            }
            const input = tokenEntry.token + '=' + answer[tokenEntry.token]
            config.push(input)

            if (tokenEntry.list !== undefined) {
              const tokens = []
              const tokendefault = {}
              for (let index = 0; index < tokenEntry.list.length; index++) {
                tokens.push(tokenEntry.list[index].token)
                tokendefault[tokenEntry.list[index].token] =
                  tokenEntry.list[index].default
                if (tokenEntry.list[index].list !== undefined) {
                  for (
                    let i2 = 0;
                    i2 < tokenEntry.list[index].list.length;
                    i2++
                  ) {
                    tokens.push(tokenEntry.list[index].list[i2].token)
                    tokendefault[tokenEntry.list[index].list[i2].token] =
                      tokenEntry.list[index].list[i2].default
                  }
                }
              }

              for (let tindex = 0; tindex < tokens.length; tindex++) {
                if (answer[tokens[tindex]] === '') {
                  if (newObjectResult[tokens[tindex]] === undefined) {
                    answer[tokens[tindex]] = tokendefault[tokens[tindex]]
                  } else {
                    answer[tokens[tindex]] = newObjectResult[tokens[tindex]]
                  }
                }
                const input = tokens[tindex] + '=' + answer[tokens[tindex]]
                config.push(input)
              }
            }

            return resolve('Complete for' + tokenEntry.token)
          })
        }
      })
      inputPromises.push(inputPromise)
      this.inputPrompt(this.tokenConfig[i])
      await inputPromise
    }

    return Promise.all(inputPromises).then(answer => {
      const objectKeyArray = []
      const objectValueArray = []
      for (let i = 0; i < config.length; i++) {
        const locationEqual = config[i].indexOf('=')
        const objectKey = config[i].slice(0, locationEqual)
        const objectValue = config[i].slice(locationEqual + 1, config[i].length) // Input value
        objectKeyArray.push(objectKey)
        objectValueArray.push(objectValue)
      }
      const newObjectResult = {}
      for (let j = 0; j < config.length; j++) {
        newObjectResult[objectKeyArray[j]] = objectValueArray[j]
      }
      for (const key in newObjectResult) {
        // If the environment variable is set then use it
        if (process.env[key] !== undefined) {
          const obj = {
            value: process.env[key],
            encrypted: false,
          }
          newObjectResult[key] = obj
        }
        // Else use the value just entered by the user
        else {
          const obj = {
            value: newObjectResult[key],
            encrypted: false,
          }
          newObjectResult[key] = obj
        }
      }
      for (const key in this.dataParsed.apps[0].env.tokens) {
        delete this.dataParsed.apps[0].env.tokens[key]
      }
      try {
        let processesFileDir = path.dirname(this.processesFile)
        if (processesFileDir === undefined || processesFileDir.length === 0)
          processesFileDir = '.'
        const processesFileBackup = path.join(
          processesFileDir,
          'processes_backup.json'
        )

        // backup the processes.json file
        fs.copyFileSync(this.processesFile, processesFileBackup)

        let newName
        if (process.env.WICKRIO_BOT_NAME !== undefined) {
          newName = integrationName + '_' + process.env.WICKRIO_BOT_NAME
        } else if (newObjectResult.WICKRIO_BOT_NAME !== undefined) {
          newName =
            integrationName + '_' + newObjectResult.WICKRIO_BOT_NAME.value
        } else {
          newName = integrationName
        }
        this.uid = newName
        this.wpmName = newName

        // let assign = Object.assign(this.dataParsed.apps[0].name, newName);
        this.dataParsed.apps[0].name = newName

        // TODO can we just assign all of env?
        Object.assign(this.dataParsed.apps[0].env.tokens, newObjectResult)
        const configData = this.configureLogger(this.dataParsed)
        if (this.dataParsed.apps[0].env.log_tokens === undefined) {
          this.dataParsed.apps[0].env.log_tokens = this.loggerConfig
        } else {
          Object.assign(this.dataParsed.apps[0].env.log_tokens, configData)
        }

        // If addOnToJSON is false write the file,
        // else add on the exisitng JSON file and then append to it.
        if (this.addOnToJSON === false) {
          fs.writeFileSync(
            this.processesFile,
            JSON.stringify(this.dataParsed, null, 2)
          )
        } else {
          /*  Adding Security Group Access for each user to processes.json
                    
                        1. Get the old JSON data from /processes.json file
                        2. Get the admins that were entered in
                        3. Build the struct that is to be added into the JSON object
                        4. Add in SECURITY_GROUP_ACCESS struct to JSON object then write the object
                           to the ./processes.json file 
                    */

          // 1.
          const data = JSON.parse(fs.readFileSync(this.processesFile, 'utf-8'))
          // 2.
          const adminArray = this.getCurrentValues().ADMINISTRATORS.split(',')
          // 3.
          const objToAdd = {}
          let i
          for (i = 0; i < adminArray.length; i++) {
            const userSecurityGroups = this.dataParsed.apps[0].env.tokens[
              adminArray[i]
            ].value.split(',')
            objToAdd[adminArray[i]] = userSecurityGroups
          }
          // 4.
          data.apps[0].env.tokens.SECURITY_GROUP_ACCESS = objToAdd
          const configData = this.configureLogger(data)
          Object.assign(data.apps[0].env.config_tokens, configData)
          fs.writeFileSync(this.processesFile, JSON.stringify(data, null, 2))
        }
      } catch (err) {
        console.log(err)
      }
      // console.log(answer);
    })
  }

  async configurePackage() {
    try {
      if (!fs.existsSync(this.packageFile)) {
        console.error('package.json file does not exist!!')
      } else {
        this.packageDataParsed.scripts.stop = `forever stop ${this.uid}`
        this.packageDataParsed.scripts.restart = `forever restart ${this.uid}`
        fs.writeFileSync(
          this.packageFile,
          JSON.stringify(this.packageDataParsed, null, 2)
        )
        console.log('Finished Configuring package!')
      }
    } catch (err) {
      console.error(err)
    }
  }

  async configureForever() {
    try {
      if (!fs.existsSync(this.foreverFile)) {
        console.error('forever.json file does not exist!!')
      } else {
        this.foreverDataParsed.uid = this.uid
        this.foreverDataParsed.sourceDir = this.processesFile.replace(
          'processes.json',
          ''
        )
        fs.writeFileSync(
          this.foreverFile,
          JSON.stringify(this.foreverDataParsed, null, 2)
        )
        console.log('Finished Configuring forever!')
      }
    } catch (err) {
      console.error(err)
    }
  }

  async configureWpm() {
    try {
      if (!fs.existsSync(this.wpmFile)) {
        console.error('wpm.json file does not exist!!')
      } else {
        this.wpmDataParsed.name = this.wpmName
        fs.writeFileSync(
          this.wpmFile,
          JSON.stringify(this.wpmDataParsed, null, 2)
        )
        console.log('Finished Configuring WPM!')
      }
    } catch (err) {
      console.error(err)
    }
  }

  async configurePid() {
    try {
      if (!fs.existsSync(this.pidFile)) {
        this.wpmDataParsed.name = this.wpmName
        const pidLocationString = '/tmp/' + this.uid + '.pid'
        fs.closeSync(fs.openSync(pidLocationString, 'w'))
        fs.writeFileSync(this.pidFile, pidLocationString)
        console.log('Finished Configuring pid location file!')
      }
    } catch (err) {
      console.error(err)
    }
  }

  configureLogger(data) {
    const retObj = {}
    if (data.apps[0].env.log_tokens === undefined) {
      return this.loggerConfig
    }
    for (const token in this.loggerConfig) {
      if (data.apps[0].env.log_tokens[token] === undefined) {
        retObj[token] = this.loggerConfig[token]
      }
    }
    return retObj
  }

  async configureYourBot(integrationName) {
    try {
      if (!fs.existsSync(this.processesFile)) {
        console.error('processes.json file does not exist!!')
      } else {
        await this.inputTokens(integrationName)
        if (this.foreverFlag) {
          await this.configurePackage()
          await this.configureForever()
        } else if (this.wpmFlag) {
          await this.configureWpm()
          await this.configurePid()
        }
        console.log('Finished Configuring!')
      }
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = WickrIOConfigure
