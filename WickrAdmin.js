const fs = require('fs');
const {exec, execSync, execFileSync} = require('child_process');
const WickrIOAPI = require('wickrio_addon');
var strings = require('./WickrStrings');

class WickrAdmin {
  constructor() {
    this.adminIDs = [];
    this.verifyAutomatic = true;
  }

  async setVerifyMode(mode)
  {
    if (this.adminIDs.length > 0) {
      if (mode === 'manual') {
         this.verifyAutomatic = false;
      } else if (mode === 'automatic') {
         this.verifyAutomatic = true;
      } else {
        console.log("Invalid verification mode: " + mode);
        return false;
      }
      var setVerifMode = WickrIOAPI.cmdSetVerificationMode(mode);
      return true;
    } else {
      console.log(strings["setModeNoAdminsError"]);
      return false;
    }
  }

  async addAdmin(userID)
  {
    var found = this.adminIDs.includes(userID);
    if (found === true) {
        return found;
    }

    this.adminIDs.push(userID);
    //var saved = this.saveData();
    console.log("New Wickr user added to database.");

    return this.adminIDs[this.adminIDs.indexOf(userID)];
  }

  getAdmin(userID)
  {
    console.log(this.adminIDs);

    var found = this.adminIDs.includes(userID);
    if (found === false) {
        return undefined;
    }

    return this.adminIDs[this.adminIDs.indexOf(userID)];
  }

  getAdmins()
  {
    return this.adminIDs;
  }

  deleteAdmin(userID)
  {
    var found = this.adminIDs.find(function(user) {
      return user.userID === userID;
    });
    var index = this.adminIDs.indexOf(found);
    this.adminIDs.splice(index, 1);
    return found;
  }

  updateAdminList()
  {
    var processes;
    try {
        processes = fs.readFileSync('./processes.json', 'utf-8');
        if (!processes) {
          console.log("Error reading processes.json!")
          return;
        }
    }
    catch (err) {
        console.log(err);
        return;
    }

    var pjson = JSON.parse(processes);
    console.log(pjson);

    var wlUsers = this.adminIDs.join(',');
    if (pjson.apps[0].env.tokens.ADMINISTRATORS.encrypted) {
        var wlUsersEncrypted = WickrIOAPI.cmdEncryptString(wlUsers);
        pjson.apps[0].env.tokens.ADMINISTRATORS.value = wlUsersEncrypted;
    } else {
        pjson.apps[0].env.tokens.ADMINISTRATORS.value = wlUsers;
    }

    console.log(pjson);

    try {
        var cp = execSync('cp processes.json processes_backup.json');
        var ps = fs.writeFileSync('./processes.json', JSON.stringify(pjson, null, 2));
    } catch (err) {
        console.log(err);
    }
  }

