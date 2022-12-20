import assert from 'node:assert/strict'

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Collection, ThreadAutoArchiveDuration } from 'discord.js'
import TournamentManager from './TournamentManager.js'

import logger from 'gamebot/logger'
import options from '../../config/options.js'
import { TOURNAMENT_MODES } from '../../config/types.js'

/**
 * @typedef {Object} JoinableMatch
 * @property {string} id The id of the game
 * @property {TextBasedChannel} channel The id of the channel the match is in
 * @property {Collection} players The players in the match
 * @property {Game} game The instantiable game class for the match
 */

class Tournament {
    constructor(options, manager, client) {
        this.id = options.id
        this.options = options

        this.JOIN_TIMEOUT = 15
        this.SCOREBOARD_UPDATE_INTERVAL = 30 

        this.manager = manager
        this.client = client

        assert.strictEqual(typeof this.id, 'string', 'Tournament id must be a Snowflake')
        assert.strictEqual(typeof this.options.channel, 'string', 'Tournament channel must be a Snowflake')
        assert.strictEqual(typeof this.options.guild, 'string', 'Tournament guild must be a Snowflake')
        assert.strictEqual(typeof this.options, 'object', 'Tournament options must be an object')
        assert.strictEqual(typeof this.options.startTime, 'number', 'Tournament startTime must be a timestamp')
        assert.strictEqual(typeof this.options.duration, 'number', 'Tournament duration must be a number')
        assert.strictEqual(typeof this.options.games, 'object', 'Tournament games must be an object')
        assert.strictEqual(typeof this.options.configurations, 'object', 'Tournament configurations must be an object')
        assert.strictEqual(this.manager instanceof TournamentManager, true, 'Tournament manager must be a TournamentManager')

        /**
         * The games that are being played in this tournament.
         * @type {Map<Snowflake, Game>}
         */
        this.games = new Map()

        /**
         * The players that are in this tournament.
         * @type {Map<Snowflake, GuildMember|object>}
         */
        this.players = new Map()

        /**
         * The scoreboard for this tournament.
         * @type {Map<Snowflake, number>}
         */
        this.scoreboard = new Map()

        // Average player join time
        this.averagePlayerJoinTime = 0
        this.playerJoinCount = 0
        this.lastPlayerJoinTime = Date.now()

        // Tournament information
        this.gameInfo = {}
        this.joinableMatches = {}

        this.nextGameId = 1

        this.scores = Object.freeze({
            streak: 4,
            win: 3,
            draw: 2,
            loss: 1,
        })

        this.guild = null
        this.channel = null
        this.message = null
        this.messageUpdateInterval = null

        this.startTime = -1

        this.threadNames = ['Adventurous', 'Amazing', 'Amusing', 'Awesome', 'Big', 'Bewitching',
        'Captivating', 'Charming', 'Cool', 'Compelling', 'Delightful', 'Dramatic', 'Epic',
        'Enchanting', 'Enthralling', 'Exciting', 'Fantastic', 'Fascinating', 'Festive', 'Garbage',
        'Glamorous', 'Gleeful', 'Glorious', 'Graceful', 'Grand', 'Great', 'Gripping', 'Hilarious',
        'Humorous', 'Imaginative', 'Inspiring', 'Intense', 'Intriguing', 'Involving', 'Joyful',
        'Legendary', 'Magnificent', 'Majestic', 'Marvelous', 'Mesmerizing', 'Mighty', 'Mirthful',
        'Monstrous', 'Mythic', 'Noble', 'Notable', 'Noteworthy', 'Odd', 'Outstanding', 'Peculiar',
        'Phenomenal', 'Pleasant', 'Pleasurable', 'Pleasing', 'Precious', 'Prestigious', 'Questionable',
        'Rare', 'Rapturous', 'Remarkable', 'Resplendent', 'Rousing', 'Satisfying', 'Sensational',
        'Sensuous', 'Spectacular', 'Splendid', 'Stimulating', 'Stirring', 'Strange', 'Superb',
        'Superior', 'Tremendous', 'Unbelievable', 'Uncommon', 'Unfathomable', 'Unheard Of', 'Unimaginable',
        'Unlikely', 'Unparalleled', 'Unprecedented', 'Unrivaled', 'Unsurpassed', 'Unusual', 'Unforgettable',
        'Unique', 'Unrivaled', 'Uplifting', 'Venerable', 'Vibrant', 'Vivacious', 'Witty', 'Wondrous',
        'Worthy', 'Wow', 'Zany', 'Zealous', 'Zestful']
    }

    updateAverageJoinTime() {
        let newTime = Date.now() - this.lastPlayerJoinTime
        this.lastPlayerJoinTime = Date.now()
        this.averagePlayerJoinTime = (this.averagePlayerJoinTime * this.playerJoinCount + newTime) / (this.playerJoinCount + 1)
        this.playerJoinCount++
    }

