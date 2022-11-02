import BotCommand from '../../types/command/BotCommand.js'
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'

export default new BotCommand({
    name: 'uptime',
        aliases: [],
    description: 'Displays how long the bot has been running',
    category: 'dev',
    permissions: [GAMEBOT_PERMISSIONS.GOD],
    dmCommand: true,
    args: [],
    run: function(msg, args) {
        let s = (Date.now() - msg.client.readyAt.valueOf())
        let ms = s % 1000;
        s = (s - ms) / 1000;
        let secs = s % 60;
        s = (s - secs) / 60;
        let mins = s % 60;
        let hrs = (s - mins) / 60;
        msg.channel.sendEmbed(`Gamebot has been running for ${hrs} hours, ${mins} minutes, ${secs}.${ms} seconds`)
    }
})
