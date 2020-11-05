import * as WickrIOAPI from 'wickrio_addon'
import { WickrAdmin } from './index'
import { MessageService, APIService } from '../services'
import fs from 'fs'
let encryptor
let encryptorDefined = false

class BotAPI {
  constructor() {
    this.wickrUsers = [] // wickrusers populate on load data which happens on start, or on addUser()
    this.listenFlag = false
    this.adminOnly = false
    this.myAdmins = null // admins dont populate until start
    // this.runHandlers()
  }

  exitHandler = async (options, err) => {
    try {
      this.close()
      if (err || options.exit) {
        console.error('Exit reason:', err)
        process.exit()
      } else if (options.pid) {
        process.kill(process.pid)
      }
    } catch (err) {
      console.error(err)
    }
  }

  runHandlers = () => {
    // STANDARDIZE BELOW -----------

    process.stdin.resume() // so the program will not close instantly

    process.stdin.resume() // so the program will not close instantly

    // catches ctrl+c and stop.sh events
    process.on('SIGINT', this.exitHandler.bind(null, { exit: true }))

    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', this.exitHandler.bind(null, { pid: true }))
    process.on('SIGUSR2', this.exitHandler.bind(null, { pid: true }))

    // TODO clear these values!
    // TODO make these user variables??

    // catches uncaught exceptions
    // TODO make this more robust of a catch

    process.on('uncaughtException', this.exitHandler.bind(null, { exit: true }))
    // STANDARDIZE ABOVE -----------
  }

  messageService({ rawMessage, adminDMonly = false }) {
    return new MessageService({
      rawMessage,
      admins: this.myAdmins,
      adminOnly: this.adminOnly,
      wickrUsers: this.wickrUsers,
      adminDMonly,
      wickrAPI: WickrIOAPI,
    })
  }

  apiService() {
    return new APIService({
      WickrIOAPI,
    })
  }

  provision = async ({
    status,
    setAdminOnly = false,
    attachLifeMinutes = '0',
    doreceive = 'true',
    duration = '0',
    readreceipt = 'true',
    cleardb = 'true',
    contactbackup = 'false',
    convobackup = 'false',
    verifyusers = { encryption: false, value: 'automatic' },
  }) => {
    if (setAdminOnly === true || setAdminOnly === 'true') {
      setAdminOnly = 'true'
    }

    if (!status) {
      this.exitHandler(null, {
        exit: true,
        reason: 'Client not able to start',
      })
    }
    this.setAdminOnly(setAdminOnly)

    // set the verification mode to true
    // let verifyUsersMode
    // const VERIFY_USERS = JSON.parse(process.env.tokens).VERIFY_USERS

    if (verifyusers.encrypted) {
      verifyusers.value = WickrIOAPI.cmdDecryptString(verifyusers.value)
    }
    // else {
    //   verifyUsersMode = VERIFY_USERS.value
    // }

    this.setVerificationMode(verifyusers.value)

    WickrIOAPI.cmdSetControl('attachLifeMinutes', attachLifeMinutes.toString())
    WickrIOAPI.cmdSetControl('doreceive', doreceive.toString())
    WickrIOAPI.cmdSetControl('duration', duration.toString())
    WickrIOAPI.cmdSetControl('readreceipt', readreceipt.toString())
    WickrIOAPI.cmdSetControl('cleardb', cleardb.toString()) // ?
    WickrIOAPI.cmdSetControl('contactbackup', contactbackup.toString()) // ?
    WickrIOAPI.cmdSetControl('convobackup', convobackup.toString()) // ?
  }

  /*
   * Return the version of the addon that the bot-api is using
   */
  getWickrIOAddon() {
    return WickrIOAPI
  }

  /*
   * Set this client to handle only commands from admin users
   */
  setAdminOnly(setting) {
    this.adminOnly = setting
  }

  getAdminHelp(helpString) {
    return this.myAdmins.getHelp(helpString)
  }

  setVerificationMode(mode) {
    this.myAdmins.setVerifyMode(mode)
  }

