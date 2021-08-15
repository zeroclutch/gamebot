import options from './../../config/options.js'
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
    args: false,
    run: function(msg, args) {
        msg.channel.send({
            embeds: [{
                title: 'Support Gamebot\'s development by donating!',
                description: `[Go to our shop](${process.env.BASE_URL}/shop) and purchase credits or coins to donate!`,
                //description: 'Donation link coming soon.',
                color: options.colors.economy,
                fields: [
                    {
                        name: 'Rewards',
                        value: `You can gain ${options.creditIcon} credits and ${options.goldIcon} gold for donating!`
                    },
                ],
            }]
        }).catch(err => {
            console.error(err)
            msg.channel.sendEmbed('Unable to start a DM with you. Check your Discord settings and try again.', 'Error!', options.colors.error)
        })
    }
  })