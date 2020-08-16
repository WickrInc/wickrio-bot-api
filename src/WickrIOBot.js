const WickrIOAPI = require("wickrio_addon")
const WickrIOConfigure = require("./WickrIOConfigure")
const WickrUser = require("./WickrUser")
const WickrAdmin = require("./WickrAdmin")
var fs = require("fs")
var encryptor
var encryptorDefined = false

class WickrIOBot {
	constructor() {
		this.wickrUsers = []
		this.myAdmins
		this.listenFlag = false
		this.adminOnly = false
		this.WickrIOAPI = WickrIOAPI
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
		var myLocalAdmins = new WickrAdmin()
		console.log("stating bot")
		this.myAdmins = myLocalAdmins

		const clientinitPromise = (client_username) =>
			new Promise(async (resolve, reject) => {
				console.log({ client_username })
				var status = WickrIOAPI.clientInit(client_username)
				console.log({ "clientInit status inside promise": status })
				resolve(status)
			})
		const clientconnectionPromise = () =>
			new Promise(async (resolve, reject) => {
				console.log("Checking for client connectionn...")
				var connected = false
				do {
					connected = WickrIOAPI.isConnected(10)
					console.log("isConnected:", connected)
				} while (connected != true)

				console.log("isConnected: finally we are connected")

				var cState
				do {
					cState = WickrIOAPI.getClientState()
					console.log("isConnected: client state is", cState)
					if (cState != "RUNNING") await sleep(5000)
				} while (cState != "RUNNING")
				resolve(connected)
			})
		const processAdminUsers = async (connected) => {
			/*
			 * Process the admin users
			 */
			var processes = JSON.parse(fs.readFileSync("processes.json"))
			var tokens = JSON.parse(process.env.tokens)
			var administrators
			if (tokens.ADMINISTRATORS && tokens.ADMINISTRATORS.value) {
				if (tokens.ADMINISTRATORS.encrypted) {
					administrators = WickrIOAPI.cmdDecryptString(
						tokens.ADMINISTRATORS.value
					)
				} else {
					administrators = tokens.ADMINISTRATORS.value
				}
				administrators = administrators.split(",")

				// Make sure there are no white spaces on the whitelisted users
				for (var i = 0; i < administrators.length; i++) {
					var administrator = administrators[i].trim()
					var admin = myLocalAdmins.addAdmin(administrator)
				}
			}

			var settings = JSON.parse(fs.readFileSync("package.json"))
			//Check if bot supports a user database
			if (!settings.database) {
				return true
			}
			if (connected) {
				var encrypted = await this.encryptEnv()
				var loaded = await this.loadData()
				return true
			} else {
				console.log("not connected, not processing admin users")
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
			var ref = this
			return new Promise(function (resolve, reject) {
				var start = WickrIOAPI.cmdStartAsyncRecvMessages(callback)
				if (start === "Success") resolve(start)
				else reject(start)
			})
				.then(function (start) {
					ref.listenFlag = true
					console.log("Bot message listener set successfully!")
					return true
				})
				.catch((error) => {
					console.log("Bot message listener failed to set:", error)
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
			var ref = this
			var settings = JSON.parse(fs.readFileSync("package.json"))
			//Checks if bot supports a user database saving feature
			if (settings.database) {
				var saved = await this.saveData()
			}
			return new Promise(function (resolve, reject) {
				var stopMessaging = "not needed"
				if (ref.listenFlag === true)
					stopMessaging = WickrIOAPI.cmdStopAsyncRecvMessages()
				resolve(stopMessaging)
			})
				.then(function (stopMessaging) {
					if (stopMessaging === "Success") {
						console.log("Async message receiving stopped!")
					}
					console.log("Shutting bot down...")
					return new Promise(function (resolve, reject) {
						var closed = WickrIOAPI.closeClient()
						resolve(closed)
					})
						.then(function (closed) {
							console.log(closed)
							console.log("Bot shut down successfully!")
							return true
						})
						.catch((error) => {
							console.log(error)
						})
				})
				.catch((error) => {
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
			var processes = JSON.parse(fs.readFileSync("processes.json"))
			var tokens = JSON.parse(process.env.tokens)
			//Create an encryptor:
			var key

			// if the encryption choice value is there and is 'no' then return
			if (
				tokens.DATABASE_ENCRYPTION_CHOICE === undefined ||
				tokens.DATABASE_ENCRYPTION_CHOICE.value !== "yes"
			) {
				console.log("WARNING: Configurations are not encrypted")
				return true
			}

			if (tokens.DATABASE_ENCRYPTION_KEY.encrypted) {
				key = WickrIOAPI.cmdDecryptString(tokens.DATABASE_ENCRYPTION_KEY.value)
			} else {
				key = tokens.DATABASE_ENCRYPTION_KEY.value
			}

			if (key.length < 16) {
				console.log(
					"WARNING: ENCRYPTION_KEY value is too short, must be at least 16 characters long"
				)
				encryptorDefined = false
				return true
			}
			encryptor = require("simple-encryptor")(key)
			encryptorDefined = true
			for (var i in tokens) {
				if (i === "BOT_USERNAME" || i === "WICKRIO_BOT_NAME") continue
				if (!tokens[i].encrypted) {
					tokens[i].value = WickrIOAPI.cmdEncryptString(tokens[i].value)
					tokens[i].encrypted = true
				}
			}
			processes.apps[0].env.tokens = tokens
			var ps = fs.writeFileSync(
				"./processes.json",
				JSON.stringify(processes, null, 2)
			)
			console.log("Bot tokens encrypted successfully!")
			return true
		} catch (err) {
			console.log("Unable to encrypt Bot Tokens:", err)
			return false
		}
	}

	/*
	 * Loads and decrypts the bot's user database
	 * WickrIO API functions used: cmdDecryptString()
	 */
	async loadData() {
		try {
			if (!fs.existsSync("users.txt")) {
				console.log("WARNING: users.txt does not exist!")
				return
			}

			var users = fs.readFileSync("users.txt", "utf-8")
			if (users.length === 0 || !users || users === "") {
				return
			}
			console.log("Decrypting user database...")
			var ciphertext = WickrIOAPI.cmdDecryptString(users.toString())

			if (encryptorDefined === true) {
				// Decrypt
				var decryptedData = encryptor.decrypt(ciphertext)
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
			console.log("Encrypting user database...")
			if (this.wickrUsers.length === 0) {
				return
			}

			var serialusers
			if (encryptorDefined === true) {
				//Encrypt
				serialusers = encryptor.encrypt(this.wickrUsers)
			} else {
				serialusers = JSON.stringify(this.wickrUsers)
			}

			var encrypted = WickrIOAPI.cmdEncryptString(serialusers)
			var saved = fs.writeFileSync("users.txt", encrypted, "utf-8")
			console.log("User database saved to file!")
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
		var tokens = JSON.parse(process.env.tokens)
		message = JSON.parse(message)
		let {
			users,
			time,
			message_id: messageID,
			control,
			msg_ts: msgTS,
			receiver,
			sender: userEmail,
			ttl,
			bor,
			msgtype: msgType,
			vgroupid: vGroupID
		} = message
		var convoType = ""

		// Get the admin, if this is an admin user
		var localWickrAdmins = this.myAdmins
		var admin = localWickrAdmins.getAdmin(userEmail)

		// If ONLY admins can receive and handle messages and this is
		// not an admin, then drop the message
		if (this.adminOnly === true && admin === undefined) {
			console.log("Dropping message from non-admin user!")
			return
		}

		// Set the isAdmin flag
		var isAdmin = admin !== undefined

		// Determine the convo type (1to1, group, or room)
		if (vGroupID.charAt(0) === "S") convoType = "room"
		else if (vGroupID.charAt(0) === "G") convoType = "groupconvo"
		else convoType = "personal"

		if (message.file) {
			var isVoiceMemo = false
			if (message.file.isvoicememo) {
				isVoiceMemo = true
				var voiceMemoDuration = message.file.voicememoduration
				var parsedObj = {
					messageID,
					file: message.file.localfilename,
					fileName: message.file.filename,
					vGroupID,
					control,
					msgTS,
					time,
					receiver,
					userEmail,
					isVoiceMemo,
					voiceMemoDuration,
					convoType,
					isAdmin,
					msgType: "file",
					ttl,
					bor
				}
			} else {
				var parsedObj = {
					messageID,
					file: message.file.localfilename,
					fileName: message.file.filename,
					vGroupID,
					control,
					time,
					msgTS,
					receiver,
					userEmail,
					isVoiceMemo,
					convoType,
					isAdmin,
					msgtype: "file",
					ttl,
					bor
				}
			}
			return parsedObj
		} else if (message.location) {
			var parsedObj = {
				messageID,
				latitude: message.location.latitude,
				longitude: message.location.longitude,
				vGroupID,
				control,
				time,
				msgTS,
				receiver,
				userEmail,
				convoType,
				isAdmin,
				msgtype: "location",
				ttl,
				bor
			}
			return parsedObj
		} else if (message.call) {
			var parsedObj = {
				messageID,
				status: message.call.status,
				participants: message.call.participants,
				vGroupID,
				control,
				time,
				msgTS,
				receiver,
				userEmail,
				convoType,
				isAdmin,
				msgType: "call",
				ttl,
				bor
			}
			return parsedObj
		} else if (message.keyverify) {
			var parsedObj = {
				time,
				messageID,
				vGroupID,
				control,
				msgTS,
				receiver,
				userEmail,
				convoType,
				isAdmin,
				msgType: "keyverify",
				ttl,
				bor
			}
			return parsedObj
		} else if (message.control) {
			let parsedMessage = {
				time,
				messageID,
				users,
				ttl,
				bor,
				control,
				isrecall: control.isrecall,
				msgTS,
				// receiver,
				// sender,
				// file,
				// filename,
				message: request,
				// command,
				// argument,
				vGroupID,
				convoType,
				msgType,
				userEmail,
				isAdmin
				// latitude,
				// longitude,
				// isVoiceMemo,
				// voiceMemoDuration
			}
			return parsedMessage
		} else if (message.message === undefined) {
			return
		}

		var request = message.message
		var command = "",
			argument = ""
		//This doesn't capture @ mentions
		var parsedData = request.match(/(\/[a-zA-Z]+)([\s\S]*)$/)
		if (parsedData !== null) {
			command = parsedData[1]
			if (parsedData[2] !== "") {
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

		parsedObj = {
			time,
			messageID,
			users,
			message: request,
			command,
			control,
			msgTS,
			receiver,
			argument,
			vGroupID,
			userEmail,
			convoType,
			isAdmin,
			msgType: "message",
			ttl,
			bor
		}

		let parsedMessage = {
			time,
			messageID,
			users,
			ttl,
			bor,
			// control,
			msgTS,
			// receiver,
			// sender,
			// file,
			// filename,
			message: request,
			// command,
			// argument,
			vGroupID,
			convoType,
			msgType,
			userEmail,
			isAdmin
			// latitude,
			// longitude,
			// isVoiceMemo,
			// voiceMemoDuration
		}
		// console.log({ parsedObj, parsedMessage })

		return parsedObj
	}

	/*
	 * User functions
	 */
	addUser(wickrUser) {
		this.wickrUsers.push(wickrUser)
		var saved = this.saveData()
		console.log("New Wickr user added to database.")
		return wickrUser
	}

	getUser(userEmail) {
		var found = this.wickrUsers.find(function (user) {
			return user.userEmail === userEmail
		})
		return found
	}

	getUsers() {
		return this.wickrUsers
	}

	deleteUser(userEmail) {
		var found = this.wickrUsers.find(function (user) {
			return user.userEmail === userEmail
		})
		var index = this.wickrUsers.indexOf(found)
		this.wickrUsers.splice(index, 1)
		return found
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = {
	WickrIOBot,
	WickrUser,
	WickrIOConfigure
}
