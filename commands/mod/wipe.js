import BotCommand from '../../types/command/BotCommand.js'

import { ApplicationCommandOptionType, ButtonStyle } from 'discord.js'

import logger from 'gamebot/logger'
import options from '../../config/options.js'

export default new BotCommand({
    name: 'wipe',
        aliases: [],
    description: 'Wipes a user\'s stored information.',
    category: 'mod',
    permissions: ['MOD'],
    dmCommand: true,
    args: [{
        name: 'user',
        description: 'The user to wipe from the database',
        required: true,
        type: ApplicationCommandOptionType.User,
    }],
    run: function(msg, args) {
        const collection = msg.client.database.collection('users')
        const userID = args[0].replace(/\D/g, '')

        // Add a confirmation button
        const embed = new Discord.EmbedBuilder()
        .setTitle('Are you sure?')
        .setDescription(`This will wipe <@${userID}> from the database. This cannot be undone.`)
        .setColor(options.colors.error)

        msg.channel.send({ embeds: [embed], components: [
            new Discord.ActionRowBuilder().addComponents(
                new Discord.ButtonBuilder()
                .setCustomId('wipe_confirm')
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Danger),
                new Discord.ButtonBuilder()
                .setCustomId('wipe_cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
            )
        ]}).then(message => {
            // Create a collector for the buttons
            const filter = i => (i.customId === 'wipe_confirm' || i.customId === 'wipe_cancel') && i.user.id === msg.author.id
            const collector = message.createMessageComponentCollector({ filter, time: 15000, max: 1 })
            collector.on('collect', async i => {
                if(i.customId === 'wipe_confirm') {
                    collection.findOneAndDelete({ userID })
                    .then(() => i.reply(`<@${userID}> was wiped from the database.`))
                    .catch(err => {
                        logger.error(err)

                        msg.channel.send({
                            embeds: [{
                                title: 'Error!',
                                description: `<@${userID}> could not be wiped from the database.`,
                                color: options.colors.error
                            }]
                        })
                    })
                } else if(i.customId === 'wipe_cancel') {
                    i.reply('Wipe cancelled.').catch(logger.error)
                }
            })

            collector.on('end', () => {
                message.edit({ embeds: [embed], components: []}).catch(logger.error)
            })
        })
    }
})