  /*
   * WickrIO API functions used: clientInit() and isConnected()
   */
  async start(client_username) {
    const myLocalAdmins = new WickrAdmin()
    console.log('starting bot')
    this.myAdmins = myLocalAdmins

    const clientinitPromise = client_username =>
      new Promise((resolve, reject) => {
        const status = WickrIOAPI.clientInit(client_username)
        resolve(status)
      })
    const clientconnectionPromise = () =>
      new Promise((resolve, reject) => {
        console.log('Checking for client connectionn...')
        let connected = false
        do {
          connected = WickrIOAPI.isConnected(10)
          console.log('isConnected:', connected)
        } while (connected !== true)

        console.log('isConnected: finally we are connected')

        let cState
        do {
          cState = WickrIOAPI.getClientState()
          console.log('isConnected: client state is', cState)

          if (cState !== 'RUNNING') sleep(5000)
        } while (cState !== 'RUNNING')

        resolve(connected)
      })
    const processAdminUsers = async connected => {
      /*
       * Process the admin users
       */
      // const processes = JSON.parse(fs.readFileSync('processes.json'))
      const tokens = JSON.parse(process.env.tokens)
      let administrators
      if (tokens.ADMINISTRATORS && tokens.ADMINISTRATORS.value) {
        if (tokens.ADMINISTRATORS.encrypted) {
          administrators = WickrIOAPI.cmdDecryptString(
            tokens.ADMINISTRATORS.value
          )
        } else {
          administrators = tokens.ADMINISTRATORS.value
        }
        administrators = administrators.split(',')

        // Make sure there are no white spaces on the whitelisted users
        for (let i = 0; i < administrators.length; i++) {
          const administrator = administrators[i].trim()
          myLocalAdmins.addAdmin(administrator)
        }
      }

      const settings = JSON.parse(fs.readFileSync('package.json'))
      // Check if bot supports a user database
      if (!settings.database) {
        return true
      }
      if (connected) {
        await this.encryptEnv()
        await this.loadData()
        return true
      } else {
        console.log('not connected, not processing admin users')
        return false
      }
    }

    const client = await clientinitPromise(client_username)
    if (client) {
      console.log({ client })
      const connection = await clientconnectionPromise()
      console.log({ connection })
      if (connection) {
        return processAdminUsers(connection)
      }
    }
  }

  /*
   * WickrIO API functions used: cmdStartAsyncRecvMessages
   */
  async startListening(callback) {
    try {
      const ref = this
      return new Promise(function (resolve, reject) {
        const start = WickrIOAPI.cmdStartAsyncRecvMessages(callback)
        if (start === 'Success') resolve(start)
        else reject(start)
      })
        .then(function (start) {
          ref.listenFlag = true
          console.log('Bot message listener set successfully!')
          return true
        })
        .catch(error => {
          console.log('Bot message listener failed to set:', error)
          return false
        })
    } catch (err) {
      console.log(err)
    }
  }

  /*
   * WickrIO API functions used: closeClient() and cmdStopAsyncRecvMessages()
   */
  async close() {
    try {
      const ref = this
      const settings = JSON.parse(fs.readFileSync('package.json'))
      // Checks if bot supports a user database saving feature
      if (settings.database) {
        await this.saveData()
      }
      return new Promise(function (resolve, reject) {
        let stopMessaging = 'not needed'
        if (ref.listenFlag === true)
          stopMessaging = WickrIOAPI.cmdStopAsyncRecvMessages()
        resolve(stopMessaging)
      })
        .then(function (stopMessaging) {
          if (stopMessaging === 'Success') {
            console.log('Async message receiving stopped!')
          }
          console.log('Shutting bot down...')
          return new Promise(function (resolve, reject) {
            const closed = WickrIOAPI.closeClient()
            resolve(closed)
          })
            .then(function (closed) {
              console.log(closed)
              console.log('Bot shut down successfully!')
              return true
            })
            .catch(error => {
              console.log(error)
            })
        })
        .catch(error => {
          console.log(error)
        })
    } catch (err) {
      console.log(err)
      return false
    }
  }

