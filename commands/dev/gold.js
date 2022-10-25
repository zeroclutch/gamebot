import options from '../../config/options.js'
import logger from 'gamebot/logger'
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'
import BotCommand from '../../types/command/BotCommand.js'

export default new BotCommand({
    name: 'gold',
    usage: 'gold <user> <amount>',
    aliases: [],
    description: 'Adds to a specified user\'s gold balance.',
    category: 'dev',
    permissions: [GAMEBOT_PERMISSIONS.GOD],
    dmCommand: true,
    args: true,
    run: function(msg, args) {
        const user = args[0].replace(/\D/g, '')
        const amount = parseInt(args[1])

        // Validate amount
        if(isNaN(amount)) {
            msg.channel.sendEmbed(`Invalid amount!`)
            return
        }

        msg.client.database.collection('users').findOneAndUpdate(
            {'userID': user},
            { $inc: { goldBalance: amount } }
        ).then(result => {
            msg.channel.sendEmbed(`<@${user}> now has ${result.value.goldBalance + amount}${options.goldIcon}.`, `User was updated.`)
        }).catch(err => {
            logger.error(err)
            msg.channel.sendEmbed('User not found.')
        })

    }
})