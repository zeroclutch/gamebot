const options = require('./../../config/options')
const Discord = require('./../../discord_mod')
const fs = require('fs')
const metadata = require('./metadata.json')

module.exports = class Game {
    /**
     * 
     * @param {Discord.Message} msg The message object.
     * @param {object} settings An optional object with custom settings for the game.
     */
    constructor(msg, settings) {
        /** REQUIRED FIELDS **/
        this.metadata = metadata
        this.msg = msg
        this.channel = msg.channel
        this.gameMaster = msg.author
        this.players = new Discord.Collection()
        this.ending = false
        this.playerCount = {
            min: 1,
            max: 20
        }
        this.collectors = [] // Whenever a MessageCollector or ReactionCollector is created, push it to this.collectors
        this.messageListener = msg => { this.onMessage(msg) } // whenever a message is sent, it is handled by the this.onMessage(msg) callback
        this.stage = 'init'
        this.settings = {
            isDmNeeded: false
        }

        /** SETTINGS **/
        /**
         * {
         *  'label': {
         *    friendlyName: 'Label',
         *    choices: ['value1', 'value2'],
         *    default: 'value1',
         *    type: 'checkboxes'|'free'|'radio',
         *    filter: m => true
         *  },
         * }
         */
    }

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
                await this.generateOptions()
                // Allow game leader to configure options
                await this.configureOptions()
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
        const collector = this.channel.createMessageCollector(filter, { max: this.playerCount.max, time: 120000 })
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
            if(size >= this.playerCount.min) {
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
     * Generates option lists, each game implements this function in its own way 
     */
    async generateOptions() {
        return
    }

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
     * Allow the game leader to set options. 
     * @returns The configured options
     */
    /** SETTINGS **/
    /**
     * [
     *  {
     *    friendlyName: 'Label',
     *    choices: ['value1', 'value2'],
     *    default: 'value1',
     *    type: 'checkboxes'|'free'|'radio'
     *  },
     * ]
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
                    })
                    // await a response for the option
                    await this.channel.awaitMessages(m => optionData[option.type].filter, {
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
    }

    /**
     * Handles message events emitted by the client.
     * 
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
     * @param {Discord.Member|string} member The member or id of the member to add.
     */
    addPlayer(member) {
        if(typeof member == 'string') member = this.msg.guild.members.get(member)
        
        if(this.players.size >= this.playerCount.max) {  
            this.msg.channel.sendMsgEmbed(`The game can't have more than ${this.playerCount.max} player${this.playerCount.max == 1 ? '' : 's'}! Player could not be added.`)
            return
        }

        if(this.players.has(member.id) || !member || member.bot) {
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
     * @param {Discord.Member} member The member to kick.
     * @param {string} member The id of the member to kick.
     */
    removePlayer(member) {
        if(this.stage != 'join' && this.stage != 'init') return
        if(typeof member == 'string') member = this.msg.guild.members.get(member)
        
        if(!this.players.has(member.id) || !member || member.bot) {
            this.msg.channel.sendMsgEmbed('Invalid user.', 'Error!', 13632027)
            return
        }

        if(this.players.size <= this.playerCount.min) {
            this.msg.channel.sendMsgEmbed(`The game can't have fewer than ${this.playerCount.min} player${this.playerCount.min == 1 ? '' : 's'}! Player could not be removed.`)
            return
        }

        this.msg.channel.sendMsgEmbed(`${member.user} was removed from the game!`)
        this.players.delete(member.id)
    }

    /**
     * Stop all collectors and reset collector list.
     * 
     * @param {Array<Discord.Collector>} List of collectors
     */
    async clearCollectors(collectors) {
        await collectors.forEach(collector => {
            collector.stop('Force stopped.')
        })
        collectors = []
    }

    /**
     * End a game. This will be called when a player wins or the game is force stopped.
     *
     * @param {object} winner The game winner
     * @param {string} endPhrase The message to be sent at the end of the game.
     */
    end(winner, endPhrase) {
        this.stage = 'over'

        if(!endPhrase) {
            if(winner) {
                endPhrase = `${winner.user} has won!`
            } else {
                endPhrase = '**Game ended.**'
            }

            endPhrase += `\nTo play games with the community, [join our server](${options.serverInvite})!`
        }

        // Send a message in the game channel (this.msg.channel) that the game is over.
        this.msg.channel.sendMsgEmbed(endPhrase).then(msg => {
            this.clearCollectors(this.collectors)
            // Remove all event listeners created during this game.
            this.msg.channel.gamePlaying = false
            this.msg.channel.game = undefined
            this.msg.client.removeListener('message', this.messageListener)
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