  /*
   * WickrIO API functions used: cmdEncryptString()
   */
  async encryptEnv() {
    try {
      const processes = JSON.parse(fs.readFileSync('processes.json'))
      const tokens = JSON.parse(process.env.tokens)
      // Create an encryptor:
      let key

      // if the encryption choice value is there and is 'no' then return
      if (
        tokens.DATABASE_ENCRYPTION_CHOICE === undefined ||
        tokens.DATABASE_ENCRYPTION_CHOICE.value !== 'yes'
      ) {
        console.log('WARNING: Configurations are not encrypted')
        return true
      }

      if (tokens.DATABASE_ENCRYPTION_KEY.encrypted) {
        key = WickrIOAPI.cmdDecryptString(tokens.DATABASE_ENCRYPTION_KEY.value)
      } else {
        key = tokens.DATABASE_ENCRYPTION_KEY.value
      }

      if (key.length < 16) {
        console.log(
          'WARNING: ENCRYPTION_KEY value is too short, must be at least 16 characters long'
        )
        encryptorDefined = false
        return true
      }
      encryptor = require('simple-encryptor')(key)
      encryptorDefined = true
      for (const i in tokens) {
        if (i === 'BOT_USERNAME' || i === 'WICKRIO_BOT_NAME') continue
        if (!tokens[i].encrypted) {
          tokens[i].value = WickrIOAPI.cmdEncryptString(tokens[i].value)
          tokens[i].encrypted = true
        }
      }
      processes.apps[0].env.tokens = tokens
      fs.writeFileSync('./processes.json', JSON.stringify(processes, null, 2))
      console.log('Bot tokens encrypted successfully!')
      return true
    } catch (err) {
      console.log('Unable to encrypt Bot Tokens:', err)
      return false
    }
  }

  /*
   * Loads and decrypts the bot's user database
   * WickrIO API functions used: cmdDecryptString()
   */
  async loadData() {
    try {
      if (!fs.existsSync('users.txt')) {
        console.log('WARNING: users.txt does not exist!')
        return
      }

      const users = fs.readFileSync('users.txt', 'utf-8')
      if (users.length === 0 || !users || users === '') {
        return
      }
      console.log('Decrypting user database...')
      const ciphertext = WickrIOAPI.cmdDecryptString(users.toString())

      if (encryptorDefined === true) {
        // Decrypt
        const decryptedData = encryptor.decrypt(ciphertext)
        this.wickrUsers = decryptedData
      } else {
        this.wickrUsers = JSON.parse(ciphertext)
      }
    } catch (err) {
      console.log(err)
    }
  }

