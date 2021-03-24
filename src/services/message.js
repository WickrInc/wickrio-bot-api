const fs = require('fs')
const WickrUser = require('../WickrUser')
let encryptor
const encryptorDefined = false

const util = require('util')

class MessageService {
  constructor({
    rawMessage,
    admins,
    adminOnly,
    wickrUsers,
    wickrAPI,
    adminDMonly = false,
    testOnly = false,
  }) {
    this.rawMessage = rawMessage
    this.adminDMonly = adminDMonly
    this.myAdmins = admins
    this.adminOnly = adminOnly
    this.wickrUsers = wickrUsers
    this.wickrAPI = wickrAPI
    this.user = null
    this.testOnly = testOnly
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
    } = this.parseRawMsg({ rawMessage: this.rawMessage })

console.log("process.env.tokens: " + util.inspect(process.env.tokens, {depth: null}))

    // OG MSG DATA
    this.time = time || null
    this.botName = JSON.parse(process.env.tokens).WICKRIO_BOT_NAME.value || null
    this.messageID = messageID || null
    this.users = users || null
    this.ttl = ttl || null
    this.bor = bor || false
    this.control = control || null
    this.msgTS = msgTS || null
    this.receiver = receiver || null
    this.filepath = file || null
    this.file = file ? fs.readFileSync(file) : null
    this.filename = filename || null
    this.message = message || null
    this.command = command ? command.toLowerCase().trim() : null
    this.argument = argument ? argument.toLowerCase().trim() : null
    this.vGroupID = vGroupID
    this.convoType = convoType
    this.msgType = msgType
    this.userEmail = userEmail
    this.isAdmin = isAdmin || false
    this.latitude = latitude || null
    this.longitude = longitude || null
    this.location =
      latitude || longitude
        ? 'http://www.google.com/maps/place/' +
          this.latitude +
          ',' +
          this.longitude
        : ''
    this.isVoiceMemo = isVoiceMemo || false
    this.voiceMemoDuration = voiceMemoDuration || null

    // let personalVGroupID = ''
    // if (convoType === 'personal') personalVGroupID = vGroupID

