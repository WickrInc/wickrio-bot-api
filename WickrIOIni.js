'use strict';
const fs = require('fs');
const ini = require('ini');

const util = require('util')
const prompt = require('prompt');
var path = require('path');

require("dotenv").config({
  path: `.env.configure`
})

const {exec, execSync, execFileSync} = require('child_process');


class WickrIOIni
{
    constructor(clientName, integrationDirectory)
    {
        this.iniFile = integrationDirectory + "/../../WickrIOClient." + clientName + ".ini";
        try {
            if (fs.existsSync(this.iniFile)) {
                this.iniParsed = ini.parse(fs.readFileSync(this.iniFile, 'utf-8'));
                this.displayValues();
            } else {
                console.error("INI file does not exist! (" + this.iniFile + ")");
            }
        } catch(err) {
            console.error(err)
        }
    }

    displayValues()
    {
        console.log("WickrIOIni: iniParsed: " + util.inspect(this.iniParsed, {showHidden: false, depth: null}));
    }

};


module.exports = WickrIOIni;
