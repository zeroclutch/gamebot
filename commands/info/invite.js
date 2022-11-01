import options from './../../config/options.js'

import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
    name: 'invite',
    usage: 'invite',
    aliases: ['botinfo', 'support', 'donate'],
    description: 'Invite the bot to your server!',
    category: 'info',
    permissions: [],
    dmCommand: true,
    args: [],
    run: function(msg, args) {
        msg.reply({
            embeds: [{
                description: `
                    [**Invite** Gamebot to your server](https://gamebot.rocks/invite?ref=inviteCommand)
                    [**Join** the support server](${options.serverInvite}?ref=inviteCommand)
                    [**Star** Gamebot on Github](https://github.com/zeroclutch/gamebot)
                    **Support** Gamebot on Paypal - Type \`&donate\` for the link!`,
                title: 'Invite Gamebot to your server!',
                color: options.colors.info,
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
