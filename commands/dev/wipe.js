import BotCommand from '../../types/command/BotCommand.js'
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'
import logger from 'gamebot/logger'

export default new BotCommand({
    name: 'wipe',
        aliases: [],
    description: 'Wipes a user\'s stored information.',
    category: 'dev',
    permissions: [GAMEBOT_PERMISSIONS.OWNER],
    dmCommand: true,
    args: [],
    run: function(msg, args) {
        const collection = msg.client.database.collection('users')
        const userID = args[0].replace(/\D/g, '')
        collection.findOneAndDelete({ userID })
        .then(() => msg.channel.sendEmbed(`<@${userID}> was wiped from the database.`))
        .catch(err => {
            logger.error(err)
            msg.channel.sendEmbed(`<@${userID}> could not be wiped from the database.`, 'Error!')
        })
    }
})