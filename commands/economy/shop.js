import Discord from './../../discord_mod.js'
import options from './../../config/options.js'

import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
    name: 'shop',
    usage: 'shop',
    aliases: [],
    description: 'Shows the available shop items.',
    category: 'economy',
    permissions: [],
    dmCommand: true,
    args: false,
    run: async function(msg, args) {
        msg.channel.sendMsgEmbed(`See our new shop at [gamebot.rocks/shop](${process.env.BASE_URL}/shop)`)
    }
  })