const options = require('./../../config/options')

module.exports = {
    name: 'invite',
    usage: 'invite',
    aliases: ['botinfo', 'support', 'donate'],
    description: 'Invite the bot to your server!',
    category: 'info',
    permissions: [],
    dmCommand: true,
    args: false,
    run: function(msg, args) {
        msg.channel.sendMsgEmbed(`
        [**Invite** Gamebot to your server](https://gamebot.rocks/invite?ref=inviteCommand)
        [**Join** the support server](${options.serverInvite}?ref=inviteCommand)
        [**Star** Gamebot on Github](https://github.com/zeroclutch/gamebot)
        **Support** Gamebot on Paypal - Type \`&donate\` for the link!
        `, 'Important Links')
    }
}
