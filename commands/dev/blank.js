import BotCommand from '../../types/command/BotCommand.js'
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'

export default new BotCommand({
  name: 'blank',
    aliases: ['blank'],
  description: 'Description',
  category: 'dev',
  permissions: [GAMEBOT_PERMISSIONS.GOD],
  dmCommand: true,
  args: [],
  run: function(msg, args) {
  }
})