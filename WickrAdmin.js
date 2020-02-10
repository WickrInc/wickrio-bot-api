class WickrAdmin {
  constructor() {
    this.adminIDs = [];
  }

  async addAdmin(userID) {
    var found = this.adminIDs.includes(userID);
    if (found === true) {
        return found;
    }

    this.adminIDs.push(userID);
    var saved = this.saveData();
    console.log("New Wickr user added to database.");

    return wickrAdmin;
  }

  getAdmin(userID) {
    console.log(this.adminIDs);

    var found = this.adminIDs.includes(userID);
    if (found === false) {
        return undefined;
    }

    return this.adminIDs[this.adminIDs.indexOf(userID)];
  }

  getAdmins() {
    return this.wickrAdmins;
  }

  deleteAdmin(userID) {
    var found = this.wickrAdmins.find(function(user) {
      return user.userID === userID;
    });
    var index = this.wickrAdmins.indexOf(found);
    this.wickrAdmins.splice(index, 1);
    return found;
  }

  processAdminCommand(command, argument) {
      if (command === '/admin') {
        user.confirm = '';
        var action = argument.toLowerCase().trim();
        if (action === 'list') {
          var userList = whitelisted_users.join('\n');
          var reply = strings["currentAdmins"].replace("%{userList}", userList);
          var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        } else if (action.startsWith("add")) {
          // Process the list of users to be added from the white list
          var values = action.split(' ');
          values.shift();
          var addFails = [];
          if (values.length >= 1) {
            for(var i = 0; i < values.length; i++){
              if (whitelisted_users.includes(values[i])) {
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
                whitelisted_users.push( values[i] );
              }
              updateWhiteList();
  
              // Send a message to all the current white listed users
              var donereply = strings["adminsAdded"].replace("%{userEmail}", userEmail).replace("%{userList}", userList);
              var uMessage = WickrIOAPI.cmdSend1to1Message(whitelisted_users, donereply);
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
              if (! whitelisted_users.includes(values[i])) {
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
                whitelisted_users.splice( whitelisted_users.indexOf(values[i]), 1);
              }
              updateWhiteList();
  
              // Send a message to all the current white listed users
              var donereply = strings["adminsDeleted"].replace("%{userEmail}", userEmail).replace("%{userList}", userList);
              var uMessage = WickrIOAPI.cmdSend1to1Message(whitelisted_users, donereply);
            }
          } else {
            var reply = strings["noRemoveAdmins"];
            var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
          }
        } else {
              var reply = strings["invalidAdminCommand"];
              var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
          }
      }
  }
};


module.exports = WickrAdmin;
