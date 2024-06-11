class APIService {
  constructor({ WickrIOAPI }) {
    this.WickrIOAPI = WickrIOAPI
  }

  async getSecurityGroups() {
    const groupData = await this.WickrIOAPI.cmdGetSecurityGroups()
    const temp = JSON.parse(groupData)
    // return JSON.parse(groupData);
    return temp
  }

  async sendSecurityGroupVoiceMemo(
    securityGroups,
    voiceMemo,
    duration,
    ttl,
    bor,
    messageID,
    sentBy,
    messageMeta = ''
  ) {
    // TODO add time sent to VoiceMemo String?
    return await this.WickrIOAPI.cmdSendSecurityGroupVoiceMemo(
      securityGroups,
      voiceMemo,
      'VoiceMemo',
      duration,
      ttl,
      bor,
      messageID,
      sentBy,
      messageMeta
    )
  }

  async sendSecurityGroupAttachment(
    securityGroups,
    filename,
    displayName,
    ttl,
    bor,
    messageID,
    sentBy,
    messageMeta,
    deleteWhenSent = false
  ) {
    return await this.WickrIOAPI.cmdSendSecurityGroupAttachment(
      securityGroups,
      filename,
      displayName,
      ttl,
      bor,
      messageID,
      sentBy,
      messageMeta,
      deleteWhenSent
    )
  }

  async sendSecurityGroupMessage(
    securityGroups,
    message,
    ttl,
    bor,
    messageID,
    flags = [],
    messageMeta = ''
  ) {
    return await this.WickrIOAPI.cmdSendSecurityGroupMessage(
      message,
      securityGroups,
      ttl,
      bor,
      messageID,
      flags,
      messageMeta
    )
  }

  async sendNetworkVoiceMemo(
    voiceMemo,
    duration,
    ttl,
    bor,
    messageID,
    sentBy,
    messageMeta = ''
  ) {
    return await this.WickrIOAPI.cmdSendNetworkVoiceMemo(
      voiceMemo,
      'VoiceMemo',
      duration,
      ttl,
      bor,
      messageID,
      sentBy,
      messageMeta
    )
  }

  async sendNetworkAttachment(
    filename,
    displayName,
    ttl,
    bor,
    messageID,
    sentBy,
    message = '',
    messageMeta = '',
    deleteWhenSent = false
  ) {
    return await this.WickrIOAPI.cmdSendNetworkAttachment(
      filename,
      displayName,
      ttl,
      bor,
      messageID,
      sentBy,
      message,
      messageMeta,
      deleteWhenSent
    )
  }

  async sendNetworkMessage(
    message,
    ttl,
    bor,
    messageID,
    flags = [],
    messageMeta = ''
  ) {
    return await this.WickrIOAPI.cmdSendNetworkMessage(
      message,
      ttl,
      bor,
      messageID,
      flags,
      messageMeta
    )
  }

  async writeMessageIDDB(messageId, sender, target, dateSent, messageContent) {
    return await this.WickrIOAPI.cmdAddMessageID(
      messageId,
      sender,
      target,
      dateSent,
      messageContent
    )
  }

  async getMessageStatus(messageID, type, page, pageSize) {
    try {
      return await this.WickrIOAPI.cmdGetMessageStatus(
        messageID,
        type,
        page,
        pageSize
      )
    } catch (err) {
      return err
    }
  }

  async getMessageStatusFiltered(messageID, type, page, pageSize, filter, users) {
    try {
      return await this.WickrIOAPI.cmdGetMessageStatus(
        messageID,
        type,
        page,
        pageSize,
        filter,
        users
      )
    } catch (err) {
      return undefined
    }
  }

  async getMessageIDEntry(messageID) {
    try {
      return await this.WickrIOAPI.cmdGetMessageIDEntry(messageID)
    } catch (err) {
      return undefined
    }
  }

  async getMessageIDTable(page, size, sender) {
    return await this.WickrIOAPI.cmdGetMessageIDTable(page, size, sender)
  }

  async sendRoomMessage(vGroupID, message, ttl, bor, messageID, flags, messagemeta) {
    return await this.WickrIOAPI.cmdSendRoomMessage(
      vGroupID,
      message,
      ttl === undefined ? '' : ttl,
      bor === undefined ? '' : bor,
      messageID === undefined ? '' : messageID,
      flags === undefined ? [] : flags,
      messagemeta === undefined ? '' : messagemeta
    )
  }

  async sendRoomAttachment(vGroupID, attachment, display, ttl, bor, messagemeta, deleteWhenSent) {
    return await this.WickrIOAPI.cmdSendRoomAttachment(
      vGroupID,
      attachment,
      display,
      ttl === undefined ? '' : ttl,
      bor === undefined ? '' : bor,
      messagemeta === undefined ? '' : messagemeta,
      deleteWhenSent === undefined ? false : deleteWhenSent
    )
  }

  async sendMessageUserHashFile(filePath, message, ttl, bor, messageID, messageMeta) {
    return await this.WickrIOAPI.cmdSendMessageUserHashFile(
      filePath,
      message,
      ttl,
      bor,
      messageID,
      messageMeta
    )
  }

  async sendMessageUserNameFile(
    filePath,
    message,
    ttl,
    bor,
    messageID,
    flags = [],
    messageMeta = ''
  ) {
    return await this.WickrIOAPI.cmdSendMessageUserNameFile(
      filePath,
      message,
      ttl,
      bor,
      messageID,
      flags,
      messageMeta
    )
  }

  async sendAttachmentUserHashFile(
    filePath,
    attachment,
    display,
    ttl,
    bor,
    messageID,
    messageMeta,
    message = '',
    deleteWhenSent = false
  ) {
    return await this.WickrIOAPI.cmdSendAttachmentUserHashFile(
      filePath,
      attachment,
      display,
      ttl,
      bor,
      messageID,
      messageMeta,
      message,
      deleteWhenSent
    )
  }

  async sendAttachmentUserNameFile(
    filePath,
    attachment,
    display,
    ttl,
    bor,
    messageID,
    messageMeta,
    message = '',
    deleteWhenSent = false
  ) {
    return await this.WickrIOAPI.cmdSendAttachmentUserNameFile(
      filePath,
      attachment,
      display,
      ttl,
      bor,
      messageID,
      messageMeta,
      message,
      deleteWhenSent
    )
  }

  async sendVoiceMemoUserNameFile(
    filePath,
    voiceMemo,
    duration,
    ttl,
    bor,
    messageID,
    messageMeta,
    sentBy = ''
  ) {
    return await this.WickrIOAPI.cmdSendVoiceMemoUserNameFile(
      filePath,
      voiceMemo,
      'VoiceMemo',
      duration,
      ttl,
      bor,
      messageID,
      messageMeta,
      sentBy
    )
  }

  async sendVoiceMemoUserHashFile(
    filePath,
    voiceMemo,
    duration,
    ttl,
    bor,
    messageID,
    messageMeta,
    sentBy = ''
  ) {
    return await this.WickrIOAPI.cmdSendVoiceMemoUserHashFile(
      filePath,
      voiceMemo,
      'VoiceMemo',
      duration,
      ttl,
      bor,
      messageID,
      messageMeta,
      sentBy
    )
  }

  async setMessageStatus(messageID, userID, statusNumber, statusMessage) {
    return await this.WickrIOAPI.cmdSetMessageStatus(
      messageID,
      userID,
      statusNumber,
      statusMessage
    )
  }

  async send1to1Message(userArray, reply, ttl, bor, messageID, flags, messagemeta) {
    return await this.WickrIOAPI.cmdSend1to1Message(
      userArray,
      reply,
      ttl === undefined ? '' : ttl,
      bor === undefined ? '' : bor,
      messageID === undefined ? '' : messageID,
      flags === undefined ? [] : flags,
      messagemeta === undefined ? '' : messagemeta
    )
  }

  async send1to1MessageLowPriority(
    userArray,
    reply,
    ttl,
    bor,
    messageID,
    flags,
    messageMeta = ''
  ) {
    return await this.WickrIOAPI.cmdSend1to1Message(
      userArray,
      reply,
      ttl,
      bor,
      messageID,
      flags,
      messageMeta,
      true
    )
  }

  async cancelMessageID(messageID) {
    return await this.WickrIOAPI.cmdCancelMessageID(messageID)
  }

  async setEventCallback(callbackUrl) {
    return await this.WickrIOAPI.cmdSetEventCallback(callbackUrl)
  }

  async getEventCallback() {
    return await this.WickrIOAPI.cmdGetEventCallback()
  }

  async deleteEventCallback() {
    return await this.WickrIOAPI.cmdDeleteEventCallback()
  }

  async getUserInfo(userNameList) {
    const userInfo = await this.WickrIOAPI.cmdGetUserInfo(userNameList)
    const temp = JSON.parse(userInfo)
    return temp
  }
}

module.exports = APIService