    shuffleThreadNames() {
        // Shuffle this.threadNames array
        return this.threadNames.sort(() => Math.random() - 0.5)
    }


    getThreadName(id) {
        return this.threadNames[id % this.threadNames.length]
    }

    async handleJoin(i) {
        // Ensure the user is not currently in a game
        const isCurrentlyInGame = this.players.get(i.user.id) && this.players.get(i.user.id).game
        const isCurrentlyAwaitingGame = Object.values(this.joinableMatches).some(game => game && game.players && game.players.find(u => u.id === i.user.id))

        if(isCurrentlyInGame || isCurrentlyAwaitingGame) {
            await i.reply({
                content: `You are already in a game!`,
                ephemeral: true
            })
            return
        }

        // Ensure the user is able to view threads in the channel

        // Update the average player join time
        this.updateAverageJoinTime()

        // Find the game furthest from the minimum player count
        let gameScores = Object.entries(this.joinableMatches)
        .map(([id, game]) => {
            if(!game.channel) {
                return {
                    id,
                    score: 0,
                }
            } else {
                return {
                    id,
                    score: this.joinableMatches[id].players.length / this.gameInfo[id].metadata.playerCount.min
                }
            }
        })
        .sort((a, b) => {
            return a.score - b.score
        })

        let gameToJoin = gameScores[0]

        if(!gameToJoin) {
            // There are no games that can be joined, the tournament is over.
            i.reply({
                content: 'The tournament is over! Thanks for playing!',
                ephemeral: true
            })
            return false
        }

        let gameInfo = this.gameInfo[gameToJoin.id]

        if(!this.joinableMatches[gameToJoin.id]) {
            throw new Error(`An invalid game was attempted to be loaded.`)
        }

        if(!this.joinableMatches[gameToJoin.id].channel) {
            // Create a new thread
            const adjective = this.getThreadName(this.nextGameId)
            let threadName = `Tournament - `
            if(adjective[0].match(/[aeiou]/i)) {
                threadName += `An `
            } else {
                threadName += `A `
            }
            threadName += `${adjective} Match`

            const thread = await this.channel.threads.create({
                name: threadName,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
                reason: `Match thread for game ${this.nextGameId}`,
                type: ChannelType.PublicThread,
            })

            // Delete the starter message
            thread.fetchStarterMessage().then(msg => {
                if(msg) {
                    msg.delete()
                }
            }).catch(e => {
                // Do nothing, the message doesn't exist
            })

            if(this.averagePlayerJoinTime !== 0) {
                const timeToWait = Math.round((Math.round(this.averagePlayerJoinTime * gameInfo.metadata.playerCount.min / 1000) + this.JOIN_TIMEOUT) / 10) * 10
                await thread.send({
                    content: `The game will begin once enough players have joined! You can expect to wait around ${timeToWait} seconds.`,
                })
            } else {
                await thread.send({
                    content: `The game will begin once enough players have joined!`,
                })
            }

            // Create a new game
            this.joinableMatches[gameToJoin.id] = {
                id: this.nextGameId,
                channel: thread,
                players: [],
                game: gameInfo.metadata.id,
            }

            this.nextGameId++
        }

        // Send user to game
        // TODO: Potential issue, when a new game is created, will the reference of "game" be updated?
        await i.reply({
            content: `Click the link to join the game! ${this.joinableMatches[gameToJoin.id].channel}`,
            ephemeral: true,
        })

        // Add user to game
        this.joinableMatches[gameToJoin.id].channel.members.add(i.user.id)

        this.joinableMatches[gameToJoin.id].players.push(i.user)
        this.players.set(i.user.id, i.user)

        // Check if the game can be started
        const playerCount = this.joinableMatches[gameToJoin.id].players.length
        const minPlayers = gameInfo.metadata.playerCount.min
        const maxPlayers = gameInfo.metadata.playerCount.max

        if(playerCount === maxPlayers) {
            // Start game immediately
            this.startGame(this.joinableMatches[gameToJoin.id])

            // Remove game from this.joinableMatches
            this.joinableMatches[gameToJoin.id] = {}
        } else if(playerCount >= minPlayers) {
            // Add a grace period allowing more players to join
            let id = this.joinableMatches[gameToJoin.id].id

            if(!this.joinableMatches[gameToJoin.id].timeout) {

                this.joinableMatches[gameToJoin.id].channel.send({
                    content: `Last call for more players! The **${gameInfo.metadata.name}** game will begin within ${this.JOIN_TIMEOUT} seconds!`,
                })

                this.joinableMatches[gameToJoin.id].timeout = setTimeout(() => {
                    if(this.joinableMatches[gameToJoin.id]?.id !== id) {
                        // Game has already been started
                        return
                    }
                    this.startGame(this.joinableMatches[gameToJoin.id])

                    // Remove game from this.joinableMatches
                    this.joinableMatches[gameInfo.metadata.id] = {}
                }, this.JOIN_TIMEOUT * 1000)
            }
        } else {
            // Not enough players to start the game. Do nothing.
        }
    }

