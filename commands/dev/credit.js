import options from './../../config/options.js'

export default {
    name: 'credit',
    usage: 'credit <user> <amount>',
    aliases: [],
    description: 'Adds to a specified user\'s balance.',
    category: 'dev',
    permissions: ['GOD'],
    dmCommand: true,
    args: true,
    run: function(msg, args) {
        const user = args[0].replace(/\D/g, '')
        const amount = parseInt(args[1])
        msg.client.database.collection('users').findOneAndUpdate(
            {'userID': user},
            { $inc: { balance: amount } },
            { returnOriginal: false }
        ).then(result => {
            msg.channel.sendMsgEmbed(`<@${user}> now has ${result.value.balance}${options.creditIcon}.`, `User was updated.`)
        }).catch(err => {
            console.error(err)
            msg.channel.sendMsgEmbed('User not found.')
        })

    }
}