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
        const donationLink = new URL('https://www.paypal.com/cgi-bin/webscr')
        const params = donationLink.searchParams

        const url = process.env.BASE_URL || 'https://gamebot-discord.herokuapp.com'

        params.append('cmd', '_donations')
        params.append('business', '7P472QFLHG4AL')
        params.append('item_name', 'Gamebot')
        params.append('currency_code', 'USD')
        params.append('source', 'url')
        params.append('bn', 'PayPal_Donation_Gamebot_US')
        params.append('return', url + '/thanks')
        params.append('notify_url', url + '/donations')
        params.append('custom', msg.author.id)

        msg.author.createDM().then(channel => {
            channel.send({
                embed: {
                    title: 'Support Gamebot\'s development by donating!',
                    description: `[Click here to donate.](${donationLink.href})`,
                    //description: 'Donation link coming soon.',
                    color: options.colors.economy,
                    fields: [
                        {
                            name: 'Rewards',
                            value: `Each dollar you donate will give you 1000${options.creditIcon}`
                        },
                        {
                            name: 'Stretch Rewards',
                            value: `If you donate a certain amount, you can get special rewards!
                            **$5:** Access to exclusive in-game backer content.
                            **$10+:** Access to beta testing and a special role in the Gamebot Support Discord.`
                        }
                    ], 
                    footer: { text: 'All values are in US Dollars.' }
                }
            })
            if(msg.channel.type != 'dm') msg.channel.sendMsgEmbed('A donation link has been sent!', 'To donate, check your DMs!')
        }).catch(err => {
            console.error(err)
            msg.channel.sendMsgEmbed('Unable to start a DM with you. Check your Discord settings and try again.', 'Error!', options.colors.error)
        }) 

    }
  }