'use strict'

export default {
  currentAdmins: 'Current admins:\n%{userList}',
  alreadyContains: 'Failed, current list of admins already contains:\n%{user}',
  adminsToAdd: 'Going to add admins:\n%{userList}',
  adminsAdded: '%{sender} has added the following admins:\n%{userList}',
  noNewAdmins: 'Command contains no user names to add!',
  adminsToDelete: 'Going to delete admins:\n%{userList}',
  adminsDeleted: '%{sender} has removed the following admins:\n%{userList}',
  removeFail:
    'Failed to remove the following admin(s):\n%{user}\nAdmin(s) not found. ',
  noRemoveAdmins: 'Command contains no user names to remove!',
  invalidAdminCommand:
    'Invalid /admin command, usage:\n/admin list\n/admin add <user(s)>\n/admin remove <user(s)>',
  invalidVerifyCommand:
    'Invalid /verify command, usage\n/verify getlist\n/verify all\n/verify users <list of users>',
  adminHelp:
    '/admin list : Get list of admin users \n' +
    '/admin add <users> : Add one or more admin users \n' +
    '/admin remove <users> : Remove one or more admin users \n',
  adminHelpWithVerify:
    '/admin list : Get list of admin users \n' +
    '/admin add <users> : Add one or more admin users \n' +
    '/admin remove <users> : Remove one or more admin users \n' +
    '/verify getlist : Get list of users with verification issues \n' +
    '/verify all : Verifies all users \n' +
    '/verify users <users> : Verifies users in users list\n',
  setModeNoAdminsError:
    'Cannot set verification mode if there are no administrators!',
}
