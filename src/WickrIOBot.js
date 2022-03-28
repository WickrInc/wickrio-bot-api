const WickrIOAPI = require('wickrio_addon')
const WickrIOConfigure = require('./WickrIOConfigure')
const WickrUser = require('./WickrUser')
const WickrAdmin = require('./WickrAdmin')
const MessageService = require('./services/message')
const fs = require('fs')
const APIService = require('./services/api')
const path = require('path')
const util = require('util')
const logger = require('./WickrLogger')

let encryptor
let encryptorDefined = false

class WickrIOBot {
  constructor() {
    this.wickrUsers = [] // wickrusers populate on load data which happens on start, or on addUser()
    this.listenFlag = false
    this.adminOnly = false
    this.myAdmins = null // admins dont populate until start
    console.log = function () {
      logger.info(util.format.apply(null, arguments))
    }
    console.error = function () {
      logger.error(util.format.apply(null, arguments))
    }
  }

  messageService({ rawMessage, adminDMonly = false, testOnly = false }) {
    return new MessageService({
      rawMessage,
      admins: this.myAdmins,
      adminOnly: this.adminOnly,
      wickrUsers: this.wickrUsers,
      adminDMonly,
      wickrAPI: WickrIOAPI,
      testOnly,
    })
  }

  apiService() {
    return new APIService({
      WickrIOAPI,
    })
  }

  async provision({
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
  }) {
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
   * Return the WickrIO addon API
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
    logger.info('starting bot')
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
        } while (connected != true)

        console.log('isConnected: finally we are connected')

