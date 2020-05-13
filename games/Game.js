const options = require('../config/options')
const Discord = require('../discord_mod')

/**
 * The base class for all games, see {@tutorial getting_started} to get started.
 * @abstract
 */
const Game = class Game {
    /**
     * An object with configurable game settings. This field is currently unused.
     * @typedef GameSettings
     * @type {Object}
     */

    /**
     * Creates a new game.
     * @param {Discord.Message} msg   The message object.
     * @param {GameSettings} settings An optional object with custom settings for the game
     */
    constructor(msg, settings) {
        /**
         * The metadata for a given game.
         * @typedef GameMetadata
         * @type {Object}
         * @property {String} id              The game's unique identifier.
         * @property {String} name            The name of the game.
         * @property {String} about           A short description about the game.
         * @property {String} rules           This game's rules and instructions.
         * @property {Object} playerCount     The number of players that can join this game.
         * @property {number} playerCount.min The minimum required number of players.
         * @property {number} playerCount.max The maximum required number of players.
         */

        /**
         * The metadata from the game, typically read from a metadata.json file.
         * @type {GameMetadata}
         * @example
         * this.metadata = require('./metadata.json')
         * @static
         */
        this.metadata = {
            id: 'game',
            name: 'Game',
            about: 'About this game.',
            rules: 'Rules for this game.',
            playerCount: {
                min: 1,
                max: 20
            }
        }
        
        /**
         * The Discord message that initialized this game.
         * @type {Discord.Message}
         * @see {@link https://discord.js.org/#/docs/main/11.5.1/class/Message|Discord.Message}
         */
        this.msg = msg

        /**
         * The Discord channel that this game is played in.
         * @type {Discord.TextChannel}
         * @see {@link https://discord.js.org/#/docs/main/11.5.1/class/TextChannel|Discord.TextChannel}
         */
        this.channel = msg.channel

        /**
         * The Discord user  who initialized this game.
         * @type {Discord.User}
         * @see {@link https://discord.js.org/#/docs/main/11.5.1/class/User|Discord.User}
         */
        this.gameMaster = msg.author

        /**
         * The collection  of players who are added to this game during the join phase.
         * @type {Discord.Collection}
         * @see {@link https://discord.js.org/#/docs/main/11.5.1/class/Collection|Discord.Collection}
         */
        this.players = new Discord.Collection()

        /**
         * Helper field that is only true when `this.forceStop()` is called. This should be used to prevent the game from continuing when unexpectedly ended.
         * @type {Boolean}
         * @example
         * const collector = this.channel.createMessageCollector(filter, options)
         * collector.on('message', message => {
         *     if(this.ending) return
         *     // ...
         * })
         */
        this.ending = false

        /**
         * The game's minimum and maximum player count. Use `this.metadata` instead.
         * @type {Object}
         * @property {Number} min The minimum player count for this game.
         * @property {Number} max The maximum player count for this game.
         * @deprecated
         */
        this.playerCount = {
            min: this.metadata.playerCount.min,
            max: this.metadata.playerCount.max
        }

        /**
         * A list of Discord collectors that is cleared when `this.clearCollectors(this.collectors)` is called. Whenever a `MessageCollector` or `ReactionCollector` is created, push it to `this.collectors()`.
         * @type {Array.<Discord.Collector>}
         * @see {@link https://discord.js.org/#/docs/main/11.5.1/class/Collector|Discord.Collector}
         * @deprecated
         */
        this.collectors = []

        /**
         * The message listener wrapper function. Whenever a message is sent, the message is handled by the `this.onMessage(msg)` callback in order to provide custom command functionality.
         * @type {callback}
         */
        this.messageListener = msg => { this.onMessage(msg) }

        /**
         * The current stage of the game. Default stages include 'join' and 'init'.
         * @type {String}
         */
        this.stage = 'init'

        /**
         * Game-specific settings that are configurable on a class level.
         * @static
         */
        this.settings = {
            isDmNeeded: false
        }

        /**
         * A user-configurable option for a game, modified during a game's init stage.
         * @typedef GameOption
         * @type {Object}
         * @property {String} friendlyName The user-friendly name of this option.
         * @property {String} type The type of option. Must be one of:
         * * `checkboxes`
         * * `radio`
         * * `free`
         * * `number`
         * @property {String|Number|Array.<String|Number>} default The default value for this option.
         * @property {Array.<String>} [choices] An array of choices the user can pick from. Required for checkboxes and radio types.
         * @property {String} [note] A note displayed during the selection screen
         * @property {Function(Discord.Message)} [filter] A filter function that validates the user's input message, and only accepts the input if the function returns true.
         * @see {@link https://discord.js.org/#/docs/main/11.5.1/class/Message|Discord.Message}
         */

        /**
         * The list of user-configurable options for this game. The configured options will be accessible from `this.options[friendlyName]` after the init stage.
         * @type {Array.<GameOption>}
         * @example
         * this.gameOptions = [
         *     {
         *         friendlyName: 'Categories',
         *         type: 'checkboxes'
         *         default: ['Game of Thrones']
         *         choices: ['Game of Thrones', 'Narnia', 'Lord of the Rings', 'Harry Potter'],
         *         note: 'Choose the categories for this game.'
         *     },
         *     {
         *         friendlyName: 'Game Mode',
         *         type: 'radio',
         *         default: 'Solo',
         *         choices: ['Team', 'Solo'],
         *         note: 'In team, players are matched up against each other in groups. In solo, it\'s everyone for themself!'
         *     },
         *     {
         *         friendlyName: 'Timer',
         *         type: 'number',
         *         default: 60,
         *         note: 'Enter a new value in seconds, between 30-60.',
         *         filter: m => parseInt(m.content) >= 30 && parseInt(m.content) <= 60
         *     },
         *     {
         *         friendlyName: 'Clan Tag',
         *         type: 'free',
         *         default: 'none',
         *         note: 'Enter a new 3-letter clan tag, or type \'none\' for no name.',
         *         filter: m => m.content.length == 3 || m.content == 'none'
         *     }
         * ]
         */
        this.gameOptions = []
    }

    /**
     * @returns {Discord.User} The game leader.
     * @see {@link https://discord.js.org/#/docs/main/11.5.1/class/User|Discord.User}
     */
    get leader () { return this.gameMaster }

    /**
     * Begins a new game. This will be called by the play command.
     */
    async init() {
        this.stage = 'init'

        // Check if downtime is going to start
        // Refresh downtime
        this.msg.client.getTimeToDowntime().then(timeToDowntime => {
            var downtime = Math.ceil(timeToDowntime / 60000)
            if(timeToDowntime > 0 && timeToDowntime <= 5 * 60000) {
                const downtime = Math.round(timeToDowntime / 60000)
                this.msg.channel.sendMsgEmbed(`Gamebot is going to be temporarily offline for maintenance in ${downtime} minute${downtime == 1 ? '': 's'}. Games cannot be started right now. For more information, [see our support server.](${options.serverInvite})`, 'Error!', options.colors.error)
                this.forceStop()
                return
            } else if(timeToDowntime > 0) {
                this.msg.channel.sendMsgEmbed(`Gamebot is going to be temporarily offline for maintenance in ${downtime} minute${downtime == 1 ? '': 's'}. Any active games will be automatically ended. For more information, [see our support server.](${options.serverInvite})`, 'Warning!', options.colors.warning)
            }

            // Create listener for commands
            this.msg.client.on('message', this.messageListener)

            this.join(async () => {
                // Generate the game-specific option lists
                await this.generateOptions()
                
                if(this.gameOptions) {
                    // Allow game leader to configure options. Configured ptions will be outputted to this.options
                    await this.configureOptions()
                }

                // Initialize specific game
                await this.gameInit()

                // Begin playing the game
                await this.play()
            })
        })
    }

    /**
     * Begins the join phase of the game.
     * @param {Function} callback The callback that is executed when the players are collected.
     */
    async join(callback) {
        this.stage = 'join'

        // allow players to join
        await this.msg.channel.send({
            embed: {
                title: `${this.msg.author.tag} is starting a ${this.metadata.name} game!`,
                description: `Type \`${options.prefix}join\` to join in the next **120 seconds**.\n\n${this.leader}, type \`${options.prefix}start\` to begin once everyone has joined.`,
                color: 4886754
            }
        })

        // Add gameMaster
        this.addPlayer(this.gameMaster.id)

        const filter = m => (m.content.startsWith(`${options.prefix}join`) && !this.players.has(m.author.id)) || (m.author.id == this.gameMaster.id && m.content.startsWith(`${options.prefix}start`))
        const collector = this.channel.createMessageCollector(filter, { max: this.metadata.playerCount.max, time: 120000 })
        this.collectors.push(collector)
        collector.on('collect', m => {
            if(this.ending) return
            if(m.content.startsWith(`${options.prefix}start`)) {
                collector.stop()
                return
            }
            this.addPlayer(m.author.id)
            m.delete()
        })

        collector.on('end', collected => {
            if(this.ending) return
            // check if there are enough players
            let size = this.players.size
            if(this.playersToAdd)  size += this.playersToAdd.length
            if(this.playersToKick) size -= this.playersToKick.length
            if(size >= this.metadata.playerCount.min) {
                let players = []
                this.players.forEach(player => { players.push(player.user) })
                this.msg.channel.sendMsgEmbed(`${players.join(", ")} joined the game!`, 'Time\'s up!')
            } else {
                this.msg.channel.sendMsgEmbed(`Not enough players joined the game!`, 'Time\'s up!')
                this.forceStop()
                return
            }
            // continue playing
            callback()
        })
    }

    /**
     * Generates option lists, each game implements this method in its own way.
     * @abstract
     */
    async generateOptions() {
        return
    }

    /**
     * Display the choices of a game's option.
     * @param {GameOption} option The option to render into text.
     */
    renderOptionInfo (option) {
        var response = ''
        if(option.type == 'checkboxes') {
            option.choices.forEach((choice, index) => {
                response += `${option.value.includes(choice) ? '**✓**' : '☐'} ${index + 1}: ${choice}\n`
            })
        } else if (option.type == 'radio') {
            option.choices.forEach((choice, index) => {
                response += `${option.value == choice ? '🔘' : '⚪️'} ${index + 1}: ${choice}\n`
            })
        } else if (option.type == 'free') {
            response = `**Current value:** ${option.value}`
        } else {
            response = `**Current value:** ${option.value}`
        }
        response += option.note ? '\n\n' + option.note : ''
        return response
    }

    /**
     * An option that has been configured by the game leader and has a set value.
     * @typedef ConfiguredOption
     * @type {String|Number|Array.<String|Number>}
     */

    /**
     * Allow the game leader to set options, and outputs the options to `this.options`.
     * @returns {Object<String,ConfiguredOption>} The configured options, with their key as the option friendly name, and value as the configured value.
     */
    async configureOptions () {
        var isConfigured = false
        var optionMessage
        for(var i = 0; i < this.gameOptions.length; i++) {
            // configure options
            let option = this.gameOptions[i]
            Object.defineProperty(option, 'value', {
                value: option.default,
                enumerable: true,
                writable: true
            })
        }

        await this.channel.send('Loading options...').then(m => optionMessage = m)
        do {
            // Display options
            var optionsDisplay = ''
            for(var i = 0; i < this.gameOptions.length; i++) {
                // write to options display
                var option = this.gameOptions[i]
                optionsDisplay += `**${i + 1}.** ${option.friendlyName}: ${typeof option.value == 'object' ? option.value.join(', ') : option.value }\n`
            }
            optionsDisplay += `\nType \`${options.prefix}start\` to start the game.`
            optionMessage.edit({
                embed: {
                    title: 'Configure Settings',
                    description: optionsDisplay,
                    color: options.colors.info,
                    footer: {
                        text: 'Type an option\'s number to edit the value.'
                    }
                }
            })

            const filter = m => m.author.id == this.gameMaster.id && ((!isNaN(m.content) && parseInt(m.content) <= this.gameOptions.length && parseInt(m.content) > 0) || m.content.toLowerCase() == options.prefix + 'start')
            await this.channel.awaitMessages(filter, {
                time: 60000,
                max: 1,
                errors: ['time'],
            }).then(async collected => {
                if(this.ending) return
                const message = collected.first()
                message.delete()
                if(message.content == `${options.prefix}start`) {
                    optionMessage.edit({
                        embed: {
                            title: 'Options saved!',
                            description: 'The game is starting...',
                            color: options.colors.info
                        }
                    })
                    isConfigured = true
                    return
                } else {
                    var option = this.gameOptions[parseInt(message.content) - 1]
                    const optionData = {
                        'checkboxes': {
                            footer: `Type multiple numbers (separated by a space) to select and deselect items.`,
                            filter: m => m.author.id == this.gameMaster.id
                        },
                        'free': {
                            footer: 'Enter a new value.',
                            filter:  m => m.author.id == this.gameMaster.id
                        },
                        'number': {
                            footer: 'Enter a new value.',
                            filter:  m => m.author.id == this.gameMaster.id && !isNaN(m.content)
                        },
                        'radio': {
                            footer: `Type the option's number to select a new option.`,
                            filter: m => m.author.id == this.gameMaster.id && !isNaN(m.content) && parseInt(m.content) <= option.choices.length && parseInt(m.content) > 0
                        }
                    }

                    // send option info
                    await optionMessage.edit({
                        embed: {
                            title: `Edit option: ${option.friendlyName}`,
                            description: this.renderOptionInfo(option),
                            color: options.colors.info,
                            footer: {
                                text: optionData[option.type].footer
                            }

                        }
                    }).catch(err => {
                        console.error(err)
                        this.channel.sendMsgEmbed(`Something went wrong when editing the message. Type \`${options.prefix}start\` to begin the game.`, 'Error!', options.colors.error).delete(5000)
                    })

                    // await a response for the option
                    await this.channel.awaitMessages(m => (optionData[option.type].filter)(m), {
                        time: 60000, max: 1
                    }).then(collected => {
                        if(this.ending) return
                        const message = collected.first()
                        message.delete()
                        
                        // add custom filter options
                        if(option.filter) {
                            if(!option.filter(message)) {
                                this.msg.channel.sendMsgEmbed('You have entered an invalid value. Please read the instructions and try again.', 'Error!', options.colors.error).then(m => m.delete(2000))
                                return
                            }
                        }

                        // edit checkboxes
                        if(option.type == 'checkboxes') {
                            const numbers = message.content.split(/\ /g)
                            numbers.forEach(number => {
                                const index = parseInt(number) - 1
                                const choice = option.choices[index]
                                if(!choice) return
                                // remove what is already there
                                if(option.value.includes(choice)) {
                                    option.value.splice(option.value.indexOf(choice), 1)
                                }
                                // add what isn't there
                                else {
                                    option.value.push(choice)
                                }
                            })
                        }
                        // edit free response
                        else if(option.type == 'free') {
                            option.value = message.content
                        }
                        // edit radio
                        else if (option.type == 'radio') {
                            const index = parseInt(message.content) - 1
                            const newChoice = option.choices[index]
                            if(!newChoice) {
                                this.msg.channel.sendMsgEmbed('You entered an invalid value.', 'Error!', options.colors.error).then(m => m.delete(2000))
                            } else {
                                option.value = newChoice
                            }
                        }
                    })
                    .catch(err => {
                        this.channel.sendMsgEmbed(`Please select an option! Type \`${options.prefix}start\` to start the game.`, 'Error!', options.colors.error)
                    })
                    // on timeout restart this
                }
            }).catch(err => {
                // time has run out
                if(err.size === 0) {
                    optionMessage.edit({
                        embed: {
                            title: 'Time has run out!',
                            description: 'The game is starting...',
                            color: options.colors.error
                        }
                    })
                    isConfigured = true
                } else {
                    console.error(err)
                    optionMessage.edit({
                        embed: {
                            title: 'Error!',
                            description: `An unknown error occurred when loading into the game. The game is now starting. Please report this to Gamebot support in our [${options.serverInvite}](support server).`,
                            color: options.colors.error
                        }
                    })
                }
            })
        } while(!isConfigured)
        // add to options
        this.options = {}
        this.gameOptions.forEach(option => {
            this.options[option.friendlyName] = option.value 
        })
        return this.options
    }

    /**
     * Handles message events emitted by the client.
     * @param {Discord.Message} message The message emitted by the client.
    */
    async onMessage(message) {
        // Only listen to messages sent in the game channel
        if(message.channel.id !== this.channel.id) return
        
        // leader commands
        if(message.author.id == this.gameMaster.id) {
            // add command
            if(message.content.startsWith(`${options.prefix}add`)) {
                let member = message.content.substring(options.prefix.length + 3, message.content.length).replace(/\D/g, '')
                this.addPlayer(member)
            }

            // kick command
            if(message.content.startsWith(`${options.prefix}kick`)) {
                var user = message.content.substring(options.prefix.length + 4, message.content.length).replace(/\D/g, '')
                this.removePlayer(user)
            }
        } else {
            // leave command
            if(message.content.startsWith(`${options.prefix}leave`)) {
                // check if the player count will stay within the min and max
                this.removePlayer(user)
            }
        }

        // bot owner commands
        if(message.author.id == process.env.OWNER_ID) {
            if(message.content.startsWith(`${options.prefix}evalg`)) {
                var msg = message
                var response = '';
                try {
                    response = await eval('(()=>{'+message.content.substring(options.prefix.length + 6,message.content.length)+'})()')
                    message.channel.send("```css\neval completed```\nResponse Time: `" + (Date.now()-message.createdTimestamp) + "ms`\nresponse:```json\n" + JSON.stringify(response) + "```\nType: `" + typeof(response) + "`");
                } catch (err) {
                    message.channel.send("```diff\n- eval failed -```\nResponse Time: `" + (Date.now()-message.createdTimestamp) + "ms`\nerror:```json\n" + err + "```");
                }
            }
        }
    }

    /**
     * Add a player to the game.
     * @param {Discord.Member|String} member The member or id of the member to add,
     */
    async addPlayer(member) {
        if(typeof member == 'string') {
            member = await this.msg.guild.fetchMember(member).catch(() => {
                this.msg.channel.sendMsgEmbed('Invalid user.', 'Error!', 13632027)
            })
        }
        
        if(this.players.size >= this.metadata.playerCount.max) {  
            this.msg.channel.sendMsgEmbed(`The game can't have more than ${this.metadata.playerCount.max} player${this.metadata.playerCount.max == 1 ? '' : 's'}! Player could not be added.`)
            return
        }

        if(!member || this.players.has(member.id) || member.bot) {
            this.msg.channel.sendMsgEmbed('Invalid user.', 'Error!', 13632027)
            return
        }
            
        member.user.createDM().then(dmChannel => {
            return new Promise(resolve => {
                var player = { user: member.user, dmChannel}
                for(let key in this.defaultPlayer) {
                    if(this.defaultPlayer[key] == 'String') {
                        player[key] = ''
                    } else if (this.defaultPlayer[key] == 'Array') {
                        player[key] = []
                    } else if (this.defaultPlayer[key] == 'Object') {
                        player[key] = {}
                    } else {
                        player[key] = this.defaultPlayer[key]
                    }
                }
                this.players.set(member.id, player)
                resolve(dmChannel)
            })
        }).then(async dmChannel => {
            if(this.settings.isDmNeeded){
                await dmChannel.sendMsgEmbed(`You have joined a ${this.metadata.name} game in <#${this.msg.channel.id}>.`)
            }
            this.msg.channel.sendMsgEmbed(`${member.user} was added to the game!`)
        }).catch(err => {
            console.error(err)
            if(err.message == 'Cannot send messages to this user') {
                return
            }

            if(member.id == this.gameMaster.id) {
                this.msg.channel.sendMsgEmbed(`You must change your privacy settings to allow direct messages from members of this server before playing this game. [See this article for more information.](https://support.discordapp.com/hc/en-us/articles/217916488-Blocking-Privacy-Settings-)`, `Error: You could not start this game.`, options.colors.error)
                this.forceStop()
            } else {
                this.msg.channel.sendMsgEmbed(`${member.user} must change their privacy settings to allow direct messages from members of this server before playing this game. [See this article for more information.](https://support.discordapp.com/hc/en-us/articles/217916488-Blocking-Privacy-Settings-)`, `Error: Player could not be added.`, options.colors.error)
            }
        })
    }

    /**
     * Remove a player from the game.
     * @param {string|Discord.Member} member The member or member id to kick.
     */
    async removePlayer(member) {
        if(this.stage != 'join' && this.stage != 'init') return
        if(typeof member == 'string') {
            member = await this.msg.guild.fetchMember(member).catch(() => {
                this.msg.channel.sendMsgEmbed('Invalid user.', 'Error!', 13632027)
            })
        }
        
        if(!this.players.has(member.id) || !member || member.bot) {
            this.msg.channel.sendMsgEmbed('Invalid user.', 'Error!', 13632027)
            return
        }

        if(this.players.size <= this.metadata.playerCount.min) {
            this.msg.channel.sendMsgEmbed(`The game can't have fewer than ${this.metadata.playerCount.min} player${this.metadata.playerCount.min == 1 ? '' : 's'}! Player could not be removed.`)
            return
        }

        this.msg.channel.sendMsgEmbed(`${member.user} was removed from the game!`)
        this.players.delete(member.id)
    }

    /**
     * The method called after user configuration. This will be custom for each game.
     * @abstract
     */
    play() {
        return
    }

    /**
     * Stop all collectors and reset collector list.
     * @param {Array.<Discord.Collector>} collectors List of collectors
     * @deprecated
     */
    async clearCollectors(collectors) {
        collectors.forEach(collector => {
            collector.stop('Force stopped.')
        })
        collectors = []
    }

    /**
     * End a game. This will be called when a player wins or the game is force stopped.
     * @param {object} winner The game winner
     * @param {string} endPhrase The message to be sent at the end of the game.
     */
    end(winner, endPhrase) {
        this.stage = 'over'

        if(!endPhrase) {
            if(winner) {
                endPhrase = `${winner.user} has won!`
            } else {
                endPhrase = ''
            }

            endPhrase += `\nTo play games with the community, [join our server](${options.serverInvite})!`
        }

        // Send a message in the game channel (this.msg.channel) that the game is over.
        this.msg.channel.sendMsgEmbed(endPhrase, 'Game over!', options.colors.economy).then(msg => {
            this.clearCollectors(this.collectors)
            // Remove all event listeners created during this game.
            this.msg.channel.gamePlaying = false
            this.msg.channel.game = undefined
            this.msg.client.removeListener('message', this.messageListener)
        })


        // If there's downtime and there was the last game, let the owner know that the bot is safe to restart.
        this.msg.client.getTimeToDowntime().then(async timeToDowntime => {
            if(timeToDowntime > 0) {
                let activeGames = await this.msg.client.shard.broadcastEval('this.channels.filter(c => c.game).size')
                if(activeGames.reduce((prev, val) => prev + val) == 0) {
                    let channel = this.msg.client.channels.get(options.loggingChannel)
                    if(channel) channel.send(`All games finished, <@${options.ownerID}>`)
                }
            }
        })
    }

    /**
     * Force ends a game. This will be called by the end command.
     */
    forceStop() {
        this.ending = true
        this.end()
    }
}

module.exports = Game