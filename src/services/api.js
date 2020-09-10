class APIService {
  constructor({ WickrIOAPI }) {
    this.WickrIOAPI = WickrIOAPI
  }

  getSecurityGroups() {
    const groupData = this.WickrIOAPI.cmdGetSecurityGroups()
    const temp = JSON.parse(groupData)
    // return JSON.parse(groupData);
    return temp
  }

  sendSecurityGroupVoiceMemo(
    securityGroups,
    voiceMemo,
    duration,
    ttl,
    bor,
    messageID,
    sentBy
  ) {
    // TODO add time sent to VoiceMemo String?
    return this.WickrIOAPI.cmdSendSecurityGroupVoiceMemo(
      securityGroups,
      voiceMemo,
      'VoiceMemo',
      duration,
      ttl,
      bor,
      messageID,
      sentBy
    )
  }

  sendSecurityGroupAttachment(
    securityGroups,
    filename,
    displayName,
    ttl,
    bor,
    messageID,
    sentBy
  ) {
    return this.WickrIOAPI.cmdSendSecurityGroupAttachment(
      securityGroups,
      filename,
      displayName,
      ttl,
      bor,
      messageID,
      sentBy
    )
  }

  sendSecurityGroupMessage(securityGroups, message, ttl, bor, messageID) {
    return this.WickrIOAPI.cmdSendSecurityGroupMessage(
      message,
      securityGroups,
      ttl,
      bor,
      messageID
    )
  }

  sendNetworkVoiceMemo(voiceMemo, duration, ttl, bor, messageID, sentBy) {
    return this.WickrIOAPI.cmdSendNetworkVoiceMemo(
      voiceMemo,
      'VoiceMemo',
      duration,
      ttl,
      bor,
      messageID,
      sentBy
    )
  }

  sendNetworkAttachment(filename, displayName, ttl, bor, messageID, sentBy) {
    return this.WickrIOAPI.cmdSendNetworkAttachment(
      filename,
      displayName,
      ttl,
      bor,
      messageID,
      sentBy
    )
  }

  sendNetworkMessage(message, ttl, bor, messageID) {
    return this.WickrIOAPI.cmdSendNetworkMessage(message, ttl, bor, messageID)
  }

  writeMessageIDDB(messageId, sender, target, dateSent, messageContent) {
    return this.WickrIOAPI.cmdAddMessageID(
      messageId,
      sender,
      target,
      dateSent,
      messageContent
    )
  }

  getMessageStatus(messageID, type, page, pageSize) {
    try {
      return this.WickrIOAPI.cmdGetMessageStatus(
        messageID,
        type,
        page,
        pageSize
      )
    } catch (err) {
      return err
    }
  }

  getMessageStatusFiltered(messageID, type, page, pageSize, filter, users) {
    try {
      return this.WickrIOAPI.cmdGetMessageStatus(
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

  getMessageIDEntry(messageID) {
    try {
      return this.WickrIOAPI.cmdGetMessageIDEntry(messageID)
    } catch (err) {
      return undefined
    }
  }

  getMessageIDTable(page, size, sender) {
    return this.WickrIOAPI.cmdGetMessageIDTable(page, size, sender)
  }

  sendRoomMessage(vGroupID, message) {
    return this.WickrIOAPI.cmdSendRoomMessage(vGroupID, message)
  }

  sendRoomAttachment(vGroupID, attachment, display) {
    return this.WickrIOAPI.cmdSendRoomAttachment(vGroupID, attachment, display)
  }

  sendMessageUserHashFile(filePath, message, ttl, bor, messageID) {
    return this.WickrIOAPI.cmdSendMessageUserHashFile(
      filePath,
      message,
      ttl,
      bor,
      messageID
    )
  }

  sendMessageUserNameFile(filePath, message, ttl, bor, messageID) {
    return this.WickrIOAPI.cmdSendMessageUserNameFile(
      filePath,
      message,
      ttl,
      bor,
      messageID
    )
  }

  sendAttachmentUserHashFile(
    filePath,
    attachment,
    display,
    ttl,
    bor,
    messageID
  ) {
    return this.WickrIOAPI.cmdSendAttachmentUserHashFile(
      filePath,
      attachment,
      display,
      ttl,
      bor,
      messageID
    )
  }

  sendAttachmentUserNameFile(
    filePath,
    attachment,
    display,
    ttl,
    bor,
    messageID
  ) {
    return this.WickrIOAPI.cmdSendAttachmentUserNameFile(
      filePath,
      attachment,
      display,
      ttl,
      bor,
      messageID
    )
  }

  setMessageStatus(messageID, userID, statusNumber, statusMessage) {
    return this.WickrIOAPI.cmdSetMessageStatus(
      messageID,
      userID,
      statusNumber,
      statusMessage
    )
  }

  send1to1Message(userArray, reply, ttl, bor, messageID) {
    return this.WickrIOAPI.cmdSend1to1Message(
      userArray,
      reply,
      ttl,
      bor,
      messageID
    )
  }

  send1to1MessageLowPriority(userArray, reply, ttl, bor, messageID, flags) {
    const buttons = []
    return this.WickrIOAPI.cmdSend1to1Message(
      userArray,
      reply,
      ttl,
      bor,
      messageID,
      flags,
      buttons,
      true
    )
  }

  cancelMessageID(messageID) {
    return this.WickrIOAPI.cmdCancelMessageID(messageID)
  }

  setEventCallback(callbackUrl) {
    return this.WickrIOAPI.cmdSetEventCallback(callbackUrl)
  }

  getEventCallback() {
    return this.WickrIOAPI.cmdGetEventCallback()
  }

  deleteEventCallback() {
    return this.WickrIOAPI.cmdDeleteEventCallback()
  }
}

module.exports = APIService
