'use strict';
const fs = require('fs');
const util = require('util')
const prompt = require('prompt');
var path = require('path');

prompt.colors = false;

require("dotenv").config({
  path: `.env.configure`
})

const {exec, execSync, execFileSync} = require('child_process');


class WickrIOConfigure
{
    constructor(tokens, processesFile, supportAdministrators, supportVerification)
    {
        this.supportsVerification = false;
        this.supportsAdministrators = false;
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
            {
                token: 'DATABASE_ENCRYPTION_KEY',
                pattern: '',
                type: 'string',
                description: 'Enter the database encryption key',
                message: 'Cannot leave empty! Please enter a value',
                required: true,
                default: 'N/A',
            }
        ];
        try {
            if (fs.existsSync(processesFile)) {
                this.processesFile = processesFile;
                this.processes = require(processesFile);
                this.dataStringify = JSON.stringify(this.processes);
                this.dataParsed = JSON.parse(this.dataStringify);
            } else {
                console.error("processes.json file does not exist! (" + processesFile + ")");
            }
        } catch(err) {
            console.error(err)
        }

        this.verificationToken = {
            token: 'VERIFY_USERS',
            pattern: 'manual|automatic',
            type: 'string',
            description: 'Enter the mode to verify users',
            message: 'Please enter either manual or automatic',
            required: false,
            default: 'automatic',
        };

        this.administratorsToken = {
            token: 'ADMINISTRATORS',
            pattern: '',
            type: 'string',
            description: 'Enter the list of administrators',
            message: 'Cannot leave empty! Please enter a value',
            required: true,
            default: 'N/A',
        };


        if (tokens !== undefined) {
            for (var i = 0; i < tokens.length; i++) {
                this.tokenConfig.push(tokens[i]);
            }
        }

        if (supportAdministrators === undefined || supportAdministrators !== true)
            this.setAdministrators(false);
        else
            this.setAdministrators(true);

