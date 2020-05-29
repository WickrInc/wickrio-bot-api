# WickrIO Bot API

The Wickr IO Node.js Bot API Framework provides tools for an easier and more efficient Development of WickrIO integration bots. It utilizes the Wickr IO Node.js Addon API(wickrio_addon) functions to make it easier to develop integrations. For full documentation and usage guide go here: <https://wickrinc.github.io/wickrio-docs/#writing-integrations-node-js-bot-api-development-toolkit>

To get started, you would need to setup your system, download and install Docker and run the WickrIO Docker container. Full instructions on how to do so are available here: https://wickrinc.github.io/wickrio-docs/#wickr-io-getting-started

## Install

```bash
npm install --save wickrio-bot-api
```

## Usage

```js
const WickrIOAPI = require('wickrio_addon'); //WickrIO node.js addon which allows talking directly to our api
const WickrIOBotAPI = require('wickrio-bot-api'); //Development toolkit to help create bots/integrations
const WickrUser = WickrIOBotAPI.WickrUser;

var bot, tokens, bot_username, bot_client_port, bot_client_server;
var tokens = JSON.parse(process.env.tokens);

async function main() {
try {
bot_username = tokens.BOT_USERNAME.value;
bot = new WickrIOBotAPI.WickrIOBot();
var status = await bot.start(bot_username)
  if (!status){
      process.exit();
  }
// Sending message to a room
var msg = "Hey, I'm a WickrBot. Lets do things!";
var vGroupID = "example-vGroupID";
var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, msg);
console.log(sMessage); //if successful should print "Sending message"
var closed = await bot.close();
  } catch (err) {
    console.log(err);
  }
}
```

For a full usage and easy to get started example see: <https://github.com/WickrInc/wickrio-example-app>
