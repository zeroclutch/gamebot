// create Collection<Game> of all the games
import options from '../../config/options.js'
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'

import { TOURNAMENT_MODES } from '../../config/types.js'

import { choices } from '../../types/util/games.js'

import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    DiscordjsErrorCodes,
    PermissionsBitField
} from 'discord.js'

import BotCommand from '../../types/command/BotCommand.js'

const commandArgs = [{
    name: 'channel',
    type: ApplicationCommandOptionType.Channel,
    required: false,
    description: 'This is the channel where the join message will be hosted. It should have not have general send-message access.',
}, {
    name: 'startTime',
    type: ApplicationCommandOptionType.Channel,
    required: false,
    description: 'A parseable time string. This is the time when the tournament will start.',
}, {
    name: 'duration',
    type: ApplicationCommandOptionType.Integer,
    required: false,
    description: 'The number of minutes the tournament should run.',
    minimum: 1,
    maximum: 1440,
}, {
    name: 'games',
    type: ApplicationCommandOptionType.String,
    required: false,
    description: 'The allowed games by id, comma-separated.'
}, {
    name: 'mode',
    type: ApplicationCommandOptionType.String,
    required: false,
    description: 'The type of game, either `wins` or `cumulative`. Wins mode will provide 1 point for a loss and 3 for a win, while cumulative mode will carry over points between rounds. `wins` mode is default.',
}, {
    name: 'message',
    type: ApplicationCommandOptionType.String,
    required: false,
    description: 'A message to send with the join message.'
}]

