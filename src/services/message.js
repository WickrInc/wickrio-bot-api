const fs = require('fs')
const WickrAdmin = require('../WickrAdmin')

class MessageService {
  constructor({ rawMessage, admins, adminOnly }) {
    this.myAdmins = admins
    this.adminOnly = adminOnly

    let {
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
    } = this.parseRawMsg({ rawMessage })

    // let historyFileType = null
    // let fromDate = null
    // let toDate = null

    // if (argument === "" || argument === undefined) {
    // 	argument = null
    // } else {
    // 	if (argument.trim().includes("csv", "txt")) {
    // 		historyFileType = argument.trim().slice(0, 3)
    // 		argument = argument.trim().slice(3)
    // 	}
    // 	let tryFromDate
    // 	if (argument.trim().includes(" to ")) {
    // 		argument = argument.split("to")
    // 		tryFromDate = new Date(argument[0].trim())
    // 		const tryToDate = new Date(argument[1].trim())
    // 		toDate = !isNaN(Date.parse(tryToDate)) ? tryToDate : null
    // 		if (toDate === null)
    // 			console.log(
    // 				"the second date is not being read correctly, try a different format"
    // 			)
    // 	} else {
    // 		tryFromDate = new Date(argument.trim())
    // 	}
    // 	fromDate = !isNaN(Date.parse(tryFromDate)) ? tryFromDate : null
    // 	if (fromDate === null)
    // 		console.log(
    // 			"the first date is not being read correctly, try a different format"
    // 		)
    // }
    // this.historyFileType = historyFileType
    // this.fromDate = fromDate
    // this.toDate = toDate
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
    this.command = command.toLowerCase().trim() || null
    this.argument = argument || null
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
  }
  getMessageData() {
    return this
  }

  parseRawMsg({ rawMessage }) {
    // console.log({ rawMessage })
    // const tokens = JSON.parse(process.env.tokens)
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
      msgtype: msgType,
      call,
      users,
      keyverify,
    } = jsonmsg
    let { bor } = jsonmsg
    if (!bor) bor = 0

    // const msgtype = message.msgtype
    // const vGroupID = message.vgroupid
    let convoType = ''

    // Get the admin, if this is an admin user
    const localWickrAdmins = this.myAdmins
    const admin = localWickrAdmins.getAdmin(userEmail)
    // console.log("local")
    // console.log(this.myAdmins)
    // console.log(localWickrAdmins)
    // If ONLY admins can receive and handle messages and this is
    // not an admin, then drop the message
    if (this.adminOnly === true && admin === undefined) {
      console.log('Dropping message from non-admin user!')
      return
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
      userEmail,
      convoType,
      isAdmin,
      ttl,
      bor,
    }
    if (file) {
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
    } else if (location) {
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
    } else if (keyverify) {
      parsedMessage = {
        ...parsedMessage,
        control,
        msgType: 'keyverify',
      }
      return parsedMessage
    } else if (control) {
      if (control.isrecall) {
        parsedMessage = {
          ...parsedMessage,
          msgType: 'delete',
        }
      } else {
        parsedMessage = {
          ...parsedMessage,
          control,
          msgType: 'edit',
        }
      }
      return parsedMessage
    } else if (edit) {
      parsedMessage = {
        ...parsedMessage,
        msgType: 'edit',
      }
      return parsedMessage
    } else if (message === undefined) {
      return
    }

    let command = ''
    let argument = ''
    // This doesn't capture @ mentions
    const parsedData = message.match(/(\/[a-zA-Z]+)([\s\S]*)$/)
    if (parsedData !== null) {
      command = parsedData[1]
      if (parsedData[2] !== '') {
        argument = parsedData[2]
        argument = argument.trim()
      }
    }

    // If this is an admin then process any admin commands
    if (admin !== undefined) {
      localWickrAdmins.processAdminCommand(
        userEmail,
        vGroupID,
        command,
        argument
      )
    }

    parsedMessage = {
      ...parsedMessage,
      command,
      argument,
    }

    return parsedMessage
  }

  requestedFileType() {
    return this.historyFileType
  }

  // TODO why use getters and setters here??
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

  getCurrentState() {
    return this.currentState
  }

  getFile() {
    return this.file
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
