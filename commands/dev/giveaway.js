import options from './../../config/options.js'
import logger from 'gamebot/logger'
import GamebotError from '../../types/error/GamebotError.js'
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'


import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
    name: 'giveaway',
        aliases: [],
    description: 'Start a giveaway in a channel.',
    category: 'dev',
    permissions: [GAMEBOT_PERMISSIONS.OWNER],
    dmCommand: true,
    args: [],
    run: async function(msg, args) {
        // initialize constants
        let channel = await msg.client.channels.fetch(args[0].replace(/\D/g, ''))
        let time =  parseFloat(args[1])
        let amount = parseInt(args[2])
        let reaction = args[3].replace(/\D/g, '')
        let message = args.slice(4, args.length).join(' ') || `React to the message in the next ${time} minute${time == 1 ? '' : 's'} to get ${amount}${options.creditIcon}.`

        time *= 60000 // convert time to ms
        const collection = msg.client.database.collection('users')

        // send reaction message
        let reactionMessage = await channel.send({
            embeds: [{
                title: 'A giveaway is starting!',
                description: message,
                color: options.colors.info
            }]
        })
        
        let reactionEmoji = await msg.guild.emojis.fetch(reaction)
        if(!reactionEmoji) throw new GamebotError('The client did not find the emoji.')
        reactionMessage.react(reactionEmoji)

        const filter = r => r.emoji.id == reaction
        const collector = reactionMessage.createReactionCollector({ filter, time });
        let collectedUsers = []
        collector.on('collect', async (r, user) => {
            // avoid duplicates 
            if(collectedUsers.includes(user.id) || user.id == msg.client.user.id) return
            collectedUsers.push(user.id) 

            await user.createDBInfo()

            await collection.updateOne(
                { userID: user.id },
                { $inc: { balance: amount } }
            ).catch(logger.error)
        });
        
        collector.once('end', collected => {
            try {
                msg.author.createDM().then(c => {
                    c.send(`The giveaway you started in ${channel} at ${new Date(Date.now() - args[2] * 1000).toLocaleTimeString('en-us')} is over. There were ${collectedUsers.length} participants who earned ${amount}${options.creditIcon}.`)
                })

                reactionMessage.edit({
                    embeds: [{
                        title: 'The giveaway is now over!',
                        description: 'If you participated, your credits should have been rewarded.',
                        color: 4513714
                    }]
                })
            } catch (err) {
                logger.error(err)
                reactionMessage.edit({
                    embeds: [{
                        title: 'The giveaway is now over!',
                        description: 'If you participated, your credits should be rewarded shortly.',
                        color: 4513714
                    }]
                })
            }
        });
    }
})