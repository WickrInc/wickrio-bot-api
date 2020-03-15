const fs = require('fs');
const util = require('util')
const prompt = require('prompt');

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
        this.tokenConfig = [];
        this.processes = require(processesFile);
        this.dataStringify = JSON.stringify(this.processes);
        this.dataParsed = JSON.parse(this.dataStringify);

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
 
};


module.exports = WickrIOConfigure;
