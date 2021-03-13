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

  sendSecurityGroupVoiceMemoButtons(
    securityGroups,
    voiceMemo,
    duration,
    ttl,
    bor,
    messageID,
    sentBy,
    buttons
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
      sentBy,
      buttons
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

  sendSecurityGroupAttachmentButtons(
    securityGroups,
    filename,
    displayName,
    ttl,
    bor,
    messageID,
    sentBy,
    buttons
  ) {
    return this.WickrIOAPI.cmdSendSecurityGroupAttachment(
      securityGroups,
      filename,
      displayName,
      ttl,
      bor,
      messageID,
      sentBy,
      buttons
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

  sendSecurityGroupMessageButtons(securityGroups, message, ttl, bor, messageID, flags, buttons) {
    return this.WickrIOAPI.cmdSendSecurityGroupMessage(
      message,
      securityGroups,
      ttl,
      bor,
      messageID,
      flags,
      buttons
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

  sendNetworkVoiceMemoButtons(voiceMemo, duration, ttl, bor, messageID, sentBy, buttons) {
    return this.WickrIOAPI.cmdSendNetworkVoiceMemo(
      voiceMemo,
      'VoiceMemo',
      duration,
      ttl,
      bor,
      messageID,
      sentBy,
      buttons
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

  sendNetworkAttachmentButtons(filename, displayName, ttl, bor, messageID, sentBy, flags, buttons) {
    return this.WickrIOAPI.cmdSendNetworkAttachment(
      filename,
      displayName,
      ttl,
      bor,
      messageID,
      sentBy,
      flags,
      buttons
    )
  }

  sendNetworkMessage(message, ttl, bor, messageID) {
    return this.WickrIOAPI.cmdSendNetworkMessage(message, ttl, bor, messageID)
  }

  sendNetworkMessageButtons(message, ttl, bor, messageID, flags, buttons) {
    return this.WickrIOAPI.cmdSendNetworkMessage(message, ttl, bor, messageID, flags, buttons)
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

  sendMessageUserHashFileButtons(filePath, message, ttl, bor, messageID, buttons) {
    return this.WickrIOAPI.cmdSendMessageUserHashFile(
      filePath,
      message,
      ttl,
      bor,
      messageID,
      buttons
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

  sendMessageUserNameFileButtons(filePath, message, ttl, bor, messageID, flags, buttons) {
    return this.WickrIOAPI.cmdSendMessageUserNameFile(
      filePath,
      message,
      ttl,
      bor,
      messageID,
      flags,
      buttons
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

  sendAttachmentUserHashFileButtons(
    filePath,
    attachment,
    display,
    ttl,
    bor,
    messageID,
    buttons
  ) {
    return this.WickrIOAPI.cmdSendAttachmentUserHashFile(
      filePath,
      attachment,
      display,
      ttl,
      bor,
      messageID,
      buttons
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

  sendAttachmentUserNameFileButtons(
    filePath,
    attachment,
    display,
    ttl,
    bor,
    messageID,
    buttons
  ) {
    return this.WickrIOAPI.cmdSendAttachmentUserNameFile(
      filePath,
      attachment,
      display,
      ttl,
      bor,
      messageID,
      buttons
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

  send1to1MessageLowPriorityButtons(userArray, reply, ttl, bor, messageID, flags, buttons) {
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
