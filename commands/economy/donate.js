import options from './../../config/options.js'
import logger from 'gamebot/logger'
import url from 'url';

import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
    name: 'donate',
    usage: 'donate',
    aliases: ['patreon', 'paypal', 'support'],
    description: 'Get credits and rewards for donating to Gamebot!',
    category: 'economy',
    permissions: [],
    dmCommand: true,
    args: [],
    run: function(msg, args) {
        msg.reply({
            embeds: [{
                title: 'Support Gamebot\'s development by donating!',
                description: `[Go to our shop](${process.env.BASE_URL}/shop) and purchase credits or coins to donate!`,
                color: options.colors.economy,
                fields: [
                    {
                        name: 'Rewards',
                        value: `You can gain ${options.creditIcon} credits and ${options.goldIcon} gold for donating!`
                    },
                ],
            }]
        }).catch(err => {
            logger.error(err)
            msg.reply({
                embeds: [{
                    description: 'An error occurred.',
                    color: options.colors.error,
                }]
            })
        })
    }
  })