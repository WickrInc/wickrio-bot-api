const WickrIOAPI = require('wickrio_addon');
const WickrUser = require('./WickrUser');
var fs = require('fs');

class WickrIOBot {

  constructor() {
    this.wickrUsers = [];
  }

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
          if (connected) {
            var encrypted = await ref.encryptEnv();
            var loaded = await ref.loadData(ref.wickrUsers);
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

  async startListening(callback) {
    try {
      return new Promise(function(resolve, reject) {
        var start = WickrIOAPI.cmdStartAsyncRecvMessages(callback);
        if (start === 'Success')
          resolve(start);
        else
          reject(start);
      }).then(function(start) {
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

  async close() {
    try {
      var saved = this.saveData(this.wickrUsers);
      return new Promise(function(resolve, reject) {
        var stopMessaging = WickrIOAPI.cmdStopAsyncRecvMessages();
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
      return false;
      console.log(err);
    }
  }

  async encryptEnv() {
    var processes = JSON.parse(fs.readFileSync('processes.json'));
    var tokens = processes.apps[0].env.tokens;
    for (var i in processes.apps[0].env.tokens) {
      if (i === "BOT_USERNAME")
        continue;
      if (!processes.apps[0].env.tokens[i].encrypted) {
        try {
          processes.apps[0].env.tokens[i].value = WickrIOAPI.cmdEncryptString(processes.apps[0].env.tokens[i].value);
          processes.apps[0].env.tokens[i].encrypted = true;
        } catch (err) {
          console.log("Unable to encrypt Bot Tokens:", err);
          return false;
        }
      }
    }
    var ps = fs.writeFileSync('./processes.json', JSON.stringify(processes, null, 2));
    console.log("Bot tokens encrypted successfully!");
    return true;
  }

  async loadData(wickrUsers) {
    try {
      var users = JSON.parse(fs.readFileSync('users.json'));
      if (users.value.length === 0) {
        return;
      }
      if (users.encrypted) {
        console.log("Decrypting user database...");
        for (var i in users.value) {
          wickrUsers[i] = Object.create(users.value[i]);
          for (var property in users.value[i]) {
            if (users.value[i].hasOwnProperty(property) && users.value[i][property]) {
              if (property === 'index')
                wickrUsers[i][property] = Number(WickrIOAPI.cmdDecryptString(users.value[i][property]));
              else
                wickrUsers[i][property] = WickrIOAPI.cmdDecryptString(users.value[i][property]);
            } else {
              wickrUsers[i][property] = users.value[i][property];
            }
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  saveData(wickrUsers) {
    try {
      if (wickrUsers.length > 0) {
        console.log("Encrypting user database...");
        var data = [];
        for (var i in wickrUsers) {
          var wickrUser = Object.assign({}, wickrUsers[i]);
          data.push(wickrUser);
          for (var property in data[i]) {
            if (data[i].hasOwnProperty(property) && data[i][property]) {
              if (typeof data[i][property] === 'string')
                data[i][property] = WickrIOAPI.cmdEncryptString(data[i][property]);
              else
                data[i][property] = WickrIOAPI.cmdEncryptString(JSON.stringify(data[i][property]));
            }
          }
        }
        var obj = {
          "value": data,
          "encrypted": true
        };
        var users = fs.writeFileSync('users.json', JSON.stringify(obj));
      }
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
    if (message.message) {
      var sender = message.sender;
      var vGroupID = message.vgroupid;
      var request = message.message.toLowerCase();
      var command = '',
        argument = '',
        convoType = '';
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
    } else {
      try {
        if (message.call)
          WickrIOAPI.cmdSendRoomMessage(message.vgroupid, "Sorry I cannot take calls, I wasn't given that feature yet (:");
        else if (message.control) {
          if (msgtype === 4002) {
            WickrIOAPI.cmdSendRoomMessage(message.vgroupid, "Hey, thanks for adding me to the room!\nEnter '/help@" +
              bot_username + "' to see the list of available commands.\n" +
              "FYI, any commands and info you request, will be visible to all room members. To prevent that, just start a 1-to-1 convo with me and send the commands in there.");
          } else if (msgtype === 4001) {
            WickrIOAPI.cmdSendRoomMessage(message.vgroupid, "Hey, thanks for adding me to the group conversation!\nEnter '/help@" +
              bot_username + "' to see the list of available commands.\n" +
              "FYI, any commands and info you request, will be visible to all of the group conversation members. To prevent that, just start a 1-to-1 convo with me and send the commands in there.");
          }
        }
      } catch (err) {
        console.log(err);
      }
      return false;
    }
  }

  addUser(wickrUser) {
    this.wickrUsers.push(wickrUser);
    var saved = this.saveData(this.wickrUsers);
    return "New Wickr user added to database.";
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