  /*
   * Decrypts and saves the bot's user database
   * WickrIO API functions used: cmdEncryptString()
   */
  async saveData() {
    try {
      console.log('Encrypting user database...')
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

      const encrypted = WickrIOAPI.cmdEncryptString(serialusers)
      fs.writeFileSync('users.txt', encrypted, 'utf-8')
      console.log('User database saved to file!')
      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }

  /*
   * This function parses an incoming message
   */
  parseMessage(message) {
    // const tokens = JSON.parse(process.env.tokens)
    message = JSON.parse(message)
    const { edit, control, msg_ts, time, receiver, sender, ttl, bor } = message
    // const msgtype = message.msgtype
    const vGroupID = message.vgroupid
    let convoType = ''

    // Get the admin, if this is an admin user
    const localWickrAdmins = this.myAdmins
    const admin = localWickrAdmins.getAdmin(sender)

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
    let parsedObj

    if (message.file) {
      let isVoiceMemo = false
      if (message.file.isvoicememo) {
        isVoiceMemo = true
        const voiceMemoDuration = message.file.voicememoduration
        parsedObj = {
          file: message.file.localfilename,
          filename: message.file.filename,
          vgroupid: vGroupID,
          control,
          msgTS: msg_ts,
          time,
          receiver,
          userEmail: sender,
          isVoiceMemo: isVoiceMemo,
          voiceMemoDuration: voiceMemoDuration,
          convotype: convoType,
          isAdmin: isAdmin,
          msgtype: 'file',
          ttl,
          bor,
        }
      } else {
        parsedObj = {
          file: message.file.localfilename,
          filename: message.file.filename,
          vgroupid: vGroupID,
          control,
          msgTS: msg_ts,
          time,
          receiver,
          userEmail: sender,
          isVoiceMemo: isVoiceMemo,
          convotype: convoType,
          isAdmin: isAdmin,
          msgtype: 'file',
          ttl,
          bor,
        }
      }
      return parsedObj
    } else if (message.location) {
      parsedObj = {
        latitude: message.location.latitude,
        longitude: message.location.longitude,
        vgroupid: vGroupID,
        control,
        msgTS: msg_ts,
        time,
        receiver,
        userEmail: sender,
        convotype: convoType,
        isAdmin: isAdmin,
        msgtype: 'location',
        ttl,
        bor,
      }
      return parsedObj
    } else if (message.call) {
      parsedObj = {
        status: message.call.status,
        vgroupid: vGroupID,
        call: message.call,
        msgTS: msg_ts,
        time,
        receiver,
        userEmail: sender,
        convotype: convoType,
        isAdmin: isAdmin,
        msgtype: 'call',
        ttl,
        bor,
      }
      return parsedObj
    } else if (message.keyverify) {
      parsedObj = {
        vgroupid: vGroupID,
        control,
        msgTS: msg_ts,
        time,
        receiver,
        userEmail: sender,
        convotype: convoType,
        isAdmin: isAdmin,
        msgtype: 'keyverify',
        ttl,
        bor,
      }
      return parsedObj
    } else if (message.control) {
      parsedObj = {
        vgroupid: vGroupID,
        control,
        msgTS: msg_ts,
        time,
        receiver,
        userEmail: sender,
        convotype: convoType,
        isAdmin: isAdmin,
        msgtype: 'edit',
        ttl,
        bor,
      }
      return parsedObj
    } else if (message.edit) {
      parsedObj = {
        vgroupid: vGroupID,
        edit,
        msgTS: msg_ts,
        time,
        receiver,
        userEmail: sender,
        convotype: convoType,
        isAdmin: isAdmin,
        msgtype: 'edit',
        ttl,
        bor,
      }
      return parsedObj
    } else if (message.message === undefined) {
      return
    }

    const request = message.message
    let command = ''
    let argument = ''
    // This doesn't capture @ mentions
    const parsedData = request.match(/(\/[a-zA-Z]+)([\s\S]*)$/)
    if (parsedData !== null) {
      command = parsedData[1]
      if (parsedData[2] !== '') {
        argument = parsedData[2]
        argument = argument.trim()
      }
    }

    // If this is an admin then process any admin commands
    if (admin !== undefined) {
      localWickrAdmins.processAdminCommand(sender, vGroupID, command, argument)
    }

    parsedObj = {
      message: request,
      command: command,
      msgTS: msg_ts,
      time,
      receiver,
      argument: argument,
      vgroupid: vGroupID,
      userEmail: sender,
      convotype: convoType,
      isAdmin: isAdmin,
      msgtype: 'message',
      ttl,
      bor,
    }

    return parsedObj
  }

  getMessage({ rawMessage }) {
    console.log({ rawMessage })
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
      // msgtype: msgType,
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

  /*
   * User functions
   */
  addUser(wickrUser) {
    this.wickrUsers.push(wickrUser)
    this.saveData()
    console.log('New Wickr user added to database.')
    return wickrUser
  }

  getUser(userEmail) {
    const found = this.wickrUsers.find(function (user) {
      return user.userEmail === userEmail
    })
    return found
  }

  getUsers() {
    return this.wickrUsers
  }

  deleteUser(userEmail) {
    const found = this.wickrUsers.find(function (user) {
      return user.userEmail === userEmail
    })
    const index = this.wickrUsers.indexOf(found)
    this.wickrUsers.splice(index, 1)
    return found
  }
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default BotAPI
