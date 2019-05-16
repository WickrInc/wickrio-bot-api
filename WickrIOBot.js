const WickrIOAPI = require('wickrio_addon');
const WickrUser = require('./WickrUser');
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');
var encryptor;

class WickrIOBot {

  constructor() {
    this.wickrUsers = [];
    this.listenFlag = false;
    // Connect to the db
    MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
      if (!err) {
        console.log("We are connected");
      }
    });
  }

  //WickrIO API functions used: clientInit() and isConnected()
  async start(client_username) {
    try {
      var ref = this;
      console.log('Starting bot up...');
      return new Promise(function(resolve, reject) {
        var status = WickrIOAPI.clientInit(client_username);
        console.log(status);
        resolve(status);
      }).then(function(status) {
        return new Promise(function(resolve, reject) {
          var connected = WickrIOAPI.isConnected(10);
          console.log('isConnected:', connected)
          resolve(connected);
        }).then(async function(connected) {
          var settings = JSON.parse(fs.readFileSync('package.json'));
          //Check if bot supports a user database
          if (!settings.database) {
            return true;
          }
          if (connected) {
            var encrypted = await ref.encryptEnv();
            var loaded = await ref.loadData();
            return true;
          } else {
            return false;
          }
        }).catch(error => {
          console.log(error);
        });
      }).catch(error => {
        console.log(error);
      });
    } catch (err) {
      console.log(err);
    }
  }

  //WickrIO API functions used: cmdStartAsyncRecvMessages
  async startListening(callback) {
    try {
      var ref = this;
      return new Promise(function(resolve, reject) {
        var start = WickrIOAPI.cmdStartAsyncRecvMessages(callback);
        if (start === 'Success')
          resolve(start);
        else
          reject(start);
      }).then(function(start) {
        ref.listenFlag = true;
        console.log('Bot message listener set successfully!');
        return true;
      }).catch(error => {
        console.log('Bot message listener failed to set:', error);
        return false;
      });
    } catch (err) {
      console.log(err);
    }
  }

  //WickrIO API functions used: closeClient() and cmdStopAsyncRecvMessages()
  async close() {
    try {
      var ref = this;
      var settings = JSON.parse(fs.readFileSync('package.json'));
      //Check if bot supports a user database
      if (settings.database) {
        var saved = this.saveData();
      }
      return new Promise(function(resolve, reject) {
        var stopMessaging = 'not needed';
        if (ref.listenFlag === true)
          stopMessaging = WickrIOAPI.cmdStopAsyncRecvMessages();
        resolve(stopMessaging);
      }).then(function(stopMessaging) {
        if (stopMessaging === 'Success') {
          console.log('Async message receiving stopped!')
        }
        console.log('Shutting bot down...');
        return new Promise(function(resolve, reject) {
          var closed = WickrIOAPI.closeClient();
          resolve(closed);
        }).then(function(closed) {
          console.log(closed);
          console.log('Bot shut down successfully!');
          return true;
        }).catch(error => {
          console.log(error);
        });
      }).catch(error => {
        console.log(error);
      });
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  //WickrIO API functions used: cmdEncryptString()
  async encryptEnv() {
    try {
      var processes = JSON.parse(fs.readFileSync('processes.json'));
      var tokens = JSON.parse(process.env.tokens);
      //Create an encryptor:
      var key;
      if (tokens.DATABASE_ENCRYPTION_KEY.encrypted) {
        key = WickrIOAPI.cmdDecryptString(tokens.DATABASE_ENCRYPTION_KEY.value);
      } else {
        key = tokens.DATABASE_ENCRYPTION_KEY.value;
      }
      encryptor = require('simple-encryptor')(key);
      for (var i in tokens) {
        if (i === "BOT_USERNAME")
          continue;
        if (!tokens[i].encrypted) {
          tokens[i].value = WickrIOAPI.cmdEncryptString(tokens[i].value);
          tokens[i].encrypted = true;
        }
      }
      processes.apps[0].env.tokens = tokens;
      var ps = fs.writeFileSync('./processes.json', JSON.stringify(processes, null, 2));
      console.log("Bot tokens encrypted successfully!");
      return true;
    } catch (err) {
      console.log("Unable to encrypt Bot Tokens:", err);
      return false;
    }
  }

  //Loads and decrypts the bot's user database
  //WickrIO API functions used: cmdDecryptString()
  async loadData() {
    try {
      var users = fs.readFileSync('users.txt', 'utf-8');
      if (users.length === 0 || !users || users === "") {
        return;
      }
      console.log("Decrypting user database...");
      var ciphertext = WickrIOAPI.cmdDecryptString(users.toString());
      // Decrypt
      var decryptedData = encryptor.decrypt(ciphertext);
      this.wickrUsers = decryptedData;
    } catch (err) {
      console.log(err);
    }
  }

  //Decrypts and saves the bot's user database
  //WickrIO API functions used: cmdEncryptString()
  async saveData() {
    try {
      console.log("Encrypting user database...");
      if (this.wickrUsers.length === 0) {
        return;
      }
      //Encrypt
      var ciphertext = encryptor.encrypt(this.wickrUsers);
      var encrypted = WickrIOAPI.cmdEncryptString(ciphertext);
      var saved = fs.writeFileSync('users.txt', encrypted, 'utf-8');
      console.log("User database saved to file!");
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  parseMessage(message) {
    var tokens = JSON.parse(process.env.tokens);
    var bot_username = tokens.BOT_USERNAME.value;
    console.log(message)
    message = JSON.parse(message);
    var msgtype = message.msgtype;
    var sender = message.sender;
    var vGroupID = message.vgroupid;
    var request = message.message;
    var command = '',
      argument = '',
      convoType = '';
    if (message.control)
      return;
    else
      var parsedData = request.match(/(\/[a-zA-Z]+)(@[a-zA-Z0-9_-]+)?(\s+)?(.*)$/);
    if (parsedData !== null) {
      command = parsedData[1].toLowerCase();
      if (parsedData[4] !== '') {
        argument = parsedData[4].toLowerCase();
      }
    }
    if (vGroupID.charAt(0) === 'a' || vGroupID.charAt(0) === 'c' || vGroupID.charAt(0) === 'd')
      convoType = 'personal';
    else if (vGroupID.charAt(0) === 'G')
      convoType = 'groupconvo';
    else
      convoType = 'room';

    var parsedObj = {
      'message': request,
      'command': command,
      'argument': argument,
      'vgroupid': vGroupID,
      'userEmail': sender,
      'convotype': convoType
    };
    return parsedObj;
  }

  addUser(wickrUser) {
    this.wickrUsers.push(wickrUser);
    var saved = this.saveData();
    return console.log("New Wickr user added to database.");
  }

  getUser(userEmail) {
    var found = this.wickrUsers.find(function(user) {
      return user.userEmail === userEmail;
    });
    return found;
  }

  getUsers() {
    return this.wickrUsers;
  }

  deleteUser(userEmail) {
    var found = this.wickrUsers.find(function(user) {
      return user.userEmail === userEmail;
    });
    var index = this.wickrUsers.indexOf(found);
    this.wickrUsers.splice(index, 1);
    return found;
  }
};

module.exports = {
  WickrIOBot,
  WickrUser
};