    get _scoreboard() {
        return Array.from(this.scoreboard.entries())
        .sort((a, b) => {
            return b[1] - a[1]
        })

    }

    renderScoreboard() {
        const scoreboard = this._scoreboard
        .map(([id, score], index) => {
            if(index < 5) return `**${index + 1}.** <@${id}> - ${score} points`
            else return ``
        })

        if(scoreboard.length === 0) {
            scoreboard.push(`No players have joined yet!`)
        } else if (scoreboard.length > 5) {
            let plural = scoreboard.length - 5 === 1 ? '' : 's'
            scoreboard.push(`**...${scoreboard.length - 5} player${plural}**`)
        }

        return scoreboard.join('\n')
    }

    handleMyScore(i) {
        if(this.players.get(i.user.id)) {
            i.reply({
                content: `You have ${this.scoreboard.get(i.user.id) ?? 0} points! That puts you at **#${(this._scoreboard.findIndex(([id]) => id === i.user.id) + 1) || '?'}**!`,
                ephemeral: true,
            })
        } else {
            i.reply({
                content: `You are not in the tournament!`,
                ephemeral: true,
            })
        }
    }

    async updateMessage() {
        const endTime = (this.startTime + this.options.duration) / 1000
        this.message.edit({
            embeds: [{
                title: `Tournament: ${Object.values(this.gameInfo).map(game => game.metadata.name).join(', ')}`,
                description: `Click the button below to be added to the tournament queue! The tournament will end <t:${Math.floor(endTime)}:R>.`,
                color: options.colors.info,
                fields: [{
                    name: 'Scoreboard',
                    value: this.renderScoreboard(),
                    inline: false,
                }],
                footer: {
                    text: `The scoreboard will be updated every ${Math.floor(this.SCOREBOARD_UPDATE_INTERVAL)} seconds.`
                }
            }],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('tournament-join')
                        .setLabel('Join')
                        .setStyle(ButtonStyle.Primary)
                )
            ]
        })
    }

    async initialize() {
        // Delete the tournament from the manager
        // The manager no longer needs to track started tournaments
        this.manager.delete(this.id)

        // Update the start time
        this.startTime = Date.now()

        // Resolve guild, channel, and message
        try {
            this.guild = await this.client.guilds.resolve(this.options.guild)
            this.channel = await this.guild.channels.resolve(this.options.channel)
        } catch (err) {
            // If the message is not found, stop the tournament
            return
        }

        // Setup thread names
        this.shuffleThreadNames()
        
        // Construct the gameInfo and joinableMatches objects
        this.options.games.forEach(id => {
            for (let [metadata, game] of this.client.games) {
                if(metadata.id === id) {
                    this.gameInfo[metadata.id] = {
                        metadata: {
                            ...metadata,
                            playerCount: {
                                min: this.options.configurations[id]['Minimum Players'],
                                max: this.options.configurations[id]['Maximum Players'],
                            }
                        },
                        game,
                    }

                    this.joinableMatches[metadata.id] = {}
                }
            }
        })

        // Update the message
        try {
            const endTime = (this.startTime + this.options.duration) / 1000
            this.message = await this.channel.send({
                embeds: [{
                    title: `Tournament: ${Object.values(this.gameInfo).map(game => game.metadata.name).join(', ')}`,
                    description: `Click the button below to be added to the tournament queue! The tournament will end <t:${Math.floor(endTime)}:R>.`,
                    color: options.colors.info,
                    fields: [{
                        name: 'Scoreboard',
                        value: this.renderScoreboard(),
                        inline: false,
                    }],
                    footer: {
                        text: `The scoreboard will be updated every ${Math.floor(this.SCOREBOARD_UPDATE_INTERVAL)} seconds.`
                    }
                }],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('tournament-join')
                            .setLabel('Join')
                            .setStyle(ButtonStyle.Primary)
                    )
                ]
            })
            this.messageUpdateInterval = setInterval(this.updateMessage.bind(this), this.SCOREBOARD_UPDATE_INTERVAL * 1000)
        } catch (err) {
            logger.error(err, `Failed to update tournament message`)
        }

        // Create a listener on the button
        const filter = i => i.customId === 'tournament-join' && i.user.id !== this.client.user.id
        const collector = this.message.createMessageComponentCollector({ filter, time: this.options.duration })

        collector.on('collect', this.handleJoin.bind(this))

        collector.on('end', collected => {
            // End the tournament
            this.endTournament()
        })
    }

    async startGame({ id, channel, players, game }) {

        let msg = await channel.send({
            content: `**Starting now!** The players are ${players.map(player => `<@${player.id}>`).join(', ')}!`
        })

        // Allow new players to get ready
        await this.sleep(3000)

        const gameClass = this.client.games.find((_game, meta) => game === meta.id) 

        // Start game
        const instance = this.client.gameManager.start(gameClass, msg, { skipInit: true })

        // Configure options
        instance.options = this.options.configurations[game]

        // Add players to the game silently
        for (let player of players) {
            await instance.addPlayer(player.id, null)
            
            // Add the game to the player
            player.game = instance
        }

        await instance.updatePlayers(true)

        // Add game to the tournament
        this.games.set(channel.id, instance)

        // Create a listener on the end event
        instance.on('end', function (winners) {
            // End game
            this.endGame(channel.id, players, winners)
        }.bind(this))

        try {
            instance.play()
            instance.gameInit()
        } catch (err) {
            this.client.emit('error', err, this.client, msg)
    
            // End game on error to prevent channel freezing
            this.client.gameManager.stop(channel.id)
        }
    }

    async endGame(id, players, winners) {
        // Remove the game from the tournament
        const game = this.games.get(id)

        // Remove the game from the player
        players.forEach(player => {
            player.game = null
        })

        winners = [winners].flat()

        game.players.forEach(player => {
            // Remove the game from the player
            const user = this.players.get(player.user.id)
            user.game = null

            // Update the scores
            let score = this.scoreboard.get(player.user.id) || 0

            if(this.options.mode === TOURNAMENT_MODES.WINS) {
                if(winners.find(w => w.user.id === user.id)) {
                    this.scoreboard.set(player.user.id, score + this.scores.win)
                } else {
                    this.scoreboard.set(player.user.id, score + this.scores.loss)
                }
            } else if(this.options.mode === TOURNAMENT_MODES.CUMULATIVE) {
                let newScore = player.score || 0
                this.scoreboard.set(player.user.id, score + newScore)
            } else {
                throw new Error('Unknown tournament mode ' + this.options.mode) 
            }
        })

        // Send current user scores
        const message = await game.channel.send({
            embeds: [{
                title: `Scoreboard`,
                color: options.colors.info,
                description: `${game.players.map(p => `${p.user} - ${this.scoreboard.get(p.user.id) || 0} points`).join('\n')}\n\nTo join a new game, click the button below!`,
            }], 
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('tournament-join')
                        .setLabel('Join a new game!')
                        .setStyle(ButtonStyle.Primary)
                )
            ]
        })

        message.createMessageComponentCollector({
            filter: i => i.customId === 'tournament-join',
            time: 120 * 1000,
        })
        .on('collect', this.handleJoin.bind(this))
        .on('end', () => {
            // Edit the message
            message.edit({
                embeds: [{
                    title: `Scoreboard`,
                    color: options.colors.info,
                    description: `${game.players.map(p => `${p.user} - ${this.scoreboard.get(p.user.id)} points`).join('\n')}\n\nJoin a new match from the join button in ${this.channel}`,
                }],
                components: []
            })
        })

        // Remove the game from the tournament
        this.games.delete(id)
    }

    async endTournament() {
        // Clear the scoreboard update interval
        clearInterval(this.messageUpdateInterval)

        // Prevent players from joining
        this.joinableMatches = {}

        const endMessageEmbeds = () => [{
            title: `The tournament has ended!`,
            color: options.colors.info,
            description: `Thanks for playing!`,
            fields: [{
                name: `Scoreboard`,
                value: `${this.renderScoreboard()}`,
            }]
        }]

        const endMessageComponents = () => [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('tournament-my-score')
                    .setLabel('View my score')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel('Add Gamebot to your server!')
                    .setStyle(ButtonStyle.Link)
                    .setURL(process.env.BASE_URL)
            )
        ]

        this.message.edit({
            embeds: [{
                title: `Tournament is ending!`,
                color: options.colors.info,
                description: `Waiting for all games to finish...`,
                fields: [{
                    name: `Scoreboard`,
                    value: `${this.renderScoreboard()}`,
                }]
            }],
            components: endMessageComponents()
        })

        this.message.createMessageComponentCollector({
            filter: i => i.customId === 'tournament-my-score',
            time: 20 * 60 * 1000,
        })
        .on('collect', this.handleMyScore.bind(this))
        .on('end', () => {
            // Edit the message
            this.message.edit({
                embeds: endMessageEmbeds(),
                components: []
            })
        })

        // Wait for all games to end
        while(this.games.size > 0) {
            await this.sleep(1000)
        }

        // End the tournament
        this.message.edit({
            embeds: endMessageEmbeds(),
            components: endMessageComponents()
        })
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

}

export default Tournament