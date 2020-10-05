'use strict'
const fs = require('fs')
const util = require('util')
const prompt = require('prompt')

prompt.colors = false

require('dotenv').config({
  path: `.env.configure`,
})

const { execSync } = require('child_process')

class WickrIOConfigure {
  constructor(
    tokens,
    processesFile,
    supportAdministrators,
    supportVerification,
    supportEncrypt,
    addOnToJSON,
    dotenv
  ) {
    this.supportsVerification = false
    this.supportsAdministrators = false
    this.supportsEncrypt = false
    this.addOnToJSON = false
    this.dotenv = dotenv
    if (this.dotenv) {
      this.tokens = process.env.tokens
    }

    if (addOnToJSON === undefined || addOnToJSON !== true)
      this.addOnToJSON = false
    else this.addOnToJSON = true

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
    if (!this.dotenv) {
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
      } catch (err) {
        console.error(err)
      }
    } else {
      const pm2template = {
        apps: [
          {
            name: null,
            args: [],
            script: './build/index.js',
            exec_interpreter: 'node',
            autorestart: true,
            watch: ['package.json'],
            ignore_watch: ['.git'],
            env: {
              tokens: {},
            },
            out_file: 'log.output',
            error_file: 'err.output',
          },
        ],
      }

      this.dataParsed = pm2template
    }

    this.verificationToken = {
      token: 'VERIFY_USERS',
      pattern: 'manual|automatic',
      type: 'string',
      description: 'Enter the mode to verify users',
      message: 'Please enter either manual or automatic',
      required: false,
      default: 'automatic',
    }

    this.administratorsToken = {
      token: 'ADMINISTRATORS',
      pattern: '',
      type: 'string',
      description: 'Enter the list of administrators',
      message: 'Cannot leave empty! Please enter a value',
      required: true,
      default: 'N/A',
    }

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
      this.tokenConfig.push(this.administratorsToken)
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
    if (!this.dotenv) {
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
    } else {
      const { tokens } = process.env
      return tokens
    }
  }

  /*
   * This function will process the input token list.  If there are tokens
   * that have list of other dependent tokens then they will be processed
   * recursively.
   */
  processConfiguredTokenList(pjson, tokenList) {
    // Check if the value for any of the tokens is not set
    // If it is not set then return false
    if (!this.dotenv) {
      for (let i = 0; i < tokenList.length; i++) {
        if (pjson.apps[0].env.tokens[tokenList[i].token] === undefined) {
          return false
        }

        if (tokenList[i].list !== undefined) {
          if (
            this.processConfiguredTokenList(pjson, tokenList[i].list) === false
          )
            return false
        }
      }
      return true
    } else {
      for (let i = 0; i < tokenList.length; i++) {
        if (process.env.tokens[tokenList[i].token] === undefined) {
          return false
        }
        if (tokenList[i].list !== undefined) {
          if (
            this.processConfiguredTokenList(false, tokenList[i].list) === false
          )
            return false
        }
      }
    }
  }

  /*
   * This function will check if any of the tokens have NOT been configured.
   * If all tokens have values assigned then a true value is returned.
   * If any tokens do not have values assigned then a false value is returned.
   */
  processConfigured() {
    if (!this.dotenv) {
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
    } else {
      if (process.env.tokens === undefined) {
        return false
      }
      // Check if the value for any of the tokens is not set
      return this.processConfiguredTokenList(false, this.tokenConfig)
    }
  }

  processTokenList(tokenList, parentToken, schema) {
    // if (!this.dotenv) {
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
            // eslint-disable-next-line no-unused-vars
            const name = prompt.history(parentToken).value
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
    // } else {
    // }
  }

  /**
   *
   */
  async inputTokens(integrationName) {
    const config = []
    // const i = 0

    const newObjectResult = this.getCurrentValues()
    const inputPromises = []

    for (let i = 0; i < this.tokenConfig.length; i++) {
      const inputPromise = new Promise((resolve, reject) => {
        this.inputPrompt = function (tokenEntry) {
          // For this token if it is defined in the environment
          // Then set the input value for the token
          if (process.env[tokenEntry.token] !== undefined) {
            const input = tokenEntry.token + '=' + process.env[tokenEntry.token]
            config.push(input)
            return resolve('Complete for' + tokenEntry.token)
          }

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

          let schema = {
            properties: {},
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
              type: tokenEntry.type,
              description: tokenEntry.description,
              message: tokenEntry.message,
              required: requiredValue,
              default: dflt,
            }
          }

          if (tokenEntry.list !== undefined) {
            schema = this.processTokenList(
              tokenEntry.list,
              tokenEntry.token,
              schema
            )
          }

          prompt.get(schema, async (err, answer) => {
            if (err) return err

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
        execSync('cp processes.json processes_backup.json')
        let newName
        if (process.env.WICKRIO_BOT_NAME !== undefined) {
          newName = integrationName + '_' + process.env.WICKRIO_BOT_NAME
        } else if (newObjectResult.WICKRIO_BOT_NAME !== undefined) {
          newName =
            integrationName + '_' + newObjectResult.WICKRIO_BOT_NAME.value
        } else {
          newName = integrationName
        }

        // var assign = Object.assign(this.dataParsed.apps[0].name, newName);
        this.dataParsed.apps[0].name = newName

        Object.assign(this.dataParsed.apps[0].env.tokens, newObjectResult)
        // If addOnToJSON is false write the file,
        // else add on the exisitng JSON file and then append to it.
        if (this.addOnToJSON === false) {
          fs.writeFileSync(
            './processes.json',
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
          fs.writeFileSync('./processes.json', JSON.stringify(data, null, 2))
        }
      } catch (err) {
        console.log(err)
      }
      // console.log(answer);
    })
  }

  async configureYourBot(integrationName) {
    try {
      await this.inputTokens(integrationName)
      console.log('Finished Configuring!')
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = WickrIOConfigure