    // create a directory for the user using their email as the name
    // Check if a user exists in the database
    this.user = this.getOrCreateUser({ userEmail }) // Look up user by their wickr email
  }

  getMessageData() {
    return {
      time: this.time,
      botName: this.botName,
      messageID: this.messageID,
      users: this.users,
      ttl: this.ttl,
      bor: this.bor,
      control: this.control,
      msgTS: this.msgTS,
      receiver: this.receiver,
      filepath: this.filepath,
      file: this.file,
      filename: this.filename,
      message: this.message,
      command: this.command,
      argument: this.argument,
      vGroupID: this.vGroupID,
      convoType: this.convoType,
      msgType: this.msgType,
      user: this.user,
      userEmail: this.userEmail,
      isAdmin: this.isAdmin,
      latitude: this.latitude,
      longitude: this.longitude,
      location: this.location,
      isVoiceMemo: this.isVoiceMemo,
      voiceMemoDuration: this.voiceMemoDuration,
    }
  }

  parseRawMsg({ rawMessage }) {
    const jsonmsg = JSON.parse(rawMessage)

    const {
      message_id: messageID,
      message,
      edit,
      control,
      file,
      msg_ts: msgTS,
      time,
      receiver,
      sender: userEmail,
      ttl,
      location,
      vgroupid: vGroupID,
      msgtype: rawMsgType,
      call,
      users,
      keyverify,
    } = jsonmsg

    let { bor } = jsonmsg
    if (!bor) bor = 0

    // const msgtype = message.msgtype
    // const vGroupID = message.vgroupid
    let convoType = null
    let command = null
    let argument = null
    // This doesn't capture @ mentions

    if (message) {
      console.log('got message')
      const parsedData = message.trim().match(/^(\/[a-zA-Z]+)([\s\S]*)$/)

      if (parsedData !== null) {
        command = parsedData[1]
      console.log('command='+command)
        if (parsedData[2] !== '') {
          argument = parsedData[2].trim().replace(/^@[^ ]+ /, "").trim()
        }
      }
    } else {
      console.log('NO message')
    }

    // Get the admin, if this is an admin user
    const localWickrAdmins = this.myAdmins
    let admin
    if (localWickrAdmins) {
      admin = localWickrAdmins.getAdmin(userEmail)
    }

    // If ONLY admins can receive and handle messages and this is
    // not an admin, then drop the message
    if (this.adminOnly === true && admin === undefined) {
      console.log('Dropping message from non-admin user!')
      return {}
    }

    // Set the isAdmin flag
    const isAdmin = admin !== undefined

    // Determine the convo type (1to1, group, or room)
    if (vGroupID.charAt(0) === 'S') convoType = 'room'
    else if (vGroupID.charAt(0) === 'G') convoType = 'groupconvo'
    else convoType = 'personal'

    let parsedMessage = {
      messageID,
      message,
      msgTS,
      time,
      receiver,
      users,
      vGroupID,
      user: this.user,
      userEmail,
      convoType,
      isAdmin,
      ttl,
      bor,
    }
    if (rawMsgType === 6000) {     // file transfer msgtype
      if (file.isvoicememo) {
        parsedMessage = {
          ...parsedMessage,
          file: file.localfilename,
          filename: file.filename,
          isVoiceMemo: true,
          voiceMemoDuration: file.voicememoduration,
          msgType: 'file',
        }
        return parsedMessage
      } else {
        parsedMessage = {
          ...parsedMessage,
          file: file.localfilename,
          filename: file.filename,
          isVoiceMemo: false,
          msgType: 'file',
        }
      }
      return parsedMessage
    } else if (rawMsgType === 8000) {    // location msgtype
      parsedMessage = {
        ...parsedMessage,
        latitude: location.latitude,
        longitude: location.longitude,
        msgType: 'location',
      }
      return parsedMessage
    } else if (call) {
      parsedMessage = {
        ...parsedMessage,
        status: call.status,
        call,
        msgType: 'call',
      }
      return parsedMessage
    } else if (rawMsgType === 3000) {   // verification msgtype
      parsedMessage = {
        ...parsedMessage,
        control,
        msgType: 'keyverify',
      }
      return parsedMessage
    } else if (rawMsgType >= 4000 && rawMsgType <= 5000) {    // control messages
      parsedMessage = {
        ...parsedMessage,
        msgType: 'control',
      }
      return parsedMessage
    } else if (rawMsgType === 9000) {   // edit message
      parsedMessage = {
        ...parsedMessage,
        msgType: 'edit',
      }
      return parsedMessage
    } else if (message === undefined) {
      return {}
    }

    // If this is an admin then process any admin commands
    // if adminDMonly is false

    if (isAdmin) {
      if (!this.adminDMonly || convoType === 'personal') {
        if(localWickrAdmins.processAdminCommand(
          userEmail,
          vGroupID,
          command,
          argument
        )){
          // If this admin command was processed then return the msgtype as 'admin'
          parsedMessage = {
            ...parsedMessage,
            msgType: 'admin',
          }
          return parsedMessage
        }
      }
    }

    parsedMessage = {
      ...parsedMessage,
      command,
      argument,
    }

console.log('returning parsedMessage: ' + JSON.stringify(parsedMessage, null, 4))
    return parsedMessage
  }

  // TODO why use getters and setters here??

  getAdminList(){
    return this.myAdmins
  }

  getMessage() {
    return this.message
  }

  // handle history stuff
  getDates() {
    const fromDate = this.fromDate
    const toDate = this.toDate
    return { fromDate, toDate }
  }

  getArguments() {
    return this.arguments
  }

  getUserEmail() {
    return this.userEmail
  }

  getVGroupID() {
    return this.vGroupID
  }

  getCommand() {
    return this.command
  }

  getUserCurrentStateConstructor() {
    return this.user.currentState
  }

  getUserCurrentCmdInfoConstructor() {
    return this.user.currentCmdInfo
  }

  getFile() {
    return this.file
  }

  getFilePath() {
    return this.filepath
  }

  getFilename() {
    return this.filename
  }

  getUser() {
    return this.user
  }

  affirmativeReply() {
    return (
      this.message.toLowerCase() === 'yes' || this.message.toLowerCase() === 'y'
    )
  }

  negativeReply() {
    return (
      this.message.toLowerCase() === 'no' || this.message.toLowerCase() === 'n'
    )
  }

  isInt() {
    if (!Number.isInteger(+this.message)) {
      return false
    }
    return true
  }

  /*
   * User functions
   */
  addUserToDB(wickrUser) {
    this.wickrUsers.push(wickrUser)
    this.saveData()
    this.user = wickrUser
    console.log('New Wickr user added to database.')
    return wickrUser
  }

  setUserCurrentState({ currentState }) {
    let userWithState
    // this.wickrUsers.find(user => {
    //   return user.userEmail === this.userEmail
    // })
    this.wickrUsers = this.wickrUsers.map(user => {
      userWithState = {
        ...user,
        currentState,
      }
      this.user = userWithState
      if (user.userEmail === this.userEmail) return userWithState
      else return user
    })
    this.saveData()
    console.log('Wickr state added to db.')
    return userWithState
  }

  getUserCurrentState({ userEmail }) {
    const userInDB = this.getUserFromDB({ userEmail })
    return userInDB.currentState
  }

  matchUserCommandCurrentState({ commandState }) {
    const { userEmail } = this
    const userCurrentState = this.getUserCurrentState({
      userEmail,
    })

    if (userCurrentState === commandState) {
      return true
    }
    return false
  }

  setUserCurrentCmdInfo({ currentCmdInfo }) {
    let userWithState
    this.wickrUsers = this.wickrUsers.map(user => {
      userWithState = {
        ...user,
        currentCmdInfo,
      }
      this.user = userWithState
      if (user.userEmail === this.userEmail) return userWithState
      else return user
    })
    this.saveData()
    console.log('Wickr cmdInfo added to db.')
    return userWithState
  }

  getUserCurrentCmdInfo() {
    const { userEmail } = this
    const userInDB = this.getUserFromDB({ userEmail })
    return userInDB.currentCmdInfo
  }

  getOrCreateUser({ userEmail }) {
    // on every every message,
    // see if there is a submission in the bot for the user,
    // if there is, return user
    // if not,
    // get message,
    // userEmail
    // vGroupID,
    // personalVGroupID, // what personalvGroupID
    // command,
    // argument from current message
    // and add the use to to db and return the user

    const {
      message,
      vGroupID,
      personalVGroupID, // what personalvGroupID
      command,
      argument,
    } = this

    let user = this.getUserFromDB({ userEmail }) // Look up user by their wickr email
    if (user === undefined) {
      console.log('creating new user')
      const wickrUser = new WickrUser(userEmail, {
        message,
        vGroupID,
        personalVGroupID, // what personalvGroupID
        command,
        argument,
        currentState: null, // undefined
        currentCmdInfo: null, // undefined
      })
      user = this.addUserToDB(wickrUser) // Add a new user to the database
    }

    return user
  }

  getUserFromDB({ userEmail }) {
    const found = this.wickrUsers.find(function (user) {
      return user.userEmail === userEmail
    })
    return found
  }

  getUsersFromDB() {
    return this.wickrUsers
  }

  deleteUserFromDB(userEmail) {
    const found = this.wickrUsers.find(function (user) {
      return user.userEmail === userEmail
    })
    const index = this.wickrUsers.indexOf(found)
    this.wickrUsers.splice(index, 1)
    return found
  }

  async saveData() {
    try {
      // If this is a test then do not save data
      if (this.testOnly) {
        console.log('saveData: test, not saving!')
        return
      }

      console.log('Encrypting user database...')
      // console.log({ storingTheseUsers: this.wickrUsers })
      if (this.wickrUsers.length === 0) {
        return
      }
      let serialusers
      if (encryptorDefined === true) {
        // Encrypt
        serialusers = encryptor.encrypt(this.wickrUsers)
      } else {
        serialusers = JSON.stringify(this.wickrUsers)
      }
      const encrypted = this.wickrAPI.cmdEncryptString(serialusers)
      fs.writeFileSync('users.txt', encrypted, 'utf-8')
      console.log('User database saved to file!')
      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }

  // function replyWithButtons(message) {
  //   const button1 = {
  //     type: 'message',
  //     text: 'Yes',
  //     message: 'yes',
  //   }
  //   const button2 = {
  //     type: 'message',
  //     text: 'No',
  //     message: 'no',
  //   }
  //   const buttons = [button1, button2]
}

module.exports = MessageService
