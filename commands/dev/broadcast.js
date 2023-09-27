import BotCommand from '../../types/command/BotCommand.js'
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonStyle, Message } from 'discord.js'
import options from '../../config/options.js'
import { ButtonBuilder } from '@discordjs/builders'

export default new BotCommand({
    name: 'phrase',
    aliases: ['broadcast'],
    description: 'Sets the end message',
    category: 'dev',
    permissions: [GAMEBOT_PERMISSIONS.OWNER],
    dmCommand: true,
    args: [{
        name: 'action',
        type: ApplicationCommandOptionType.String,
        required: true,
        description: `The action to take:
- \`list\` lists the current active messages
- \`add\` lists the current active messages
- \`delete\` deletes an item from the list
- \`broadcast\` sets the global broadcast message`,
    }],
    /**
     * @param {Message} msg 
     * @param {Array} args 
     */
    run: async function(msg, args) {
        let action = args[0]
        let phrase = args.slice(1).join(' ')

        const collection = msg.client.database.collection('status')
        let list = await collection.findOne({ type: 'phrases' })

        const confirm = (message) => {
            return new Promise((resolve, reject) => {
                const filter = i => i.customId && i.user.id === msg.author.id
                msg.reply({
                    content: message,
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                            new ButtonBuilder()
                                .setCustomId('confirm')
                                .setLabel('Confirm')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId('cancel')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Secondary),
                            )
                    ],
                })
                .then(m => m.awaitMessageComponent({ filter, time: 60_000 }))
                .then(resolve)
            })
        }

        switch(action.toLowerCase()) {
            default:
            case 'list':
                msg.reply({
                    embeds: [{
                        title: 'End Phrases',
                        fields: [{
                            name: 'Phrase list',
                            value: list.phrases.map((phrase, i) => `**[${i + 1}]** ${phrase}`).join('\n\n')
                        },
                        {
                            name: 'Broadcast phrase',
                            value: list.broadcastPhrase || '*No broadcast phrase set*'
                        }],
                        color: options.colors.info
                    }]
                })
                break
            case 'add':
                confirm(`Are you sure you'd like to add the following phrase?\n\n"${phrase}"`)
                .then(i => {
                    // Confirm action
                    if(i.customId === 'confirm') {
                        collection.updateOne(
                            { type: 'phrases' },
                            { $push: { phrases: phrase } }
                        ).then(() => i.reply('Added phrase!'))
                    } else if(i.customId === 'cancel') {
                        i.reply('Phrase not added.')
                    }
                })

                break
            case 'delete':
                let index = parseInt(args[1]) - 1

                if(!isNaN(index) || list?.phrases[index]) {
                    confirm(`Are you sure you'd like to delete the following phrase?\n\n"${list.phrases[index]}"`)
                    .then(i => {
                        if(i.customId === 'confirm') {
                            // Remove and update the database
                            list.phrases.splice(index, 1)
                            collection.updateOne(
                                { type: 'phrases' },
                                { $set: { phrases: list.phrases } }
                            ).then(() => i.reply('Deleted phrase!'))
                        } else if(i.customId === 'cancel') {
                            i.reply('Phrase not deleted.')
                        }
                    })
                } else {
                    msg.channel.send(`Invalid phrase index to delete.`)
                }
                
                break
            case 'broadcast':
                let confirmationMessage = `Are you sure you'd like to broadcast the following phrase?\n\n"${phrase}"`
                if(!phrase) {
                    confirmationMessage = `Are you sure you'd like to reset the broadcast message?`
                }
                
                confirm(confirmationMessage)
                .then(i => {
                    // Confirm action
                    if(i.customId === 'confirm') {
                        collection.updateOne(
                            { type: 'phrases' },
                            { $set: { broadcastPhrase: phrase } }
                        ).then(() => i.reply('Broadcast phrase set!'))
                    } else if(i.customId === 'cancel') {
                        i.reply('Phrase not broadcast.')
                    }
                })

                break
        }
    }
})