  // This function will process admin commands from the incoming values.
  processAdminCommand(sender, vGroupID, command, argument)
  {
      if (command === '/admin') {
        var action = argument.toLowerCase().trim();
        if (action === 'list') {
          var userList = this.adminIDs.join('\n');
          var reply = strings["currentAdmins"].replace("%{userList}", userList);
          var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        } else if (action.startsWith("add")) {
          // Process the list of users to be added from the white list
          var values = action.split(' ');
          values.shift();
          var addFails = [];
          if (values.length >= 1) {
            for(var i = 0; i < values.length; i++){
              if (this.adminIDs.includes(values[i])) {
                addFails.push(values.splice(i,1));
                  i--;
              }
            }
            if (addFails.length >= 1) {
              var reply = strings["alreadyContains"].replace("%{user}", addFails.join("\n"));
              var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
            } 
            if (values.length >= 1) {
              // Send the initial response
              var userList = values.join('\n');
              var reply = strings["adminsToAdd"].replace("%{userList}", userList);
              var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
  
              // add the user(s) from the white list and update the config file
              for (var i = 0; i < values.length; i++) {
                this.adminIDs.push( values[i] );
              }
              this.updateAdminList();
  
              // Send a message to all the current white listed users
              var donereply = strings["adminsAdded"].replace("%{sender}", sender).replace("%{userList}", userList);
              var uMessage = WickrIOAPI.cmdSend1to1Message(this.adminIDs, donereply);
            }
          } else {
            var reply = strings["noNewAdmins"];
            var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
          }
        } else if (action.startsWith("remove")) {
          // Process the list of users to be removed from the white list
          // TODO potentially add buttons here?
          var values = action.split(' ');
          values.shift();
          var removeFails = [];
          if (values.length >= 1) {
            for(var i = 0; i < values.length; i++){
              if (! this.adminIDs.includes(values[i])) {
                removeFails.push(values.splice(i, 1));
                i--;
              }
            }
            if (removeFails.length >= 1) {
              var reply = strings["removeFail"].replace("%{user}", removeFails.join("\n"));
              var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
            }
  
            // Send the initial response
            var userList = values.join('\n');
            if (values.length >= 1) {
              var reply = strings["adminsToDelete"].replace("%{userList}", userList);
              var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
  
              // Remove the user(s) from the white list and update the config file
              for (var i = 0; i < values.length; i++) {
                this.adminIDs.splice( this.adminIDs.indexOf(values[i]), 1);
              }
              this.updateAdminList();
  
              // Send a message to all the current white listed users
              var donereply = strings["adminsDeleted"].replace("%{userEmail}", userEmail).replace("%{userList}", userList);
              var uMessage = WickrIOAPI.cmdSend1to1Message(this.adminIDs, donereply);
            }
          } else {
            var reply = strings["noRemoveAdmins"];
            var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
          }
        } else {
              var reply = strings["invalidAdminCommand"];
              var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
          }
      } else {
        if (this.verifyAutomatic !== true) {
          if (command === '/verify') {
            var action = argument.toLowerCase().trim();
        
            console.log("verify action is " + action);

            if (action.startsWith('getlist')) {
              var values = action.split(' ');
              values.shift();
              var mode = values[0];

              if (mode === "all") {
                  var getVerifList = WickrIOAPI.cmdGetVerificationList(mode);
              } else {
                  var getVerifList = WickrIOAPI.cmdGetVerificationList();
              }
              console.log("verify getlist response:" + getVerifList);
              var verificationList = JSON.parse(getVerifList);
              var reply="User Verification List";
              if (verificationList.users) {
                for(var i = 0; i < verificationList.users.length; i++){
                  if (verificationList.users[i].user && verificationList.users[i].reason) {
                    var userreply  = "\nUser: " + verificationList.users[i].user + "  Reason: " + verificationList.users[i].reason;
                    if ((reply.length + userreply.length) >= 10000) {
                        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
                        reply="User Verification List (continued)";
                    }
                    reply = reply + userreply;
                  }
                }
              }
              var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
            } else if (action === 'all') {
              var reply = WickrIOAPI.cmdVerifyAll();
              var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
            } else if (action === 'users') {
            } else if (action.startsWith("setmode")) {
              // get the mode to be set
              var values = action.split(' ');
              values.shift();
              var mode = values[0];
              if (mode === "automatic" || mode === "manual") {
                var response = WickrIOAPI.cmdSetVerificationMode(mode);
                var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, response);
              } else {
                var reply="Invalid mode, usage:\n/verify setmode automatic|manual";
                var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
              }
            } else {
              var reply = strings["invalidVerifyCommand"];
              var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
            }
          }
        }
      }
  }

  // This function will modify the input help string to include
  // the admin command help
  getHelp(helpString)
  {
    if (helpString.includes("{adminHelp}")) {
      if (this.verifyAutomatic === true) {
        var reply = helpString.replace("%{adminHelp}", strings["adminHelp"]);
        return reply;
      } else {
        var reply = helpString.replace("%{adminHelp}", strings["adminHelpWithVerify"]);
        return reply;
      }
    } else {
      return strings["adminHelp"];
    }
  }

};


module.exports = WickrAdmin;
