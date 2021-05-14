import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
  name: 'blank',
  usage: 'blank',
  aliases: ['blank'],
  description: 'Description',
  category: 'dev',
  permissions: ['GOD'],
  dmCommand: true,
  args: false,
  run: function(msg, args) {
  }
})