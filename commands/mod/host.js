// create Collection<Game> of all the games
import options from '../../config/options.js'
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'

import { choices } from '../../types/util/games.js'

import {
    ApplicationCommandOptionType,
    PermissionFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
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
        if(!msg.guild.me.permissions.has(PermissionFlags.CreatePublicThreads)) {
            msg.reply({
                embeds: [{
                    title: 'Error!',
                    description: 'I do not have the correct permissions to host a tournament. Please ensure I have the `Create Public Threads` permission.',
                    color: options.colors.error
                }]
            })
            return
        }

        let [channel, startTime, duration, games, message] = args

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
        const getResponse = async () => (await msg.channel.awaitMessages({filter, max: 1, time: 60000})).first()?.content

        // Get channel
        do {
            if(channel) {
                // Find the channel
                channel = channel.replace(/<#|>/g, '')
                channel = await msg.client.channels.fetch(channel)
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

                if(message.toLowerCase() === 'none') {
                    message = ''
                } else if(message === 'cancel') {
                    abortSetup()
                    return
                }
            }
        } while(typeof games !== 'string')

        // Find all games that are allowed
        games = games.map(selection => 
            msg.client.games.find((_game, meta) => meta.id == selection || meta.name.toLowerCase() == selection)
        )
        games = games.filter(game => game !== undefined)
        
        let configurations = {}

        // For each game, perform the setup
        for(const game of games) {
            const instance = new game(msg)
            
            // Generate the game-specific option lists
            await instance.generateOptions()
            
            if(instance.gameOptions) {
                instance.stage = 'options'
                // Allow this host to configure options. Configured options will be outputted to instance.options
                await instance.configureOptions()
            }

            configurations[instance.metadata.name] = instance.options
        }

        // Send tournament message
        const joinMessage = await channel.send({
            content: message,
            embeds: [{
                title: 'A tournament is starting!',
                description: `A **${Object.keys(configurations).join(', ')}** tournament is starting in this server! The tournament will start <t:${Math.floor(startTime.getTime() / 1000)}:R> and last for **${duration} minutes**.`,
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
            games: games.map(game => game.metadata.id),
            configurations
        })
    }
})