# WickrIO Bot API

The Wickr IO Node.js Bot API Framework provides tools for an easier and more efficient Development of WickrIO integration bots. It utilizes the Wickr IO Node.js Addon API(wickrio_addon) functions to make it easier to develop integrations. For full documentation and usage guide go here: <https://wickrinc.github.io/wickrio-docs/#writing-integrations-node-js-bot-api-development-toolkit>

To get started, you would need to setup your system, download and install Docker and run the WickrIO Docker container. Full instructions on how to do so are available here: https://wickrinc.github.io/wickrio-docs/#wickr-io-getting-started

## Install

```bash
npm install --save wickrio-bot-api
```

## Usage

For a full usage and easy to get started example see: <https://github.com/WickrInc/wickrio-example-app>

### Configuration

```sh
# ./configure.sh

node ./build/config/index.js
```

```js
// ./src/config/index.js
import { ConfigBot } from 'wickrio-bot-api'
import tokens from './configTokens.json'

const processes = process.cwd() + '../../processes.json'
const config = new ConfigBot(
  tokens.tokens,
  processes,
  tokens.supportAdministrators,
  tokens.supportVerification
)

await config.configureYourBot(tokens.integration)
process.exit()
```

```json
// ./processes.json
{
  "supportAdministrators": true,
  "supportVerification": true,
  "integration": "WickrIO-Recorder-Bot",
  "tokens": [
    {
      "token": "DATABASE_USER",
      "pattern": "",
      "type": "string",
      "description": "Please enter the user name for the database",
      "message": "Cannot leave empty! Please enter a value",
      "required": true,
      "default": "ubuntu"
    },
    {
      "token": "DATABASE_PASS",
      "pattern": "",
      "type": "string",
      "description": "Please enter the password for the database",
      "message": "Cannot leave empty! Please enter a value",
      "required": true,
      "default": "N/A"
    }
  ]
}
```

### Create and Run a Bot

```js
// ./src/index.js
import { BotAPI } from 'wickrio-bot-api'
const bot = new BotAPI()
const status = await bot.start(tokens.WICKRIO_BOT_NAME.value)
await bot.provision({
  status,
  setAdminOnly: false,
  attachLifeMinutes: '0',
  doreceive: 'true',
  duration: '0',
  readreceipt: 'true',
  cleardb: 'false',
  contactbackup: 'false',
  convobackup: 'false',
  verifyusers: tokens.VERIFY_USERS,
  // verifyusers = { encryption: false, value: 'automatic' },
})
```

## Message Parsing

The WickrIO Node.js Bot API Framework provides an API to parse incoming messages. This API will return an object which can be used to process an incoming messages:

```js
// ./src/index.js
await bot.startListening(listen) // Passes a callback function that will receive incoming messages into the bot client
async function listen(rawMessage) {
  try {
    // Parses an incoming message
    // returns an object with fields specific to message type
    const messageService = bot.messageService({
      rawMessage,
      adminDMonly: false,
    })
    const {
      time,
      messageID,
      users,
      ttl,
      bor,
      control,
      msgTS,
      receiver,
      file,
      filename,
      message,
      command,
      argument,
      vGroupID,
      convoType,
      msgType,
      userEmail,
      isAdmin,
      latitude,
      longitude,
      isVoiceMemo,
      voiceMemoDuration,
    } = messageService
  } catch (err) {
    console.log({ err })
  }
}
```

The return value depends on the type of message being parsed. Each of the messages types supported will be shown below.

Please note that the 'receiver' field returned will only be set for 1to1 conversations. The 'convotype' will identify 1to1 conversations with the value 'personal'. Also, the 'bor' value is not always set, if it has an undefined value then it did not have a value.

### Text Messages

The following is a normal text message received on a 1to1 conversation:

```js
{ message: 'hello',
  command: '',
  msgTS: '1597671805.827344',
  time: '8/17/20 11:44 AM',
  receiver: 'dkrsvr-bot',
  argument: '',
  vgroupid:
   '2c747a5467b863812a10d15ccfa16bb6eb769a9692bca3f5e086c0537ee04dc4',
  userEmail: 'largeroom2@wickr.com',
  convotype: 'personal',
  isAdmin: true,
  msgtype: 'message',
  ttl: '8/21/20 6:43 AM',
  bor: undefined }
```

The following is a normal text message received on a room conversation:

```js
{ message: 'hello again',
  command: '',
  msgTS: '1597672022.80669',
  time: '8/17/20 11:44 AM',
  receiver: undefined,
  argument: '',
  vgroupid:
   'Sb7064e806fe575b010ec417c12952d3364e620547f883651fff14a77aaf3c2b',
  userEmail: 'largeroom2@wickr.com',
  convotype: 'room',
  isAdmin: true,
  msgtype: 'message',
  ttl: '8/21/20 6:47 AM',
  bor: undefined }
```

The following is a file message:

```js
{ file:
   '/opt/WickrIODebug/clients/dkrsvr-bot/attachments/attachment_20200817102019966_claymation.gif',
  filename: 'claymation.gif',
  vgroupid:
   '2c747a5467b863812a10d15ccfa16bb6eb769a9692bca3f5e086c0537ee04dc4',
  control: undefined,
  msgTS: '1597674019.966755',
  time: '8/17/20 11:44 AM',
  receiver: 'dkrsvr-bot',
  userEmail: 'largeroom2@wickr.com',
  isVoiceMemo: false,
  convotype: 'personal',
  isAdmin: true,
  msgtype: 'file',
  ttl: '8/21/20 10:20 AM',
  bor: undefined }
```

### Edit Messages

The following is an edit message received when a user is sharing their location:

```js
{ vgroupid:
   'Sb7064e806fe575b010ec417c12952d3364e620547f883651fff14a77aaf3c2b',
  edit:
   { latitude: 40.8320684,
     longitude: -74.2000844,
     shareexpiration: 1597678331,
     type: 'location' },
  msgTS: '1597674737.555474',
  time: '8/17/20 11:44 AM',
  receiver: undefined,
  userEmail: 'largeroom3@wickr.com',
  convotype: 'room',
  isAdmin: false,
  msgtype: 'edit',
  ttl: '8/21/20 10:32 AM',
  bor: '8/17/20 11:02 AM' }
```

The following is a sample of a react edit message:

```js
{ vgroupid:
   'Sb7064e806fe575b010ec417c12952d3364e620547f883651fff14a77aaf3c2b',
  edit: {
    originalmessageid: '2101e300e08711ea93034fa243ae69f1',
    reactAdded: false,
    reaction: '❤',
    type: 'reaction' },
  msgTS: '1597669378.865087',
  time: '8/17/20 11:44 AM',
  receiver: undefined,
  userEmail: 'largeroom2@wickr.com',
  convotype: 'room',
  isAdmin: true,
  msgtype: 'edit',
  ttl: '8/21/20 6:02 AM',
  bor: undefined }

```

### Control Messages

The following is a control message that is create a room conversation with the bot in it.

```js
{ vgroupid:
   'S26b4210ff941053604ddc7772a33bf3b309490739d18564952d414f6836dca5',
  control:
   { bor: 0,
     changemask: 47,
     description: '',
     masters: [ 'largeroom2@wickr.com' ],
     members:
      [ 'dkrsvr-bot',
        'largeroom3@wickr.com',
        'largeroom2@wickr.com' ],
     msgtype: 4001,
     title: 'Test Room',
     ttl: 345600 },
  msgTS: '1597672937.805061',
  time: '8/17/20 11:44 AM',
  receiver: undefined,
  userEmail: 'largeroom2@wickr.com',
  convotype: 'room',
  isAdmin: true,
  msgtype: 'edit',
  ttl: '8/21/20 7:02 AM',
  bor: undefined }
```

The following is a control message that is changing the BOR for the room conversation:

