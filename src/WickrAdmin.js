const fs = require('fs')
const { exec, execSync, execFileSync } = require('child_process')
const WickrIOAPI = require('wickrio_addon')
const strings = require('./WickrStrings')
const XRegExp = require('xregexp')

class WickrAdmin {
  constructor() {
    this.adminIDs = []
    this.verifyAutomatic = true
  }

  async setVerifyMode(mode) {
    if (this.adminIDs.length > 0) {
      if (mode === 'manual') {
        this.verifyAutomatic = false
      } else if (mode === 'automatic') {
        this.verifyAutomatic = true
      } else {
        console.log('Invalid verification mode: ' + mode)
        return false
      }
      const setVerifMode = WickrIOAPI.cmdSetVerificationMode(mode)
      return true
    } else {
      console.log(strings.setModeNoAdminsError)
      return false
    }
  }

  async addAdmin(userID) {
    const found = this.adminIDs.includes(userID)
    if (found === true) {
      return found
    }

    this.adminIDs.push(userID)
    // var saved = this.saveData();
    console.log('New Wickr user added to database.')

    return this.adminIDs[this.adminIDs.indexOf(userID)]
  }

  getAdmin(userID) {
    const found = this.adminIDs.includes(userID)
    if (found === false) {
      return undefined
    }

    return this.adminIDs[this.adminIDs.indexOf(userID)]
  }

  getAdmins() {
    return this.adminIDs
  }

  deleteAdmin(userID) {
    const found = this.adminIDs.find(function (user) {
      return user.userID === userID
    })
    const index = this.adminIDs.indexOf(found)
    this.adminIDs.splice(index, 1)
    return found
  }

  updateAdminList() {
    let processes
    try {
      processes = fs.readFileSync('./processes.json', 'utf-8')
      if (!processes) {
        console.log('Error reading processes.json!')
        return
      }
    } catch (err) {
      console.log(err)
      return
    }

    const pjson = JSON.parse(processes)
    const wlUsers = this.adminIDs.join(',')
    if (pjson.apps[0].env.tokens.ADMINISTRATORS.encrypted) {
      const wlUsersEncrypted = WickrIOAPI.cmdEncryptString(wlUsers)
      pjson.apps[0].env.tokens.ADMINISTRATORS.value = wlUsersEncrypted
    } else {
      pjson.apps[0].env.tokens.ADMINISTRATORS.value = wlUsers
    }

    try {
      const cp = execSync('cp processes.json processes_backup.json')
      const ps = fs.writeFileSync(
        './processes.json',
        JSON.stringify(pjson, null, 2)
      )
    } catch (err) {
      console.log(err)
    }
  }