export default new BotCommand({
    name: 'host',
    aliases: [],
    description: 'Host a tournament for a game.',
    category: 'mod',
    permissions: [GAMEBOT_PERMISSIONS.MOD],
    dmCommand: false,
    args: commandArgs,
    run: async function(msg, args) {
        // Ensure we have the correct permissions
        const me = await msg.guild.members.fetchMe()
        if(!me.permissions.has(PermissionsBitField.Flags.CreatePublicThreads)) {
            msg.reply({
                embeds: [{
                    title: 'Error!',
                    description: 'I do not have the correct permissions to host a tournament. Please ensure I have the `Create Public Threads` permission.',
                    color: options.colors.error
                }]
            })
            return
        }

        let [channel, startTime, duration, games, mode, message] = args

        function abortSetup() {
            msg.reply({
                embeds: [{
                    title: 'Error!',
                    description: 'Aborting setup.',
                    color: options.colors.error
                }]
            })
        }

        // Validate arguments
        msg.reply({
            embeds: [{
                title: 'Ready to host a tournament?',
                description: 'Starting interactive setup! Follow the steps below to host a tournament. To cancel, type `cancel` at any time.',
                color: options.colors.info
            }]
        })

        // Interactive setup
        const filter = m => m.author.id === msg.author.id

        // Get first message from user
        const getResponse = async () => (await msg.channel.awaitMessages({filter, max: 1, time: 60000})).first()?.content || ''

        // Get channel
        do {
            if(channel) {
                // Find the channel
                channel = channel.replace(/<#|>/g, '')
                try {
                    channel = await msg.client.channels.fetch(channel)
                } catch(e) {
                    channel = null
                }
            } else {
                msg.channel.send({
                    embeds: [{
                        title: 'Tournament Configuration: Channel',
                        description: 'Please enter the channel where the join message will be hosted. It should have not have general send-message access.',
                        color: options.colors.info
                    }]
                })

                channel = await getResponse()
                
                if(channel === 'cancel') {
                    abortSetup()
                    return
                }
            }
        } while(!channel || !channel.guild)

        do {
            // Find the start time
            startTime = new Date(startTime)

            if(isNaN(startTime.getTime())) {
                // Start time
                msg.channel.send({
                    embeds: [{
                        title: 'Start Time',
                        description: 'Please enter the time when the tournament will start. This must be a parseable time string. You can use [https://time.lol](https://time.lol) to get a time string.',
                        color: options.colors.info
                    }]
                })
                
                startTime = await getResponse()

                if(startTime === 'cancel') {
                    abortSetup()
                    return
                }
            }
        } while(!startTime || !startTime.getTime || isNaN(startTime.getTime()))

        // Get duration
        do {
            // Find the duration
            duration = parseInt(duration)

            if(isNaN(duration)) {
                msg.channel.send({
                    embeds: [{
                        title: 'Tournament Configuration: Duration',
                        description: 'Please enter the duration of the tournament in minutes.',
                        color: options.colors.info
                    }]
                })

                duration = await getResponse()

                if(duration === 'cancel') {
                    abortSetup()
                    return
                }
            }

        } while(isNaN(duration))

        do {
            if(games && games.split) {
                // Find the games
                games = games.split(',').map(game => game.trim())

                // Validate games
                const isValid = games.every(g => msg.client.games.find((_game, meta) => meta.id === g))

                if(!isValid) {
                    games = ''
                }

            } else {
                // Games
                msg.channel.send({
                    embeds: [{
                        title: 'Games',
                        description: 'Please enter the allowed games by id, comma-separated.',
                        color: options.colors.info
                    }]
                })

                games = await getResponse()

                if(games === 'cancel') {
                    abortSetup()
                    return
                }
            }

        } while(games.length === 0 || typeof games === 'string')

        do {
            if(mode && Object.values(TOURNAMENT_MODES).includes(mode)) {
                // Find the games
                mode = mode.toLowerCase()

            } else {
                // Games
                msg.channel.send({
                    embeds: [{
                        title: 'Mode',
                        description: 'Please enter the mode of the tournament, either `wins` or `cumulative`. `wins` mode will provide 1 point for a loss and 3 for a win, while `cumulative` mode will provide users with points that carry over between games. `wins` mode is default.',
                        color: options.colors.info
                    }]
                })

                mode = await getResponse()

                if(mode === 'cancel') {
                    abortSetup()
                    return
                }
            }
        } while(!(mode && Object.values(TOURNAMENT_MODES).includes(mode)))

        if(!message) {
            // Games
            msg.channel.send({
                embeds: [{
                    title: 'Message',
                    description: 'Optional: enter any additional content to be sent in the tournament message. This can be an event link, for example. If you do not want to send any additional content, type `none`.',
                    color: options.colors.info
                }]
            })

            message = await getResponse()

            if(message === 'cancel') {
                abortSetup()
                return
            }
        }

        if(message.toLowerCase() === 'none') {
            message = ''
        }

        // Find all games that are allowed
        let gameClasses = games.map(selection => 
            msg.client.games.find((_game, meta) => meta.id == selection || meta.name.toLowerCase() == selection)
        )
        gameClasses = gameClasses.filter(game => game !== undefined)
        
        let gameNames = []
        let configurations = {}

        // For each game, perform the setup
        for(const gameClass of gameClasses) {
            const instance = new gameClass(msg)

            msg.channel.send('Setting up ' + instance.metadata.name + '...')

            // Add the name to the list
            gameNames.push(instance.metadata.name)
            
            // Generate the game-specific option lists
            await instance.generateOptions()

            instance.gameOptions = instance.gameOptions ?? []

            // Add custom game options for player count configuration
            const min = instance.metadata.playerCount.min
            const max = instance.metadata.playerCount.max
            instance.gameOptions.push({
                friendlyName: 'Minimum Players',
                type: 'number',
                default: min,
                note: `Enter a new value of players, between ${min}-${max}. This must be less than or equal to than the maximum players.`,
                filter: m => parseInt(m.content) >= min && parseInt(m.content) <= max
            })

            instance.gameOptions.push({
                friendlyName: 'Maximum Players',
                type: 'number',
                default: max,
                note: `Enter a new value of players, between ${min}-${max}. This must be greater than or equal to the minimum players.`,
                filter: m => parseInt(m.content) >= min && parseInt(m.content) <= max
            })

            instance.stage = 'options'
            // Allow this host to configure options. Configured options will be outputted to instance.options
            await instance.configureOptions()

            configurations[instance.metadata.id] = instance.options
        }

        // Send confirmation message
        const awaitConfirmation = () => new Promise(async (resolve, reject) => {
            let setupConfirmation = await msg.channel.send({
                embeds: [{
                    title: 'Tournament Setup Complete',
                    description: 'The tournament has been set up. Please confirm that you would like to start the tournament.',
                    color: options.colors.info,
                    fields: [
                        {
                            name: 'Games',
                            value: gameNames.join(', '),
                            inline: true
                        },
                        {
                            name: 'Duration',
                            value: duration + ' minutes',
                            inline: true
                        },
                        {
                            name: 'Mode',
                            value: mode,
                            inline: true
                        },
                        {
                            name: 'Message',
                            value: message || 'No message.',
                            inline: true
                        }
                    ]
                }],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm')
                            .setLabel('Confirm')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('cancel')
                            .setLabel('Cancel')
                            .setStyle(ButtonStyle.Danger)
                    )
                ]
            })

            // Create a listener for the confirmation
            const filter = i => i.customId === 'confirm' || i.customId === 'cancel' && i.user.id === msg.author.id
            const collector = msg.channel.createMessageComponentCollector({ filter, time: 60000 })

            collector.on('collect', async i => {
                if(i.customId === 'confirm') {
                    i.reply('Tournament confirmed. Sending initial message...')
                    resolve(true)
                } else {
                    i.reply('Tournament cancelled.')
                    resolve(false)
                }

                setupConfirmation.edit({
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('confirm')
                                .setLabel('Confirm')
                                .setStyle(ButtonStyle.Success)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('cancel')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Danger)
                                .setDisabled(true)
                        )
                    ]
                })
            })

            collector.on('end', async collected => {
                resolve(false)
            })
        })

        const result = await awaitConfirmation()

        if(!result) {
            return
        }


        // Send tournament message
        const joinMessage = await channel.send({
            content: message,
            embeds: [{
                title: 'A tournament is starting!',
                description: `A tournament for **${gameNames.join(', ')}** is starting in this server! The tournament will start <t:${Math.floor(startTime.getTime() / 1000)}:R> and last for **${duration} minutes**.`,
                color: options.colors.info,
                image: {
                    url: 'https://i.imgur.com/6I4CTZY.png'
                }
            }]
        })

        // Register the tournament to the client
        msg.client.tournaments.set(joinMessage.id, {
            id: joinMessage.id,
            guild: msg.guild.id,
            channel: channel.id,
            startTime: startTime.getTime(),
            duration: duration * 60 * 1000,
            games,
            mode,
            configurations
        })
    }
})