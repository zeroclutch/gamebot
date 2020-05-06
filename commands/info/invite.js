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
        msg.channel.sendMsgEmbed(`\
        [**Invite** Gamebot to your server](https://discordapp.com/oauth2/authorize?client_id=${msg.client.user.id}&scope=bot&permissions=1547041872)\n\
        [**Join** the support server](${options.serverInvite})\n\
        [**Star** Gamebot on Github](https://github.com/zeroclutch/gamebot)\n\
        **Support** Gamebot on Paypal - Type \`&donate\` for the link!\n\
        `, 'Important Links')
    }
}
