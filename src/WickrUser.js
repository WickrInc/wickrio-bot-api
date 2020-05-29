class WickrUser {
  constructor(userEmail, fields) {
    this.userEmail = userEmail;

    if (fields === null) {
      fields = {}
    }

    Object.keys(fields).forEach((key) => {
      this[key] = fields[key]
    })
  }
};


module.exports = WickrUser;