        let cState
        do {
          cState = WickrIOAPI.getClientState()
          console.log('isConnected: client state is', cState)
          if (cState != 'RUNNING') sleep(5000)
        } while (cState != 'RUNNING')
        resolve(connected)
      })
    const processAdminUsers = async connected => {
      /*
       * Process the admin users
       */
      const processes = JSON.parse(fs.readFileSync('processes.json'))
      if (process.env.tokens !== undefined) {
        const tokens = JSON.parse(process.env.tokens)
        let administrators
        if (
          (!tokens.ADMINISTRATORS_CHOICE ||
            (tokens.ADMINISTRATORS_CHOICE &&
              tokens.ADMINISTRATORS_CHOICE.value === 'yes')) &&
          tokens.ADMINISTRATORS &&
          tokens.ADMINISTRATORS.value
        ) {
          if (tokens.ADMINISTRATORS.encrypted) {
            administrators = WickrIOAPI.cmdDecryptString(
              tokens.ADMINISTRATORS.value
            )
          } else {
            administrators = tokens.ADMINISTRATORS.value
          }
          administrators = administrators.split(/[ ,]+/)

          // Make sure there are no white spaces on the whitelisted users
          for (let i = 0; i < administrators.length; i++) {
            const administrator = administrators[i].trim()
            const admin = myLocalAdmins.addAdmin(administrator)
          }
        }
      }

      const settings = JSON.parse(fs.readFileSync('package.json'))
      // Check if bot supports a user database
      if (!settings.database) {
        return true
      }
      if (connected) {
        const encrypted = await this.encryptEnv()
        const loaded = await this.loadData()
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
   * This start function is specific to the testing scripts
   */
  async startForTesting(client_username) {
    const myLocalAdmins = new WickrAdmin()
    console.log('test starting bot')
    this.myAdmins = myLocalAdmins
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
      console.error(err)
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
        const saved = await this.saveData()
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
              console.error(error)
            })
        })
        .catch(error => {
          console.error(error)
        })
    } catch (err) {
      console.error(err)
      return false
    }
  }

  /*
   * WickrIO API functions used: cmdEncryptString()
   */
  async encryptEnv() {
    if (process.env.tokens === undefined) {
      return true
    }
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
      const ps = fs.writeFileSync(
        './processes.json',
        JSON.stringify(processes, null, 2)
      )
      console.log('Bot tokens encrypted successfully!')
      return true
    } catch (err) {
      console.error('Unable to encrypt Bot Tokens:', err)
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
      console.error(err)
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
      const saved = fs.writeFileSync('users.txt', encrypted, 'utf-8')
      console.log('User database saved to file!')
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }

  /*
   * Get the transmit queue information. Returns an object that contains
   * the following formated information:
   * {
   *      estimated_time: 9999,                 // estimated time in seconds
   *      count: 99999,                         // total number of messages left
   *      tx_queue: [                           // array of pending transmits
   *          {
   *              message_id: '<messageID>',    // Associated message ID
   *              count: 9999,                  // number of transmits
   *              created: '<date>',            // date the broadcast was created
   *              sender: '<sender>',           // sender of the message
   *              estimated_time: 9999,         // estimated time in seconds
   *          }
   *      ]
   * }
   */
  getTransmitQueueInfo() {
    try {
      const txQInfo = WickrIOAPI.cmdGetTransmitQueueInfo()
      console.log('Transmit Queue Info:' + txQInfo)
      if (txQInfo) {
        return JSON.parse(txQInfo)
      } else {
        return {}
      }
    } catch (err) {
      console.error(err)
      return {}
    }
  }

  /*
   * Return the versions of all associated software component
   */
  getVersions(packageFile) {
    let reply = '*Versions*'

    /*
     * Add the Docker tag
     */
    const dockerInfoFile = '/usr/lib/wickr/docker_info.json'
    if (fs.existsSync(dockerInfoFile)) {
      const dockerinfo = JSON.parse(fs.readFileSync(dockerInfoFile, 'utf-8'))
      const imagetag = dockerinfo.tag

      if (imagetag) {
        reply += `\nDocker Tag: ${imagetag}`
      }
    }

    /*
     * Get the bot client's version information
     */
    let clientVersion = ''
    const clientInfoJSON = WickrIOAPI.cmdGetClientInfo()
    if (clientInfoJSON) {
      const clientInfo = JSON.parse(clientInfoJSON)
      if (clientInfo.version) {
        clientVersion = clientInfo.version
      }
    }
    if (clientVersion !== '') reply += `\nBot Client: ${clientVersion}`

    /*
     * Add the Integration's version
     */
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf-8'))
      if (packageJson.version) reply += `\nIntegration: ${packageJson.version}`
    } catch (err) {
      console.error('getVersions: error getting: ' + packageFile + '\n' + err)
    }

    /*
     * Add the WickrIO Addon's version
     */
    const addonFile = path.join(
      process.cwd(),
      'node_modules/wickrio_addon/package.json'
    )
    try {
      const addonJson = JSON.parse(fs.readFileSync(addonFile, 'utf-8'))
      if (addonJson.version) reply += `\nWickrIO Addon: ${addonJson.version}`
    } catch (err) {
      console.error('getVersions: error getting: ' + addonFile + '\n' + err)
    }

    /*
     * Add the WickrIO bot API's version
     */
    const botApiFile = path.join(
      process.cwd(),
      'node_modules/wickrio-bot-api/package.json'
    )
    try {
      const botApiJson = JSON.parse(fs.readFileSync(botApiFile, 'utf-8'))
      if (botApiJson.version) reply += `\nWickrIO API: ${botApiJson.version}`
    } catch (err) {
      console.error('getVersions: error getting: ' + botApiFile + '\n' + err)
    }

    return reply
  }

  /*
   * This function parses an incoming message
   */
  parseMessage(message) {
    let tokens
    if (process.env.tokens !== undefined) {
      tokens = JSON.parse(process.env.tokens)
    } else {
      tokens = {}
    }
    message = JSON.parse(message)
    const { edit, control, msg_ts, time, receiver, sender, ttl, bor } = message
    const msgtype = message.msgtype
    const vGroupID = message.vgroupid
    let convoType = ''

    // Get the admin, if this is an admin user
    const localWickrAdmins = this.myAdmins
    const admin = localWickrAdmins.getAdmin(sender)

    // If ONLY admins can receive and handle messages and this is
    // not an admin, then drop the message
    if (this.adminOnly === true && admin === undefined) {
      console.error('Dropping message from non-admin user!')
      return
    }

    // Set the isAdmin flag
    const isAdmin = admin !== undefined

    // Determine the convo type (1to1, group, or room)
    if (vGroupID.charAt(0) === 'S') convoType = 'room'
    else if (vGroupID.charAt(0) === 'G') convoType = 'groupconvo'
    else convoType = 'personal'

    if (message.file) {
      let isVoiceMemo = false
      if (message.file.isvoicememo) {
        isVoiceMemo = true
        const voiceMemoDuration = message.file.voicememoduration
        var parsedObj = {
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
        var parsedObj = {
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
      var parsedObj = {
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
      var parsedObj = {
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
      var parsedObj = {
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
      var parsedObj = {
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
      var parsedObj = {
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
    const parsedData = request.trim().match(/^(\/[a-zA-Z]+)([\s\S]*)$/)
    if (parsedData !== null) {
      command = parsedData[1]
      if (parsedData[2] !== '') {
        argument = parsedData[2]
          .trim()
          .replace(/^@[^ ]+ /, '')
          .trim()
      }
    }

    // If this is an admin then process any admin commands
    if (
      tokens.ADMINISTRATORS_CHOICE &&
      tokens.ADMINISTRATORS_CHOICE.value === 'yes' &&
      admin !== undefined
    ) {
      localWickrAdmins.processAdminCommand(sender, vGroupID, command, argument)
    }

    var parsedObj = {
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
    const parsedData = message.trim().match(/^(\/[a-zA-Z]+)([\s\S]*)$/)
    if (parsedData !== null) {
      command = parsedData[1]
      if (parsedData[2] !== '') {
        argument = parsedData[2]
          .trim()
          .replace(/^@[^ ]+ /, '')
          .trim()
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
    const saved = this.saveData()
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

  /*
   * Admin functions
   */
  getAdmins() {
    const localWickrAdmins = this.myAdmins
    return localWickrAdmins.getAdmins()
  }

  /*
   * copy processes.json tokens to process.env
   */
  processesJsonToProcessEnv() {
    console.log('Copying processes.json tokens to process.env')
    // Read in the processes.json file
    const processesJsonFile = path.join(process.cwd(), 'processes.json')
    if (!fs.existsSync(processesJsonFile)) {
      console.error(processesJsonFile + ' does not exist!')
      return false
    }
    const processesJson = fs.readFileSync(processesJsonFile)
    // console.log('processes.json=' + processesJson)
    const processesJsonObject = JSON.parse(processesJson)

    process.env.tokens = JSON.stringify(processesJsonObject.apps[0].env.tokens)

    // console.log('end process.env=' + JSON.stringify(process.env))
    // console.log('end process.env.tokens=' + process.env.tokens)
    return true
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = {
  WickrIOBot,
  WickrUser,
  WickrIOConfigure,
  logger,
}
