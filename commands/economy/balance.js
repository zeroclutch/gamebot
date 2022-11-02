import options from './../../config/options.js'
import BotCommand from '../../types/command/BotCommand.js'
import logger from 'gamebot/logger'

export default new BotCommand({
    name: 'balance',
        aliases: ['bal'],
    description: 'Get your current balance.',
    category: 'economy',
    permissions: [],
    dmCommand: true,
    args: [],
    run: function(msg, args) {
        msg.client.database.collection('users').findOne({'userID': msg.author.id}).then(user => {
            if(!user) throw 'Error: User not found in database'
            msg.reply({
                embeds: [{
                    title: `${msg.author.tag}'s balance`,
                    description: `You have **${user.balance || 0}**${options.creditIcon} and **${user.goldBalance || 0}**${options.goldIcon}.`,
                    color: 4513714,
                    footer: {
                        text: `Get credits by typing ${msg.channel.prefix}daily, ${msg.channel.prefix}donate, and from giveaways in the support server!`
                    }
                }]
            })
        }).catch(err => {
            logger.error(err)
            msg.reply({
                embeds: [{
                    description: 'User not found.',
                    color: options.colors.error,
                }]
            })
        })

    }
  })