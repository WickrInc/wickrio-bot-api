import { BotAPI } from 'wickrio-bot-api'
import dotenv from 'dotenv'
dotenv.config()

const bot = new BotAPI()
// const rawMessage = JSON.stringify({
//   message: '',
//   message_id: 'x',
//   // msg_ts: '1599257133.267822',
//   msg_ts: 'x',
//   msgtype: 1000,
//   receiver: 'localbroadcasttestbot',
//   respond_api: 'http:///0/Apps//Messages',
//   sender: 'jesttest',
//   // time: '9/4/20 10:05 PM',
//   // ttl: '9/8/20 10:05 PM',
//   users: [
//     { name: 'alane+largeroom@wickr.com' },
//     { name: 'localrecordertestbot' },
//   ],
//   vgroupid: '6bd4fe7088ff7a470b94339fe1eb0d5b18940f6faf30ed3464779daf9eb8f14c', // put in env
// })

describe('Connecting', () => {
  it('should test the Bot object, ensuring the bot connects', async () => {
    const status = await bot.start('botapitestbot')
    expect(status).toEqual(true)
  })
  // it('should test storing a normal message', async () => {
  // expect(status).toEqual(true)
  // })
})
