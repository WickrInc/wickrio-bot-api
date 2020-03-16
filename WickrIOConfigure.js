'use strict';
const fs = require('fs');
const util = require('util')
const prompt = require('prompt');

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
        // If it is not set then return false
        for (var i = 0; i < this.tokenConfig.length; i++) {
            if (pjson.apps[0].env.tokens[this.tokenConfig[i].token] === undefined) {
                return false;
            }
        }

        // All of the tokens have values set
        return true;
    }




    /**
     *
     */
    async inputTokens()
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
              var descriptionValue;
              var requiredValue = tokenEntry.required;

              if (dflt === undefined || dflt === "undefined") {
                descriptionValue = tokenEntry.description + ' (Default: ' + tokenEntry.default + ')';
              } else {
                descriptionValue = tokenEntry.description + ' (Default: ' + dflt + ')';
                requiredValue = false;
              }

              var schema = {
                properties: {
                  [tokenEntry.token]: {
                    pattern: tokenEntry.pattern,
                    type: tokenEntry.type,
                    description: descriptionValue,
                    message: tokenEntry.message,
                    required: requiredValue
                  }
                }
              };

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
              var newName = "WickrIO-Broadcast-Bot_" + process.env.WICKRIO_BOT_NAME;
            } else if (newObjectResult.WICKRIO_BOT_NAME !== undefined) {
              var newName = "WickrIO-Broadcast-Bot_" + newObjectResult.WICKRIO_BOT_NAME.value;
            } else {
              var newName = "WickrIO-Broadcast-Bot";
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

    async configureYourBot()
    {
        if (this.processConfigured()) {
            try {
                var backup = path.dirname(this.processesFile) + '/processes_backup.json';
                var execString = 'cp ' + this.processesFile + ' ' + backup;

                var cp = execSync(execString)
                if (this.dataParsed.apps[0].env.tokens.WICKRIO_BOT_NAME.value !== undefined) {
                  var newName = "WickrIO-Broadcast-Bot_" + this.dataParsed.apps[0].env.tokens.WICKRIO_BOT_NAME.value;
                } else {
                  var newName = "WickrIO-Broadcast-Bot";
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
                await this.inputTokens();
                console.log("Finished Configuring!");
            } catch (err) {
                console.log(err);
            }
        }
    }
};


module.exports = WickrIOConfigure;
