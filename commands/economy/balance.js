import options from './../../config/options.js'
import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
    name: 'balance',
    usage: 'balance',
    aliases: ['bal'],
    description: 'Get your current balance.',
    category: 'economy',
    permissions: [],
    dmCommand: true,
    args: false,
    run: function(msg, args) {
        msg.client.database.collection('users').findOne({'userID': msg.author.id}).then(user => {
            if(!user) throw 'Error: User not found in database'
            msg.channel.send({
                embed: {
                    title: `${msg.author.tag}'s balance`,
                    description: `You have **${user.balance}**${options.creditIcon}.`,
                    color: 4513714,
                    footer: {
                        text: `Get credits by typing ${msg.channel.prefix}daily, ${msg.channel.prefix}donate, and from giveaways in the support server!`
                    }
                } 
            })
        }).catch(err => {
            console.error(err)
            msg.channel.sendMsgEmbed('User not found.')
        })

    }
  })