        if (supportVerification === undefined || supportVerification !== true)
            this.setVerification(false);
        else
            this.setVerification(true);
    }

    displayValues()
    {
        console.log("WickrIOConfigure:constructor: tokenConfig: " + util.inspect(this.tokenConfig, {showHidden: false, depth: null}));
    }

    getTokenList()
    {
        return this.tokenConfig;
    }

    setAdministrators(turnOn)
    {
        var oldValue = this.supportsAdministrators;

        if (turnOn === undefined || turnOn === true) {
            this.supportsAdministrators = true;
        } else if (turnOn === false) {
            this.supportsAdministrators = false;
            if (this.supportsVerification === true) {
               console.log("setAdministrators: WARNING: turning off verification mode!");
               this.setVerification(false);
            }
        } else {
            console.log("setAdministrators: invalid input: " + turnOn);
            return false;
        }

        if (oldValue === this.supportsAdministrators)
            return;

        if (this.supportsAdministrators === true) {
            console.log("Adding " + this.administratorsToken.token + " to the list of tokens");
            this.tokenConfig.push(this.administratorsToken);
        } else {
            console.log("Removing " + this.administratorsToken.token + " from the list of tokens");
            this.tokenConfig = this.tokenConfig.filter(token => token.token != this.administratorsToken.token);
        }
        return true;
    }
 
    setVerification(turnOn)
    {
        var oldValue = this.supportsVerification;

        // If turning on the verification mode, check if administrators is set
        if (turnOn === undefined || turnOn === true) {
            if (this.supportsAdministrators == true) {
                this.supportsVerification = true;
            } else {
                console.log("setVerification: MUST set administrators on before setting verification on!");
                return false;
            }
        } else if (turnOn === false) {
            this.supportsVerification = false;
        } else {
            console.log("setVerification: invalid input: " + turnOn);
            return false;
        }

        if (oldValue === this.supportsVerification)
            return;

        if (this.supportsVerification === true) {
            console.log("Adding " + this.verificationToken.token + " to the list of tokens");
            this.tokenConfig.push(this.verificationToken);
        } else {
            console.log("Removing " + this.verificationToken.token + " from the list of tokens");
            this.tokenConfig = this.tokenConfig.filter(token => token.token != this.verificationToken.token);
        }
        return true;
    }
 
    getCurrentValues()
    {
        var newObjectResult = {};
        var processes;
        try {
            processes = fs.readFileSync(this.processesFile, 'utf-8');
            if (!processes) {
              console.log("Error reading " + this.processesFile);
              return newObjectResult;
            }
        } catch (err) {
            console.log(err);
            return newObjectResult;
        }

        var pjson = JSON.parse(processes);
        if (pjson.apps[0].env.tokens === undefined) {
            return newObjectResult;
        }

        // Create a mapping of the list of tokens and their values
        for(var attributename in pjson.apps[0].env.tokens){
            newObjectResult[attributename] = pjson.apps[0].env.tokens[attributename].value;
        }

        return newObjectResult;
    }

    /*
     * This function will process the input token list.  If there are tokens
     * that have list of other dependent tokens then they will be processed
     * recursively.
     */
    processConfiguredTokenList(pjson, tokenList)
    {
        // Check if the value for any of the tokens is not set
        // If it is not set then return false
        for (var i = 0; i < tokenList.length; i++) {
            if (pjson.apps[0].env.tokens[tokenList[i].token] === undefined) {
                return false;
            }

            if (tokenList[i].list !== undefined) {
                if (this.processConfiguredTokenList(pjson, tokenList[i].list) === false)
                    return false;
            }
        }
        return true;
    }

    /*
     * This function will check if any of the tokens have NOT been configured.
     * If all tokens have values assigned then a true value is returned.
     * If any tokens do not have values assigned then a false value is returned.
     */
    processConfigured()
    {
        var processes;
        try {
            processes = fs.readFileSync(this.processesFile, 'utf-8');
            if (!processes) {
              console.log("Error reading " + this.processesFile);
              return false;
            }
        } catch (err) {
            console.log(err);
            return false;
        }

        var pjson = JSON.parse(processes);
        if (pjson.apps[0].env.tokens === undefined) {
            return false;
        }

        // Check if the value for any of the tokens is not set
        return this.processConfiguredTokenList(pjson, this.tokenConfig);
    }


    processTokenList(tokenList, parentToken, schema)
    {
        var newObjectResult = this.getCurrentValues();
        for (let index = 0; index < tokenList.length; index++) {
            var tmpdflt = newObjectResult[tokenList[index].token];
            var requiredValue;
            if (tmpdflt === undefined || tmpdflt === "undefined") {
              requiredValue = tokenList[index].required;
              tmpdflt = ""
            } else {
              requiredValue = false;
            }

            schema.properties[tokenList[index].token] =  {
               pattern: tokenList[index].pattern,
               type: tokenList[index].type,
               description: tokenList[index].description,
               message: tokenList[index].message,
               required: requiredValue,
               default: tmpdflt,
               ask: function() {
                   var name = prompt.history(parentToken).value;
                   return prompt.history(parentToken).value === 'yes';
               }
            };

            if (tokenList[index].list !== undefined) {
                processTokenList(tokenList[index].list);
            }
        }
        return schema;
    }


    /**
     *
     */
    async inputTokens(integrationName)
    {
        var config = [];
        var i = 0;

        var newObjectResult = this.getCurrentValues();
        const inputPromises = [];

        for (let i = 0; i < this.tokenConfig.length; i++) {
	
          var inputPromise = new Promise((resolve, reject) => {
            this.inputPrompt = function(tokenEntry) {

              // For this token if it is defined in the environment
              // Then set the input value for the token
              if (process.env[tokenEntry.token] !== undefined) {
                var input = tokenEntry.token + '=' + process.env[tokenEntry.token];
                config.push(input);
                return resolve("Complete for" + tokenEntry.token);
              }

              var dflt = newObjectResult[tokenEntry.token];
              var requiredValue = tokenEntry.required;

              if (dflt === undefined || dflt === "undefined") {
                dflt="";
              } else {
                requiredValue = false;
              }

              var schema = {
                properties: {
                  [tokenEntry.token]: {
                    pattern: tokenEntry.pattern,
                    type: tokenEntry.type,
                    description: tokenEntry.description,
                    message: tokenEntry.message,
                    required: requiredValue,
                    default: dflt
                  }
                }
              };

              if (tokenEntry.list !== undefined) {
                  for (let listIndex = 0; listIndex < tokenEntry.list.length; listIndex++) {
                      var tmpdflt = newObjectResult[tokenEntry.list[listIndex].token];
                      if (tmpdflt === undefined || tmpdflt === "undefined") {
                        requiredValue = tokenEntry.list[listIndex].required;
                        tmpdflt = ""
                      } else {
                        requiredValue = false;
                      }

                      schema.properties[tokenEntry.list[listIndex].token] =  {
                         pattern: tokenEntry.list[listIndex].pattern,
                         type: tokenEntry.list[listIndex].type,
                         description: tokenEntry.list[listIndex].description,
                         message: tokenEntry.list[listIndex].message,
                         required: requiredValue,
                         default: tmpdflt,
                         ask: function() {
                             var name = prompt.history(tokenEntry.token).value;
                             return prompt.history(tokenEntry.token).value === 'yes';
                         }
                      };

                      if (tokenEntry.list[listIndex].list !== undefined) {
                          schema = this.processTokenList(tokenEntry.list[listIndex].list, tokenEntry.list[listIndex].token, schema);
                      }
                  }
              }

              prompt.get(schema, async function(err, answer) {
                if (answer[tokenEntry.token] === "") {
                  if (newObjectResult[tokenEntry.token] === undefined) {
                     answer[tokenEntry.token] = tokenEntry.default;
                  } else {
                     answer[tokenEntry.token] = newObjectResult[tokenEntry.token];
                  }
                }
                var input = tokenEntry.token + '=' + answer[tokenEntry.token];
                config.push(input);

                if (tokenEntry.list !== undefined) {
                    var tokens = [];
                    var tokendefault = {};
                    for (let index = 0; index < tokenEntry.list.length; index++) {
                        tokens.push(tokenEntry.list[index].token);
                        tokendefault[tokenEntry.list[index].token] = tokenEntry.list[index].default;
                        if (tokenEntry.list[index].list !== undefined) {
                            for (let i2 = 0; i2 < tokenEntry.list[index].list.length; i2++) {
                                tokens.push(tokenEntry.list[index].list[i2].token);
                                tokendefault[tokenEntry.list[index].list[i2].token] = tokenEntry.list[index].list[i2].default;
                            }
                        }
                    }

                    for (let tindex = 0; tindex < tokens.length; tindex++) {
                        if (answer[tokens[tindex]] === "") {
                            if (newObjectResult[tokens[tindex]] === undefined) {
                                answer[tokens[tindex]] = tokendefault[tokens[tindex]];
                            } else {
                               answer[tokens[tindex]] = newObjectResult[tokens[tindex]];
                            }
                        }
                        var input = tokens[tindex] + '=' + answer[tokens[tindex]];
                        config.push(input);
                    }
                }

                return resolve("Complete for" + tokenEntry.token);
              });
            }
          });
          inputPromises.push(inputPromise);
          this.inputPrompt(this.tokenConfig[i]);
          await inputPromise;
        }

        return Promise.all(inputPromises).then((answer) => {
          let objectKeyArray = [];
          let objectValueArray = [];
          for (var i = 0; i < config.length; i++) {
            let locationEqual = config[i].indexOf("=");
            let objectKey = config[i].slice(0, locationEqual);
            let objectValue = config[i].slice(locationEqual + 1, config[i].length); //Input value
            objectKeyArray.push(objectKey);
            objectValueArray.push(objectValue);
          }
          var newObjectResult = {};
          for (var j = 0; j < config.length; j++) {
            newObjectResult[objectKeyArray[j]] = objectValueArray[j];
          }
          for (var key in newObjectResult) {
            // If the environment variable is set then use it
            if (process.env[key] !== undefined) {
              var obj = {
                "value": process.env[key],
                "encrypted": false
              };
              newObjectResult[key] = obj;
            }
            // Else use the value just entered by the user
            else {
              var obj = {
                "value": newObjectResult[key],
                "encrypted": false
              };
              newObjectResult[key] = obj;
            }
          }
          for (var key in this.dataParsed.apps[0].env.tokens) {
            delete this.dataParsed.apps[0].env.tokens[key];
          }
          try {
            var cp = execSync('cp processes.json processes_backup.json');
            if (process.env.WICKRIO_BOT_NAME !== undefined) {
              var newName = integrationName + "_" + process.env.WICKRIO_BOT_NAME;
            } else if (newObjectResult.WICKRIO_BOT_NAME !== undefined) {
              var newName = integrationName + "_" + newObjectResult.WICKRIO_BOT_NAME.value;
            } else {
              var newName = integrationName
            }

            //var assign = Object.assign(this.dataParsed.apps[0].name, newName);
            this.dataParsed.apps[0].name = newName;

            var assign = Object.assign(this.dataParsed.apps[0].env.tokens, newObjectResult);
            var ps = fs.writeFileSync('./processes.json', JSON.stringify(this.dataParsed, null, 2));
          } catch (err) {
            console.log(err);
          }
          //console.log(answer);
          return;
        });
    }

    async configureYourBot(integrationName)
    {
        if (this.processConfigured()) {
            try {
                var backup = path.dirname(this.processesFile) + '/processes_backup.json';
                var execString = 'cp ' + this.processesFile + ' ' + backup;

                var cp = execSync(execString)
                if (this.dataParsed.apps[0].env.tokens.WICKRIO_BOT_NAME.value !== undefined) {
                  var newName = integrationName + "_" + this.dataParsed.apps[0].env.tokens.WICKRIO_BOT_NAME.value;
                } else {
                  var newName = integrationName;
                }
                //var assign = Object.assign(this.dataParsed.apps[0].name, newName);
                this.dataParsed.apps[0].name = newName;
                var ps = fs.writeFileSync(this.processesFile, JSON.stringify(this.dataParsed, null, 2));
            } catch (err) {
                console.log(err);
            }
            console.log("Already configured");
        } else {
            try {
                await this.inputTokens(integrationName);
                console.log("Finished Configuring!");
            } catch (err) {
                console.log(err);
            }
        }
    }
};


module.exports = WickrIOConfigure;
