import BotCommand from '../../types/command/BotCommand.js'
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'

export default new BotCommand({
  name: 'forcestop',
  aliases: ['stop'],
  description: 'Description',
  category: 'mod',
  permissions: [GAMEBOT_PERMISSIONS.MOD, GAMEBOT_PERMISSIONS.OWNER],
  dmCommand: false,
  args: [],
  run: function(msg, _args) {
    if(msg.channel.game) {
      msg.channel.game.end()
    } else {
      msg.channel.send('There is no game running in this channel.')
    }
  }
})