  // This function will process admin commands from the incoming values.
  processAdminCommand(sender, vGroupID, command, argument) {
    if (command === '/admin') {
      var action = argument.toLowerCase().trim()
      if (action === 'list') {
        var userList = this.adminIDs.join('\n')
        var reply = strings.currentAdmins.replace('%{userList}', userList)
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
      } else if (action.startsWith('add')) {
        // Process the list of users to be added from the white list
        var values = action.split(' ')
        values.shift()
        values = this.removeDuplicates(values)
        const addFails = []
        if (values.length >= 1) {
          //check to see if a user already  exists in the admin list
          for (var i = 0; i < values.length; i++) {
            if (this.adminIDs.includes(values[i])) {
              addFails.push(values.splice(i, 1))
              i--
            }
          }
          if (addFails.length >= 1) {
            var reply = strings.alreadyContains.replace(
              '%{user}',
              addFails.join('\n')
            )
            var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
          }
          if (values.length >= 1) {
            // check to see if users are in valid email format
            const emailFails = []
            for(let i = 0; i < values.length; i++){
              if(!this.emailRegexTest(values[i])){
                emailFails.push(values[i])
              }
            }
            // if all emails are valid proceed to check if they exist in  the network
            if(emailFails.length === undefined || emailFails.length === 0){
              // if the users exist in your network add them
              const userInfoData = JSON.parse(WickrIOAPI.cmdGetUserInfo(values))
              if(userInfoData.failed === undefined || userInfoData.failed.length === 0){
                  // Send the initial response
                  var userList = values.join('\n')
                  var reply = strings.adminsToAdd.replace('%{userList}', userList)
                  var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)

                  // add the user(s) from the white list and update the config file
                  for (var i = 0; i < values.length; i++) {
                    this.adminIDs.push(values[i])
                  }
                  this.updateAdminList()

                  // Send a message to all the current admin users
                  var donereply = strings.adminsAdded
                  .replace('%{sender}', sender)
                  .replace('%{userList}', userList)
                  var uMessage = WickrIOAPI.cmdSend1to1Message(
                    this.adminIDs,
                    donereply
                  )
              } else {
                reply = strings.notInNetwork.replace('%{userList}',userInfoData.failed)
                WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
              }
            } else {
              reply  = strings.invalidEmail.replace('%{userList}',emailFails)
              WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
            }
          }
        } else {
          var reply = strings.noNewAdmins
          var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
        }
      } else if (action.startsWith('remove')) {
        // Process the list of users to be removed from the white list
        // TODO potentially add buttons here?
        var values = action.split(' ')
        values.shift()
        values = this.removeDuplicates(values)
        const removeFails = []
        if (values.length >= 1) {
          for (var i = 0; i < values.length; i++) {
            if (!this.adminIDs.includes(values[i])) {
              removeFails.push(values.splice(i, 1))
              i--
            }
          }
          if (removeFails.length >= 1) {
            var reply = strings.removeFail.replace(
              '%{user}',
              removeFails.join('\n')
            )
            var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
          }

          // Send the initial response
          var userList = values.join('\n')
          if (values.length >= 1) {
            var reply = strings.adminsToDelete.replace('%{userList}', userList)
            var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)

            // Remove the user(s) from the white list and update the config file
            for (var i = 0; i < values.length; i++) {
              this.adminIDs.splice(this.adminIDs.indexOf(values[i]), 1)
            }
            this.updateAdminList()

            // Send a message to all the current admin users
            var donereply = strings.adminsDeleted
              .replace('%{sender}', sender)
              .replace('%{userList}', userList)
            var uMessage = WickrIOAPI.cmdSend1to1Message(
              this.adminIDs,
              donereply
            )
          }
        } else {
          var reply = strings.noRemoveAdmins
          var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
        }
      } else {
        var reply = strings.invalidAdminCommand
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
      }
      return true
    } else {
      if (this.verifyAutomatic !== true) {
        if (command === '/verify') {
          var action = argument.toLowerCase().trim()
          if (action.startsWith('getlist')) {
            var values = action.split(' ')
            values.shift()
            var mode = values[0]

            if (mode === 'all') {
              var getVerifList = WickrIOAPI.cmdGetVerificationList(mode)
            } else {
              var getVerifList = WickrIOAPI.cmdGetVerificationList()
            }
            const verificationList = JSON.parse(getVerifList)
            var reply = 'User Verification List'
            if (verificationList.users) {
              for (var i = 0; i < verificationList.users.length; i++) {
                if (
                  verificationList.users[i].user &&
                  verificationList.users[i].reason
                ) {
                  const userreply =
                    '\nUser: ' +
                    verificationList.users[i].user +
                    '  Reason: ' +
                    verificationList.users[i].reason
                  if (reply.length + userreply.length >= 10000) {
                    var uMessage = WickrIOAPI.cmdSendRoomMessage(
                      vGroupID,
                      reply
                    )
                    reply = 'User Verification List (continued)'
                  }
                  reply = reply + userreply
                }
              }
            }
            var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
          } else if (action === 'all') {
            var reply = WickrIOAPI.cmdVerifyAll()
            var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
          } else if (action === 'users') {
          } else if (action.startsWith('setmode')) {
            // get the mode to be set
            var values = action.split(' ')
            values.shift()
            var mode = values[0]
            if (mode === 'automatic' || mode === 'manual') {
              const response = WickrIOAPI.cmdSetVerificationMode(mode)
              var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, response)
            } else {
              var reply =
                'Invalid mode, usage:\n/verify setmode automatic|manual'
              var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
            }
          } else {
            var reply = strings.invalidVerifyCommand
            var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
          }
          return true
        }
      }
    }
  }

  // This function will modify the input help string to include
  // the admin command help
  getHelp(helpString) {
    if (helpString.includes('{adminHelp}')) {
      if (this.verifyAutomatic === true) {
        var reply = helpString.replace('%{adminHelp}', strings.adminHelp)
        return reply
      } else {
        var reply = helpString.replace(
          '%{adminHelp}',
          strings.adminHelpWithVerify
        )
        return reply
      }
    } else {
      return strings.adminHelp
    }
  }

  // Function to remove duplicate values from a list of users
  removeDuplicates(userList) {
    const uniqueUsers = []
    for (let user = 0; user < userList.length; user += 1) {
      if (!uniqueUsers.includes(userList[user])) {
        uniqueUsers.push(userList[user])
      }
    }
    return uniqueUsers
  }

  /*
      Function that checks and see if a users email is valid using the following regex from https://www.w3resource.com/javascript/form/email-validation.php
      ^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$
  */
 emailRegexTest(user){
  const emailRegex = XRegExp(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)
    if (!emailRegex.test(user)) {
        console.log(user, ' did not pass the email regex test')
        return false
    }
    console.log(user,' passed the email regex test')
    return true
}

}

module.exports = WickrAdmin
