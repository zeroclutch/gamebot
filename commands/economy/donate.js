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


        //`https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=pranav.grover%40gmail.com&item_name=Gamebot&currency_code=USD&source=url&return_url=&notify_url=`

        //https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=3NHGJNR5VHPLN&lc=US&item_name=Pokecord&no_note=1&no_shipping=1&rm=1&return=https%3a%2f%2fwww%2epokecord%2ecom%2fdonation%2dthanks&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted&custom=354442895119351809

        const donationLink = new URL('https://www.paypal.com/cgi-bin/webscr')
        const params = donationLink.searchParams

        const url = process.env.BASE_URL || 'https://gamebot-discord.herokuapp.com'

        params.append('cmd', '_donations')
        params.append('business', 'user@example.com')
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
                    color: options.colors.economy,
                    fields: [
                        {
                            name: 'Rewards',
                            value: `Each dollar you donate will give you 5000${options.creditIcon}`
                        },
                        {
                            name: 'Stretch Rewards',
                            value: `If you donate a certain amount, you can get special rewards!
                            **$5:** Access to exclusive in-game backer content.
                            **$10+:** Access to beta testing and a special role in the Gamebot Support Discord.`
                        }
                    ], 
                    footer: 'All values are in US Dollars.'
                }
            })
            msg.channel.sendMsgEmbed('A donation link has been sent!', 'To donate, check your DMs!')
        }).catch(err => {
            console.error(err)
            msg.channel.sendMsgEmbed('Unable to start a DM with you. Check your Discord settings and try again.', 'Error!', options.colors.error)
        }) 

    }
  }