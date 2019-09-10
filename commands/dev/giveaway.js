const options = require('./../../config/options')
module.exports = {
    name: 'giveaway',
    usage: 'giveaway <channel> <time (minutes)> <amount> <reaction> <message>',
    aliases: [],
    description: 'Start a giveaway in a channel.',
    category: 'dev',
    permissions: ['GOD'],
    dmCommand: true,
    args: false,
    run: async function(msg, args) {
        // initialize constants
        const channel = msg.client.channels.get(args[0].replace(/\D/g, ''))
        var time =  parseFloat(args[1])
        const amount = parseInt(args[2])
        const reaction = args[3].replace(/\D/g, '')
        const message = args.slice(4, args.length).join(' ') || `React to the message in the next ${time} minute${time == 1 ? '' : 's'} to get ${amount}${options.creditIcon}`
        time *= 60000 // convert time to ms
        var reactionMessage
        const collection = msg.client.database.collection('users')

        // send reaction message
        await channel.sendMsgEmbed(message, 'A giveaway is starting!').then(message => {
            message.react(reaction)
            reactionMessage = message
        })

        // create callback
        const callback = (message) => {
            if(!message) return

            const users = message.reactions.find(r => r._emoji.id == reaction).users
            const query = users.map((value, index, array) => {
                return { userID: value.id }
            })
            collection.updateMany(
                { $or: query },
                { $inc: { balance: amount } }
            ).then(res => {
                msg.author.createDM().then(c => {
                    c.send(`The giveaway you started in ${channel} at ${new Date(Date.now() - args[2] * 1000).toLocaleTimeString('en-us')} is over. There were ${users.size - 1} participants who earned ${amount}${options.creditIcon}.`)
                })
    
                message.edit({
                    embed: {
                        title: 'The giveaway is now over!',
                        description: 'If you participated, your credits will be rewarded shortly.',
                        color: 4513714
                    }
                })
            })
            .catch(err => {
                console.error(err)
                message.edit({
                    embed: {
                        title: 'The giveaway is now over!',
                        description: 'There was an error in giving away all the credits.',
                        color: 13632027
                    }
                })
            })

        }
        setTimeout(() => { callback(reactionMessage) }, time)
    }
  }