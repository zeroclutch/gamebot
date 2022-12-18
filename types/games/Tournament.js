import assert from 'node:assert/strict'

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } from 'discord.js'
import TournamentManager from './TournamentManager.js'

import logger from 'gamebot/logger'
import options from '../../config/options.js'

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

        // Average player join time
        this.averagePlayerJoinTime = Infinity
        this.playerJoinCount = 0
        this.lastPlayerJoinTime = Date.now()

        // Tournament information
        this.gameInfo = {}
        this.joinableMatches = {}

        this.scores = Object.freeze({
            streak: 4,
            win: 3,
            draw: 2,
            loss: 1,
        })
    }

    

    updateAverageJoinTime() {
        let newTime = Date.now() - this.lastPlayerJoinTime
        this.lastPlayerJoinTime = Date.now()
        this.averagePlayerJoinTime = (this.averagePlayerJoinTime * this.playerJoinCount + newTime) / (this.playerJoinCount + 1)
        this.playerJoinCount++
    }

    async initialize() {
        // Delete the tournament from the manager
        // The manager no longer needs to track started tournaments
        this.manager.delete(this.id)

        // Resolve guild, channel, and message
        try {
            this.guild = await this.client.guilds.resolve(this.options.guild)
            this.channel = await this.guild.channels.resolve(this.options.channel)
        } catch (err) {
            // If the message is not found, stop the tournament
            return
        }

        // Collect game information
        let nextGameId = 1
        
        this.options.games.forEach(id => {
            for (let [metadata, game] of this.client.games) {
                if(metadata.id === id) {
                    this.gameInfo[metadata.id] = {
                        metadata,
                        game,
                    }

                    this.joinableMatches[metadata.id] = {}
                }
            }
        })

        // Update the message
        try {
            this.message = await this.channel.send({
                embeds: [{
                    title: `Tournament: ${this.options.games.join(', ')}`,
                    description: `Click the button below to be added to the tournament queue!`,
                    color: options.colors.info
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
        } catch (err) {
            logger.error(err, `Failed to update tournament message`)
        }

        // Create a listener on the button
        const filter = i => i.customId === 'tournament-join' && i.user.id !== this.client.user.id
        const collector = this.message.createMessageComponentCollector({ filter, time: this.options.duration })

        collector.on('collect', async i => {
            // Ensure the user is not currently in a game
            const isCurrentlyInGame = this.players.get(i.user.id) && this.players.get(i.user.id).game
            const isCurrentlyAwaitingGame = Object.values(this.joinableMatches).some(game => game.players && game.players.find(u => u.id === i.user.id))

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
            let game = this.joinableMatches[gameToJoin.id]
            let gameInfo = this.gameInfo[gameToJoin.id]

            if(!game) {
                throw new Error(`An invalid game was attempted to be loaded.`)
            }

            if(!game.channel) {
                // Create a new thread
                const thread = await this.message.startThread({
                    name: `Tournament - Game ${nextGameId}`,
                    autoArchiveDuration: 60,
                    reason: `Tournament Thread`,
                })

                if(this.averagePlayerJoinTime !== Infinity) {
                    await thread.send({
                        content: `The game will begin once enough players have joined!\n\n
                        Approximate wait time: ${Math.floor((Date.now() + this.averagePlayerJoinTime * (gameInfo.metadata.playerCount.min - 1)) / 1000)} seconds!`,
                    })
                } else {
                    await thread.send({
                        content: `The game will begin once enough players have joined!`,
                    })
                }

                // Create a new game
                this.joinableMatches[gameToJoin.id] = {
                    id: nextGameId,
                    channel: thread,
                    players: [],
                    game: gameInfo.metadata.id,
                }

                nextGameId++
            }

            // Send user to game
            // TODO: Potential issue, when a new game is created, will the reference of "game" be updated?
            await i.reply({
                content: `Click the link to join the game! ${this.joinableMatches[gameToJoin.id].channel}`,
                ephemeral: true,
            })

            this.joinableMatches[gameToJoin.id].players.push(i.member)
            this.players.set(i.member.id, i.member)

            // Check if the game can be started
            const playerCount = this.joinableMatches[gameToJoin.id].players.length
            const minPlayers = gameInfo.metadata.playerCount.min
            const maxPlayers = gameInfo.metadata.playerCount.max

            if(playerCount === maxPlayers) {
                // Start game immediately
                this.startGame(this.joinableMatches[gameToJoin.id])

                // Remove game from this.joinableMatches
                this.joinableMatches[gameToJoin.id] = null
            } else if(playerCount >= minPlayers) {
                // Start game immediately
                // TODO: Add a grace period allowing more players to join
                this.startGame(this.joinableMatches[gameToJoin.id])

                // Remove game from this.joinableMatches
                this.joinableMatches[gameInfo.metadata.id] = null
            } else {
                // Not enough players to start the game. Do nothing.
            }
            
        })

        collector.on('end', collected => {
            // End the tournament
        })
    }

    async startGame({ id, channel, players, game }) {

        let msg = await channel.send({
            content: `The game has started!`,
        })

        const gameClass = this.client.games.find((_game, meta) => game === meta.id) 

        // Start game
        const instance = this.client.gameManager.start(gameClass, msg, { skipInit: true })

        // Configure options
        instance.options = this.options.configurations[game]
        console.log(this.options.configurations)

        // Add players to the game silently
        for (let player of players) {
            await instance.addPlayer(player, null)
            
            // Add the game to the player
            player.game = instance
            this.players.set(player.id, player)
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

        game.players.forEach(player => {
            // Remove the game from the player
            const member = this.players.get(player.id)
            member.game = null

            // Update the scores
            member.score = member.score || 0
            
            if(winners.find(w => w.id === player.id)) {
                member.score += this.scores.win
            } else {
                member.score += this.scores.loss
            }
        })

        // Send current user scores
        game.channel.send({
            embeds: [{
                title: `Scoreboard`,
                description: `${players.map(p => `${p}: ${p.score}`).join('\n')}\n\nTo join a new game, see the [original message](${this.message.url})!`,
            }]
        })

        // Remove the game from the tournament
        this.games.delete(id)
    }

    get leaderboard () {
        return this._leaderboard
    }

    updateLeaderboard() {
        this._leaderboard = Array.from(this.players.values())
        .sort((a, b) => {
            return b.score - a.score
        })
    }

}

export default Tournament