```js
{ vgroupid:
   'Sb7064e806fe575b010ec417c12952d3364e620547f883651fff14a77aaf3c2b',
  control:
   { bor: 1800,
     changemask: 32,
     description: '',
     masters:
      [ 'dkrsvr-bot',
        'largeroom2@wickr.com' ],
     members:
      [ 'largeroom10@wickr.com',
        'dkrsvr-bot',
        'largeroom3@wickr.com',
        'largeroom2@wickr.com' ],
     msgtype: 4004,
     title: 'Test the recorder bot',
     ttl: 345600 },
  msgTS: '1597673264.627652',
  time: '8/17/20 11:44 AM',
  receiver: undefined,
  userEmail: 'largeroom2@wickr.com',
  convotype: 'room',
  isAdmin: true,
  msgtype: 'edit',
  ttl: '8/21/20 7:07 AM',
  bor: undefined }
```

The following is a control message that is adding a user to the room conversaion:

```js
{ vgroupid:
   'Sb7064e806fe575b010ec417c12952d3364e620547f883651fff14a77aaf3c2b',
  control:
   { addedusers: [ 'largeroom20@wickr.com' ],
     deletedusers: [],
     msgtype: 4002 },
  msgTS: '1597673379.431875',
  time: '8/17/20 11:44 AM',
  receiver: undefined,
  userEmail: 'largeroom2@wickr.com',
  convotype: 'room',
  isAdmin: true,
  msgtype: 'edit',
  ttl: '8/21/20 7:09 AM',
  bor: '8/17/20 7:39 AM' }

```

The following is a control message that is adding a file to the list of saved items:

```js
{ vgroupid:
   'Sb7064e806fe575b010ec417c12952d3364e620547f883651fff14a77aaf3c2b',
  control:
   { bor: 0,
     changemask: 64,
     description: '',
     filevaultinfo:
      { filehash:
         '42b2b8073622e2565a0328f7372d00b77f8ff6d559eaaa647e4e78d78335af182e59a73514ebd464b9e12fcaeef3781bc4036b147fdecc6cbe0f2cb1720f73f9',
        guid: '760E366E-2303-4F31-93BD-4680550B766B',
        key:
         '00f8b2f5d88fe9e16a7db033ad0a7ffc4a9394aa9df98260ceda5768ee903979f8' },
     masters:
      [ 'dkrsvr-bot',
        'largeroom2@wickr.com' ],
     members:
      [ 'largeroom10@wickr.com',
        'dkrsvr-bot',
        'largeroom3@wickr.com',
        'largeroom2@wickr.com' ],
     msgtype: 4004,
     title: 'Test the recorder bot',
     ttl: 345600 },
  msgTS: '1597672364.639996',
  time: '8/17/20 11:44 AM',
  receiver: undefined,
  userEmail: 'largeroom2@wickr.com',
  convotype: 'room',
  isAdmin: true,
  msgtype: 'edit',
  ttl: '8/21/20 6:52 AM',
  bor: undefined }
```

### Calling Messages

Bots cannot join calls so the messages received will be limited.

The following is a start of a call.

```js
{ status: 0,
  vgroupid:
   '2c747a5467b863812a10d15ccfa16bb6eb769a9692bca3f5e086c0537ee04dc4',
  call:
   { calluri: '54.242.44.87:16422',
     calluriipv6: '[2600:1f18:2741:9e02:dbce:1ad1:f081:e907]:16422',
     meetingid: 0,
     participants:
      [ '5eabc0ed821a7dd12705006ed2a6f7c61e553a35f46420783a578de03e8a0460',
        'de08b4191d3f5efdac3a009a3f6ec6a2b0c5f77a0b07cacbe6690bfc3dd17a00' ],
     status: 0,
     version: 2,
     versioncheck: true },
  msgTS: '1597674354.922994',
  time: '8/17/20 11:44 AM',
  receiver: 'dkrsvr-bot',
  userEmail: 'largeroom2@wickr.com',
  convotype: 'personal',
  isAdmin: true,
  msgtype: 'call',
  ttl: '8/21/20 10:25 AM',
  bor: undefined }
```
