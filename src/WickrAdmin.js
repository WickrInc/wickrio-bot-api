const fs = require('fs')
const WickrIOAPI = require('wickrio_addon')
const strings = require('./WickrStrings')

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
      WickrIOAPI.cmdSetVerificationMode(mode)
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
    // const saved = this.saveData();
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
      fs.execSync('cp processes.json processes_backup.json')
      fs.writeFileSync(
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
      const action = argument.toLowerCase().trim()
      if (action === 'list') {
        const userList = this.adminIDs.join('\n')
        const reply = strings.currentAdmins.replace('%{userList}', userList)
        WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
      } else if (action.startsWith('add')) {
        // Process the list of users to be added from the white list
        let values = action.split(' ')
        values.shift()
        values = this.removeDuplicates(values)
        const addFails = []
        if (values.length >= 1) {
          for (let i = 0; i < values.length; i++) {
            if (this.adminIDs.includes(values[i])) {
              addFails.push(values.splice(i, 1))
              i--
            }
          }
          if (addFails.length >= 1) {
            const reply = strings.alreadyContains.replace(
              '%{user}',
              addFails.join('\n')
            )
            WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
          }
          if (values.length >= 1) {
            // Send the initial response
            const userList = values.join('\n')
            const reply = strings.adminsToAdd.replace('%{userList}', userList)
            WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)

            // add the user(s) from the white list and update the config file
            for (let i = 0; i < values.length; i++) {
              this.adminIDs.push(values[i])
            }
            this.updateAdminList()

            // Send a message to all the current admin users
            const donereply = strings.adminsAdded
              .replace('%{sender}', sender)
              .replace('%{userList}', userList)
            WickrIOAPI.cmdSend1to1Message(
              this.adminIDs,
              donereply
            )
          }
        } else {
          const reply = strings.noNewAdmins
          WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
        }
      } else if (action.startsWith('remove')) {
        // Process the list of users to be removed from the white list
        // TODO potentially add buttons here?
        let values = action.split(' ')
        values.shift()
        values = this.removeDuplicates(values)
        const removeFails = []
        if (values.length >= 1) {
          for (let i = 0; i < values.length; i++) {
            if (!this.adminIDs.includes(values[i])) {
              removeFails.push(values.splice(i, 1))
              i--
            }
          }
          if (removeFails.length >= 1) {
            const reply = strings.removeFail.replace(
              '%{user}',
              removeFails.join('\n')
            )
            WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
          }

          // Send the initial response
          const userList = values.join('\n')
          if (values.length >= 1) {
            const reply = strings.adminsToDelete.replace(
              '%{userList}',
              userList
            )
            WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)

            // Remove the user(s) from the white list and update the config file
            for (let i = 0; i < values.length; i++) {
              this.adminIDs.splice(this.adminIDs.indexOf(values[i]), 1)
            }
            this.updateAdminList()

            // Send a message to all the current admin users
            const donereply = strings.adminsDeleted
              .replace('%{sender}', sender)
              .replace('%{userList}', userList)
            WickrIOAPI.cmdSend1to1Message(this.adminIDs, donereply)
          }
        } else {
          const reply = strings.noRemoveAdmins
          WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
        }
      } else {
        const reply = strings.invalidAdminCommand
        WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
      }
      return true
    } else {
      if (this.verifyAutomatic !== true) {
        if (command === '/verify') {
          const action = argument.toLowerCase().trim()
          if (action.startsWith('getlist')) {
            const values = action.split(' ')
            values.shift()
            const mode = values[0]
            let getVerifList

            if (mode === 'all') {
              getVerifList = WickrIOAPI.cmdGetVerificationList(mode)
            } else {
              getVerifList = WickrIOAPI.cmdGetVerificationList()
            }
            const verificationList = JSON.parse(getVerifList)
            let reply = 'User Verification List'
            if (verificationList.users) {
              for (let i = 0; i < verificationList.users.length; i++) {
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
                    WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
                    reply = 'User Verification List (continued)'
                  }
                  reply = reply + userreply
                }
              }
            }
            WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
          } else if (action === 'all') {
            const reply = WickrIOAPI.cmdVerifyAll()
            WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
          } else if (action === 'users') {
          } else if (action.startsWith('setmode')) {
            // get the mode to be set
            const values = action.split(' ')
            values.shift()
            const mode = values[0]
            if (mode === 'automatic' || mode === 'manual') {
              const response = WickrIOAPI.cmdSetVerificationMode(mode)
              WickrIOAPI.cmdSendRoomMessage(vGroupID, response)
            } else {
              const reply =
                'Invalid mode, usage:\n/verify setmode automatic|manual'
              WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
            }
          } else {
            const reply = strings.invalidVerifyCommand
            WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
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
        const reply = helpString.replace('%{adminHelp}', strings.adminHelp)
        return reply
      } else {
        const reply = helpString.replace(
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
}

module.exports = WickrAdmin
