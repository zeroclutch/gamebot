import options from '../../../config/options.js'
import { BUTTONS, GAME_OPTIONS, REPLIES } from '../../../config/types.js'
import Discord from '../../../discord_mod.js'

/**
 * The base class for all games, see {@tutorial getting_started} to get started.
 * @abstract
 */
export default class Game {
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
         * @property {Boolean} unlockables    Whether or not the game has unlockables in the shop.
         * @property {Object} playerCount     The number of players that can join this game.
         * @property {number} playerCount.min The minimum required number of players.
         * @property {number} playerCount.max The maximum required number of players.
         */

        /**
         * The metadata from the game, typically read from a metadata.js file.
         * @type {GameMetadata}
         * @example
         * import metadata from './metadata.js'
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
         * The Discord client that this game belongs to.
         * @type {Discord.Client}
         * @see {@link https://discord.js.org/#/docs/main/11.5.1/class/Client|Discord.Client}
         */
        this.client = msg.client

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
         * An array of players that are queued to be added, populated using the `this.addPlayer()` command
         * @type {Array}
         */
        this.playersToAdd = []

        /**
         * An array of players that are queued to be added, populated using the `this.removePlayer()` command
         * @type {Array}
         * 
         */
        this.playersToKick = []

        /**
         * Helper field that is only true when `this.forceStop()` is called. This should be used to prevent the game from continuing when unexpectedly ended.
         * @type {Boolean}
         * @example
         * const collector = this.channel.createMessageCollector(filter, options)
         * collector.on('message', message => {
         *     if(this.ending) return
         *     // ...
         * })
         * @deprecated use this.stage = 'ending' instead
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
         * The current stage of the game. Default stages include 'join' and 'init'.
         * @type {String}
         */
        this.stage = 'init'

        /**
         * Game-specific settings that are configurable on a class level.
         * @static
         */
        this.settings = {
            isDmNeeded: false,
            updatePlayersAnytime: true,
            defaultUpdatePlayerMessage: `✅ The player list will be updated at the start of the next round.`
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

        this.client.logger.log('Game started', {
            game: this.metadata.game,
            id: this.metadata.id
        })

        // Check if downtime is going to start
        // Refresh downtime
        let timeToDowntime = await this.msg.client.getTimeToDowntime()
        let downtime = Math.ceil(timeToDowntime / 60000)
        if(timeToDowntime > 0 && timeToDowntime <= 10 * 60000) {
            const downtime = Math.round(timeToDowntime / 60000)
            this.msg.channel.sendEmbed(`Gamebot is going to be temporarily offline for maintenance in ${downtime} minute${downtime == 1 ? '': 's'}. Games cannot be started right now. For more information, [see our support server.](${options.serverInvite}?ref=downtimeError)`, 'Error!', options.colors.error)
            this.forceStop()
            return
        } else if(timeToDowntime > 0) {
            this.msg.channel.sendEmbed(`Gamebot is going to be temporarily offline for maintenance in ${downtime} minute${downtime == 1 ? '': 's'}. Any active games will be automatically ended. For more information, [see our support server.](${options.serverInvite}?ref=downtimeWarning)`, 'Warning!', options.colors.warning)
        }

        this.stage = 'join'
        await this.join()

        // Generate the game-specific option lists
        await this.generateOptions()
        
        if(this.gameOptions) {
            this.stage = 'options'
            // Allow game leader to configure options. Configured options will be outputted to this.options
            await this.configureOptions()
        }

        // Prevent players from joining and leaving freely during the game
        this.settings.updatePlayersAnytime = false

        // Initialize specific game
        this.stage = 'gameinit'
        await this.gameInit()

        // Begin playing the game
        this.stage = 'play'
        await this.play()
    }

