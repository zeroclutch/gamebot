const options = require('./../../config/options')
const url = require('url');

module.exports = {
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
            embed: {
                title: 'Support Gamebot\'s development by donating!',
                description: `Go to [our shop](${process.env.BASE_URL}) and purchase credits or coins to donate!`,
                //description: 'Donation link coming soon.',
                color: options.colors.economy,
                fields: [
                    {
                        name: 'Rewards',
                        value: `Each $1 you donate will give you 1000${options.creditIcon}.`
                    },
                    {
                        name: 'Support',
                        value: `After donating, you should receive a confirmation DM. If you don't receive this DM and your credits are not added within 2 minutes, [join the support server](${options.serverInvite}?ref=donateCommand) and contact @zero#1234.`
                    }
                ],
                footer: { text: 'All values are in US Dollars.' }
            }
        }).catch(err => {
            console.error(err)
            msg.channel.sendMsgEmbed('Unable to start a DM with you. Check your Discord settings and try again.', 'Error!', options.colors.error)
        })
    }
  }