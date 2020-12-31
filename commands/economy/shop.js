const Discord = require('./../../discord_mod')
const options = require('./../../config/options')

module.exports = {
    name: 'shop',
    usage: 'shop',
    aliases: [],
    description: 'Shows the available shop items.',
    category: 'economy',
    permissions: [],
    dmCommand: true,
    args: false,
    run: async function(msg, args) {
        msg.channel.sendMsgEmbed(`See our new shop at [gamebot.rocks/shop](${process.env.BASE_URL}/shop)`)
    }
  }