    /**
     * Begins the join phase of the game.
     * @param {Function} callback The callback that is executed when the players are collected.
     */
    join() {
        return new Promise(async (resolve, reject) => {
            // Add game leader
            await this.addPlayer(this.leader.id, null)
            await this.updatePlayers(true)

            // Construct join message
            const joinButtonRow = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setCustomId(BUTTONS.JOIN)
                    .setLabel('Join')
                    .setStyle('SUCCESS'),
                new Discord.MessageButton()
                    .setCustomId(BUTTONS.START)
                    .setLabel('Start Game (Leader)')
                    .setStyle('PRIMARY'),
            )

            const joinEmbed = {
                title: `${this.msg.author.tag} is starting a ${this.metadata.name} game!`,
                description: `Click "Join" below to join in the next **120 seconds**.\n\n${this.leader}, select "Start Game" to begin once everyone has joined.`,
                fields: [{
                    name: 'Joined Players',
                    value: this.players.reduce((str, p) => str += `<@${p.user.id}>, `, '').slice(0, -2) || 'None'
                }],
                color: options.colors.info
            }

            let joinMessage = await this.msg.channel.send({
                embeds: [ joinEmbed ],
                components: [ joinButtonRow ]
            })
            
            // Collect all interactions
            const collector = joinMessage.createMessageComponentCollector({ time: 120000 })
            this.collectors.push(collector)
            collector.on('collect', async i => {
                // End all collectors when game is force stopped
                if(this.ending) return
                
                // Start button
                if(i.customId === BUTTONS.START && i.user.id === this.msg.author.id) {
                    collector.stop()
                    return
                } else if(i.customId === BUTTONS.JOIN && !this.players.has(i.user.id) ) {
                    await this.addPlayer(i.user.id, null)
                    await this.updatePlayers(true)
                    
                    // Update player list
                    joinEmbed.fields[0].value = this.players.reduce((str, p) => str += `<@${p.user.id}>, `, '').slice(0, -2) || 'None'
                    
                    await i.update({
                        embeds: [ joinEmbed ],
                        components: [ joinButtonRow ]
                    })
                } else {
                    // A disallowed action was executed
                    await i.reply( REPLIES.DISALLOWED_ACTION )
                }

            })

            collector.once('end', collected => {
                // End all collectors when game is force stopped
                if(this.ending) return

                joinMessage.edit({ components: [] })

                // check if there are enough players
                let size = this.players.size
                if(this.playersToAdd)  size += this.playersToAdd.length
                if(this.playersToKick) size -= this.playersToKick.length
                if(size >= this.metadata.playerCount.min) {
                    let players = []
                    this.players.forEach(player => { players.push(player.user) })
                    this.msg.channel.sendEmbed(`${players.join(", ")} joined the game!`, 'Time\'s up!')
                } else {
                    this.msg.channel.sendEmbed(`Not enough players joined the game!`, 'Time\'s up!')
                    this.forceStop()
                    return
                }
                // continue playing
                resolve(true)
            })
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
        let response = ''
        if(option.type === GAME_OPTIONS.CHECKBOX) {
            option.choices.forEach((choice, index) => {
                response += `${option.value.includes(choice) ? '**✓**' : '☐'} ${index + 1}: ${choice}\n`
            })
        } else if (option.type === GAME_OPTIONS.RADIO) {
            option.choices.forEach((choice, index) => {
                response += `${option.value == choice ? '🔘' : '⚪️'} ${index + 1}: ${choice}\n`
            })
        } else if (option.type === GAME_OPTIONS.FREE) {
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
     * Convert the gameOptions list to a concise key-value options list
     * @returns {Object<String,ConfiguredOption>}
     */
    generateConfiguredOptionList() {
        // add to options
        this.options = {}
        this.gameOptions.forEach(option => {
            this.options[option.friendlyName] = option.value 
        })
        return this.options
    }

    /**
     * Allow the game leader to set options, and outputs the options to `this.options`.
     * @returns {Promise<Object<String,ConfiguredOption>>} The configured options, with their key as the option friendly name, and value as the configured value.
     */
    configureOptions() {
        return new Promise(async (resolve, reject) => {
            let isConfigured = false
            let optionMessage
            for(let i = 0; i < this.gameOptions.length; i++) {
                // configure options
                let option = this.gameOptions[i]
                Object.defineProperty(option, 'value', {
                    value: option.default,
                    enumerable: true,
                    writable: true
                })
            }

            const optionsButtonRow = new Discord.MessageActionRow()
                .addComponents(
                    new Discord.MessageButton()
                        .setCustomId(BUTTONS.START)
                        .setLabel('Confirm Settings (Leader)')
                        .setStyle('PRIMARY'),
                )

            await this.channel.send('Loading options...').then(m => optionMessage = m)
            do {
                // Display options
                let optionsDisplay = ''
                for(let i = 0; i < this.gameOptions.length; i++) {
                    // write to options display
                    let option = this.gameOptions[i]
                    optionsDisplay += `**${i + 1}.** ${option.friendlyName}: ${typeof option.value == 'object' ? option.value.join(', ') : option.value }\n`
                }
                optionsDisplay += `\nClick "Confirm Settings" below to start the game.`
                optionMessage.edit({
                    embeds: [{
                        title: 'Configure Settings',
                        description: optionsDisplay,
                        color: options.colors.info,
                        footer: {
                            text: 'Type an option\'s number to edit the value.'
                        }
                    }],
                    components: [ optionsButtonRow ]
                })

                const buttonFilter = i => i.user.id === this.leader.id && i.customId === BUTTONS.START

                let buttonCollector = optionMessage.createMessageComponentCollector({ filter: buttonFilter, time: 60000 })

                buttonCollector.on('collect', async i => {
                    if(i.user.id === this.leader.id && i.customId === BUTTONS.START) {
                        buttonCollector.stop('limit')
                    } else {
                        await i.reply( REPLIES.DISALLOWED_ACTION )
                    }
                })

                buttonCollector.once('end', async (collected, reason) => {
                    if(this.ending) return
                    if(reason === 'limit') {
                        optionMessage.edit({
                            embeds: [{
                                title: 'Options saved!',
                                description: 'The game is starting...',
                                color: options.colors.info
                            }],
                            components: []
                        })
                    } else {
                        // Handle timeout on awaitMessages.catch()
                    }
                    // Single exit point of method
                    isConfigured = true
                    resolve(this.generateConfiguredOptionList())
                })

                const messageFilter = m => m.author.id === this.leader.id && ((!isNaN(m.content) && parseInt(m.content) <= this.gameOptions.length && parseInt(m.content) > 0) || m.content.toLowerCase() === this.channel.prefix + 'start')
                //const filter = m => m.author.id != this.client.user.id
                await this.channel.awaitMessages({ 
                    filter: messageFilter,
                    time: 60000,
                    max: 1,
                    errors: ['time'],
                }).then(async collected => {
                    if(this.ending) return
                    const message = collected.first()
                    message.delete()
                    let option = this.gameOptions[parseInt(message.content) - 1]
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
                        embeds: [{
                            title: `Edit option: ${option.friendlyName}`,
                            description: this.renderOptionInfo(option),
                            color: options.colors.info,
                            footer: {
                                text: optionData[option.type].footer
                            }
                        }]
                    }).catch(err => {
                        console.error(err)
                        this.channel.sendEmbed(`Something went wrong when editing the message. Type \`${this.channel.prefix}start\` to begin the game.`, 'Error!', options.colors.error).delete(5000)
                    })

                    // await a response for the option
                    await this.channel.awaitMessages({
                        filter: m => (optionData[option.type].filter)(m),
                        time: 60000,
                        max: 1
                    }).then(collected => {
                        if(this.ending) return
                        const message = collected.first()
                        message.delete()
                        
                        // add custom filter options
                        if(option.filter) {
                            if(!option.filter(message)) {
                                this.msg.channel.sendEmbed('You have entered an invalid value. Please read the instructions and try again.', 'Error!', options.colors.error).then(m => m.delete(2000))
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
                                this.msg.channel.sendEmbed('You entered an invalid value.', 'Error!', options.colors.error).then(m => m.delete(2000))
                            } else {
                                option.value = newChoice
                            }
                        }
                    })
                    .catch(err => {
                        this.channel.sendEmbed(`Please select an option! Type \`${this.channel.prefix}start\` to start the game.`, 'Error!', options.colors.error)
                    })
                }).catch(err => {
                    // time has run out
                    if(err.size === 0) {
                        optionMessage.edit({
                            embeds: [{
                                title: 'Time has run out!',
                                description: 'The game is starting...',
                                color: options.colors.error
                            }],
                            components: []
                        })
                        isConfigured = true
                    } else {
                        console.error(err)
                        optionMessage.edit({
                            embeds: [{
                                title: 'Error!',
                                description: `An unknown error occurred when loading into the game. The game is now starting. Please report this to Gamebot support in our [support server](${options.serverInvite}?ref=gameLoadInError).`,
                                color: options.colors.error
                            }]
                        })
                    }
                })
            } while(!isConfigured)
        })
    }

    /**
     * Sets or changes the game leader during the game.
     * @param {Discord.Member|string} member The member or id of the member to add
     * @param {string} message The message to send if the user is successfully queued. Set to "null" for no message to be sent.
     */
    async setLeader(member) {
        if(typeof member == 'string') {
            member = await this.msg.guild.members.fetch(member).catch(async () => {
                await this.msg.channel.sendEmbed('Invalid user.', 'Error!', 13632027).catch(console.error)
                return false
            })
            if(member === false) return
        }

        if(!member || this.leader.id == member.id || !this.players.has(member.id)) {
            await this.msg.channel.sendEmbed('Invalid user.', 'Error!', 13632027).catch(console.error)
            return
        }

        this.gameMaster = this.players.get(member.id)

        if(message !== null) {
            await this.channel.sendEmbed(message || this.settings.defaultUpdatePlayerMessage).catch(console.error)
        }

    }

    /**
     * Add a player to the queue to be added to the game.
     * @param {Discord.Member|string} member The member or id of the member to add
     * @param {string} message The message to send if the user is successfully queued. Set to "null" for no message to be sent.
     */
    async addPlayer(member, message) {
        if(typeof member === 'string') {
            member = await this.msg.guild.members.fetch(member).catch(async err => {
                console.error(err)
                await this.channel.sendEmbed('Invalid user.', 'Error!', 13632027).catch(console.error)
                return false
            })
            if(member === false) return
        }

        if(!member || this.players.has(member.id) || (member.bot && !this.client.isTestingMode)) {
            await this.msg.channel.sendEmbed('Invalid user.', 'Error!', 13632027).catch(console.error)
            return
        }

        let futureSize = this.players.size + this.playersToAdd.length - this.playersToKick.length
        if(futureSize >= this.metadata.playerCount.max) {
            await this.channel.sendEmbed(`The game can't have more than ${this.metadata.playerCount.min} player${this.metadata.playerCount.min == 1 ? '' : 's'}! ${member.user} could not be added.`).catch(console.error)
            return
        }

        if(message !== null) {
            await this.channel.sendEmbed(message || this.settings.defaultUpdatePlayerMessage).catch(console.error)
        }
        
        this.playersToAdd.push(member)
    }

    /**
     * Add a player to the queue to be removed from the game.
     * @param {string|Discord.Member} member The member or member id to kick.
     * @param {string} message The message to send if the user is successfully queued. Set to "null" for no message to be sent.
     */
    async removePlayer(member, message) {
        if(typeof member == 'string') {
            member = await this.msg.guild.members.fetch(member).catch(async () => {
                await this.channel.sendEmbed('Invalid user.', 'Error!', options.colors.error).catch(console.error)
                return false
            })
            if(member === false) return
        }

        if(this.leader.id == member.id) {
            await this.channel.send({
                embeds: [{
                    title: 'Error!',
                    description: 'The leader cannot leave the game.',
                    color: options.colors.error
                }]
            }).catch(console.error)
        }
        
        if(!this.players.has(member.id) || !member || (member.bot && !this.client.isTestingMode)) {
            await this.channel.sendEmbed('Invalid user.', 'Error!', options.colors.error).catch(console.error)
            return
        }

        let futureSize = this.players.size + this.playersToAdd.length - this.playersToKick.length
        if(futureSize <= this.metadata.playerCount.min) {
            this.channel.sendEmbed(`The game can't have fewer than ${this.metadata.playerCount.min} player${this.metadata.playerCount.min == 1 ? '' : 's'}! ${member.user} could not be removed.`).catch(console.error)
            return
        }

        if(message !== null) {
            await this.channel.sendEmbed(message || this.settings.defaultUpdatePlayerMessage).catch(console.error)
        }
        
        this.playersToKick.push(member)
    }

    /**
     * Update players who are queued to join or leave the game.
     * @param {Boolean} updateQuietly Sends a message in chat if not explicitly false
     */
    async updatePlayers(updateQuietly=false) {
        for(let member of this.playersToKick) {
            if(!updateQuietly) await this.msg.channel.sendEmbed(`${member.user} was removed from the game!`).catch(console.error)
            this.players.delete(member.id)
        }
        this.playersToKick = []

        for(let member of this.playersToAdd) {
            await member.user.createDM().then(dmChannel => {
                return new Promise(resolve => {
                    let player = { user: member.user, dmChannel }
                    // Construct default player object
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
                    await dmChannel.sendEmbed(`You have joined a ${this.metadata.name} game in <#${this.msg.channel.id}>.`).catch(console.error)
                }
                if(!updateQuietly) await this.msg.channel.sendEmbed(`${member.user} was added to the game!`).catch(console.error)
            }).catch(async err => {
                // Remove errored player
                if(this.players.has(member.id)) this.players.delete(member.id)

                // Filter out privacy errors
                if(err.message != 'Cannot send messages to this user') {
                    await this.msg.channel.sendEmbed(`An unknown error occurred, and ${member.user} could not be added.`, `Error: Player could not be added.`, options.colors.error).catch(console.error)
                    console.error(err)
                }

                // Notify user
                if(member.id == this.gameMaster.id) {
                    await this.msg.channel.sendEmbed(`You must change your privacy settings to allow direct messages from members of this server before playing this game. [See this article for more information.](https://support.discordapp.com/hc/en-us/articles/217916488-Blocking-Privacy-Settings-)`, `Error: You could not start this game.`, options.colors.error).catch(console.error)
                    this.forceStop()
                } else {
                    await this.msg.channel.sendEmbed(`${member.user} must change their privacy settings to allow direct messages from members of this server before playing this game. [See this article for more information.](https://support.discordapp.com/hc/en-us/articles/217916488-Blocking-Privacy-Settings-)`, `Error: Player could not be added.`, options.colors.error).catch(console.error)
                }
            })
        }
        this.playersToAdd = []
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

        this.client.logger.log('Game ended', {
            game: this.metadata.game,
            id: this.metadata.id,
            duration: Date.now() - this.msg.createdTimestamp,
            players: this.players.size,
        })

        if(!endPhrase) {
            if(winner) {
                endPhrase = `${winner.user} has won!`
            } else {
                endPhrase = ''
            }

            endPhrase += `\nTo play games with the community, [join our server](${options.serverInvite}?ref=gameEnd)!`
        }

        // Send a message in the game channel (this.msg.channel) that the game is over.
        this.msg.channel.sendEmbed(endPhrase, 'Game over!', options.colors.economy).then(msg => {
            this.clearCollectors(this.collectors).catch(console.error)
            // Remove all event listeners created during this game.
            this.msg.channel.gamePlaying = false
            this.msg.channel.game = undefined
        }).catch(console.error)

        if(this.metadata.unlockables) {
            this.channel.send({
                embeds: [{
                    title: `This game contains unlockable content!`,
                    description: `Check out the [Gamebot shop for more](${process.env.BASE_URL}/shop)!`,
                    color: options.colors.economy
                }]
            }).catch(console.error)
        }

        // If there's downtime and there was the last game, let the owner know that the bot is safe to restart.
        this.msg.client.getTimeToDowntime().then(async timeToDowntime => {
            if(timeToDowntime > 0) {
                let activeGames = await this.msg.client.shard.broadcastEval('this.channels.filter(c => c.game).size')
                if(activeGames.reduce((prev, val) => prev + val) == 0) {
                    let channel = this.msg.client.channels.cache.get(options.loggingChannel)
                    if(channel) channel.send(`All games finished, <@${options.ownerID}>`)
                }
            }
        }).catch(console.error)
    }

    /**
     * Force ends a game. This will be called by the end command.
     */
    forceStop() {
        this.ending = true
        this.end()
    }
}
