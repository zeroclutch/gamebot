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

        const url = process.env.BASE_URL || 'https://gamebot.rocks'

        params.append('cmd', '_donations')
        params.append('business', 'BDWKJXN5ABEU4')
        params.append('item_name', 'Gamebot')
        params.append('currency_code', 'USD')
        params.append('source', 'url')
        params.append('bn', 'PayPal_Donation_Gamebot_US')
        params.append('return', url + '/thanks')
        params.append('notify_url', url + '/donations')
        params.append('custom', msg.author.id)

        msg.channel.sendMsgEmbed('Sorry, Gamebot is not accepting donations at this time. Please see the support server for more details. Donations will open shortly.')

    }
  }