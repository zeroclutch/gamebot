// create Collection<Game> of all the games
import options from '../../config/options.js'

import { choices } from '../../types/util/games.js'

import { ApplicationCommandOptionType } from 'discord.js'

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
    games: 'games',
    type: ApplicationCommandOptionType.String,
    required: false,
    description: 'The allowed games by id, comma-separated.'
}]

export default new BotCommand({
    name: 'host',
    aliases: [],
    description: 'Host a tournament for a game.',
    category: 'mod',
    permissions: [],
    dmCommand: true,
    args: commandArgs,
    run: async function(msg, args) {
        let channel, startTime, duration, games
        let invalidArgs = false

        function abortSetup() {
            msg.reply({
                embeds: [{
                    title: 'Error!',
                    description: 'Aborting setup.',
                    color: options.colors.error
                }]
            })
        }

        do {
            // Reset invalidArgs to false
            invalidArgs = false

            if(args.length === commandArgs.length) {
                channel = args[0]
                startTime = args[1]
                duration = args[2]
                games = args[3]
            } else {
                invalidArgs = true
            }

            // Find the channel
            channel = await msg.client.channels.fetch(channel)
            if(!channel) invalidArgs = true 

            // Find the start time
            startTime = new Date(startTime)
            if(isNaN(startTime.getTime())) invalidArgs = true

            // Find the duration
            duration = parseInt(duration)
            if(isNaN(duration)) invalidArgs = true

            // Find the games
            games = games.split(',').map(game => game.trim())
            if(games.length === 0) invalidArgs = true


            if(invalidArgs) {

                // Validate arguments
                msg.reply({
                    embeds: [{
                        title: 'Error!',
                        description: 'Starting interactive setup.',
                        color: options.colors.error
                    }]
                })

                // Interactive setup
                const filter = m => m.author.id === msg.author.id
                let collected

                // Channel
                msg.channel.send({
                    embeds: [{
                        title: 'Channel',
                        description: 'Please enter the channel where the join message will be hosted. It should have not have general send-message access.',
                        color: options.colors.info
                    }]
                })

                collected = await msg.channel.awaitMessages({filter, max: 1, time: 60000})
                if(collected.size === 1) {
                    args[0] = collected.first().content
                } else {
                    abortSetup()
                    return
                }

                // Start time
                msg.channel.send({
                    embeds: [{
                        title: 'Start Time',
                        description: 'Please enter the time when the tournament will start.',
                        color: options.colors.info
                    }]
                })

                collected = await msg.channel.awaitMessages({filter, max: 1, time: 60000})
                if(collected.size === 1) {
                    args[1] = collected.first().content
                } else {
                    abortSetup()
                    return
                }

                // Duration
                msg.channel.send({
                    embeds: [{
                        title: 'Duration',
                        description: 'Please enter the number of minutes the tournament should run.',
                        color: options.colors.info
                    }]
                })

                collected = await msg.channel.awaitMessages({filter, max: 1, time: 60000})
                if(collected.size === 1) {
                    args[2] = collected.first().content
                } else {
                    abortSetup()
                    return
                }

                // Games
                msg.channel.send({
                    embeds: [{
                        title: 'Games',
                        description: 'Please enter the allowed games by id, comma-separated.',
                        color: options.colors.info
                    }]
                })

                collected = await msg.channel.awaitMessages({filter, max: 1, time: 60000})
                if(collected.size === 1) {
                    args[3] = collected.first().content
                } else {
                    abortSetup()
                    return
                }
            }

        } while(invalidArgs)
    

        
        const game = msg.client.games.find((_game, meta) => meta.id == selection || meta.name.toLowerCase() == selection)

        // Find all games that are allowed
        games = games.map(selection => 
            msg.client.games.find((_game, meta) => meta.id == selection || meta.name.toLowerCase() == selection)
        )
        games = games.filter(game => game !== undefined)
        
        let configurations = []

        // For each game, perform the setup
        for(const game of games) {
            const instance = new game(msg)
            
            // Generate the game-specific option lists
            await instance.generateOptions()
            
            if(instance.gameOptions) {
                instance.stage = 'options'
                // Allow game leader to configure options. Configured options will be outputted to this.options
                await instance.configureOptions()
            }

            configurations.push(instance.options)
            console.log(configurations)
        }

        // Create the tournament
        channel.send({
            embeds: [{
                title: 'Tournament',
                description: `A **${games.map(game => game.metadata.name).join(' ')}** tournament has been created by ${msg.author}! React with ${options.emojis.join} to join! The tournament will start at <t:${Math.floor(startTime.getUTCMilliseconds() / 1000)}:R> and last for ${duration} minutes. Click below to join the tournament!`,
                color: options.colors.info
            }]
        })
    }
})