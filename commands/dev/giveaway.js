import options from './../../config/options.js'
import Discord from './../../discord_mod.js'

export default {
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
        const message = args.slice(4, args.length).join(' ') || `React to the message in the next ${time} minute${time == 1 ? '' : 's'} to get ${amount}${options.creditIcon}.`
        time *= 60000 // convert time to ms
        var reactionMessage
        const collection = msg.client.database.collection('users')

        // send reaction message
        await channel.sendMsgEmbed(message, 'A giveaway is starting!').then(message => {
            message.react(reaction)
            reactionMessage = message
        })

        const filter = r => r.emoji.id == reaction
        const collector = reactionMessage.createReactionCollector(filter, { time });
        var collectedUsers = []
        collector.on('collect', async r => {
            const user = r.users.last()
            // avoid duplicates 
            if(collectedUsers.includes(user.id) || user.id == msg.client.user.id) return
            collectedUsers.push(user.id) 

            await user.createDBInfo()

            await collection.updateOne(
                { userID: user.id },
                { $inc: { balance: amount } }
            ).catch(console.error)
            
            
        });
        collector.on('end', collected => {
            try {
                msg.author.createDM().then(c => {
                    c.send(`The giveaway you started in ${channel} at ${new Date(Date.now() - args[2] * 1000).toLocaleTimeString('en-us')} is over. There were ${collectedUsers.length} participants who earned ${amount}${options.creditIcon}.`)
                })

                reactionMessage.edit({
                    embed: {
                        title: 'The giveaway is now over!',
                        description: 'If you participated, your credits should have been rewarded.',
                        color: 4513714
                    }
                })
            } catch (err) {
                console.error(err)
                reactionMessage.edit({
                    embed: {
                        title: 'The giveaway is now over!',
                        description: 'If you participated, your credits should be rewarded shortly.',
                        color: 4513714
                    }
                })
            }
        });
    }
  }