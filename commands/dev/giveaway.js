import options from './../../config/options.js'
import logger from 'gamebot/logger'
import GamebotError from '../../types/error/GamebotError.js'
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'

import { ApplicationCommandOptionType, ButtonStyle } from 'discord.js'


import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
    name: 'giveaway',
    aliases: [],
    description: 'Start a giveaway in a channel.',
    category: 'dev',
    permissions: [GAMEBOT_PERMISSIONS.OWNER],
    dmCommand: true,
    args: [{
        name: 'channel',
        description: 'The channel to start the giveaway in.',
        type: ApplicationCommandOptionType.Channel,
        required: true,
    }, {
        name: 'time',
        description: 'The time the giveaway should last, in minutes',
        type: ApplicationCommandOptionType.Integer,
        required: true,
    }, {
        name: 'amount',
        description: 'The type of reward for the giveaway.',
        type: ApplicationCommandOptionType.Integer,
        required: true,
    },{
        name: 'type',
        description: 'The type of reward for the giveaway.',
        type: ApplicationCommandOptionType.String,
        required: true,
    },{
        name: 'message',
        description: 'The message to send with the giveaway.',
        type:  ApplicationCommandOptionType.String,
        required: false,
    }],
    run: async function(msg, args) {
        // initialize constants
        let channel = await msg.client.channels.fetch(args[0].replace(/\D/g, ''))
        let time =  parseFloat(args[1])
        let amount = parseInt(args[2])
        let type = (args[3] || 'credits').toLowerCase()
        let emoji = options.creditIcon

        time *= 60000 // convert time to ms
        const collection = msg.client.database.collection('users')

        // Default to credits if type is not specified
        if(type === 'gold') {
            emoji = options.goldIcon
        }
        
        let timeString = `<t:${Math.floor((Date.now() + time)/1000)}:R>`

        let message = args.slice(4, args.length).join(' ') || `Click below before time expires ${timeString} to get ${amount}${emoji}.`

        // send reaction message with a button
        let giveawayMessage = await channel.send({
            embeds: [{
                title: 'A giveaway is starting!',
                description: message,
                color: options.colors.info
            }],
            components: [
                new Discord.ActionRowBuilder().addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('giveaway')
                        .setLabel(amount.toString())
                        .setEmoji(emoji)
                        .setStyle(ButtonStyle.Primary)
                )
            ]
        })

        // Collect button clicks and reward users
        let collectedUsers = {}
        const filter = i => i.customId === 'giveaway'
        const collector = giveawayMessage.createMessageComponentCollector({ filter, time })

        collector.on('collect', async (i) => {
            let user = i.user

            // Avoid duplicates
            if(collectedUsers[i.user.id] || user.id == msg.client.user.id) {
                i.reply({
                    content: `You've already claimed your reward from this giveaway!`,
                    ephemeral: true
                })
                return
            }
            
            // Prevent users from claiming more than once
            collectedUsers[user.id] = true

            await user.createDBInfo()

            if(type === 'gold') {
                await collection.updateOne(
                    { userID: user.id },
                    { $inc: { goldBalance: amount } }
                ).catch(logger.error.bind(logger))
            } else {
                await collection.updateOne(
                    { userID: user.id },
                    { $inc: { balance: amount } }
                ).catch(logger.error.bind(logger))
            }

            i.reply({
                content: `You have been rewarded ${amount}${emoji}!`,
                ephemeral: true
            })
        });
        
        collector.once('end', collected => {
            try {
                msg.author.createDM().then(c => {
                    c.send(`The giveaway you started in ${channel} at ${new Date(Date.now() - args[2] * 1000).toLocaleTimeString('en-us')} is over. There were ${Object.keys(collectedUsers).length} participants who earned ${amount}${emoji}.`)
                })

                giveawayMessage.edit({
                    embeds: [{
                        title: 'The giveaway is now over!',
                        description: 'If you participated, your credits should have been rewarded.',
                        color: options.colors.info
                    }],
                    components: []
                })
            } catch (err) {
                logger.error(err)
                giveawayMessage.edit({
                    embeds: [{
                        title: 'The giveaway is now over!',
                        description: 'If you participated, your credits should be rewarded shortly.',
                        color: options.colors.error
                    }],
                    components: []
                })
            }
        });
    }
})