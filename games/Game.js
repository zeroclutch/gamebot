module.exports = class Game {
    /**
     * 
     * @param {Discord.Message} msg The message object.
     * @param {object} settings An optional object with custom settings for the game.
     */
    constructor(msg, settings) {
        /** REQUIRED FIELDS **/
        this.msg = msg
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

        /** SETTINGS **/
        this.gameOptions = settings.gameOptions
    }

    /**
     * Begins a new game. This will be called by the play command.
     */
    init() {
        this.stage = 'init'
        // Create listener for commands
        this.msg.client.on('message', this.messageListener)

        this.join(async () => {
            await this.configureOptions()
            await this.play()
        })
        // Allow game leader to configure options
        // Begin playing the game
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
                title: `${this.msg.author.tag} is starting a Cards Against Humanity game!`,
                description: `Type **${options.prefix}join** to join in the next **60 seconds**.`,
                color: 4886754
            }
        })
        this.addPlayer(this.gameMaster.id)

        const filter = m => (m.content.startsWith(`${options.prefix}join`) && !this.players.has(m.author.id)) || (m.author.id == this.gameMaster.id && m.content.startsWith(`${options.prefix}start`))
        const collector = this.msg.channel.createMessageCollector(filter, { max: this.playerCount.max, time: 60000 })
        this.collectors.push(collector)
        collector.on('collect', m => {
            if(this.ending) return
            if(m.content.startsWith(`${options.prefix}start`)) {
                collector.stop()
                return
            }
            this.addPlayer(m.author)
            m.delete()
            m.channel.send(`${m.author} joined!`)
        })

        collector.on('end', collected => {
            if(this.ending) return
            // check if there are enough players
            if(this.players.size >= this.playerCount.min) {
                var players = []
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
     * Allow the game leader to set options.
     */
    async configureOptions () {
        var leaderInfo
        await this.gameMaster.fetchDBInfo().then(info => { leaderInfo = info })
        var description = '**1.** 7-letter mode\n'
        var availableModes = [6]
        for(var key in EXPANSION_PACKS) {
            const pack = EXPANSION_PACKS[key]
            if(leaderInfo.unlockedItems.includes(key)) {
                availableModes.push(pack)
                description += `**${availableModes.length}.** ${key}`
            }
        }
        await this.msg.channel.send({
            embed: {
                title: 'Which mode would you like to play?',
                description,
                color: options.colors.info,
                footer: { text: 'Type the number of the mode you want to play.' }
            }
        })
        const filter = m => m.author.id == this.gameMaster.id && !isNaN(parseInt(m.content)) && parseInt(m.content) > 0 && parseInt(m.content) <= availableModes.length
        await this.msg.channel.awaitMessages(filter, { time: 60000, max: 1 }).then(collected => {
            const message = collected.first()
            this.mode = availableModes[parseInt(message.content) - 1]
        })
    }

    /**
     * Handles message events emitted by the client.
     * 
     * @param {Discord.Message} message The message emitted by the client.
    */
   onMessage(message) {
        // Only listen to messages sent in the game channel
        if(message.channel !== this.msg.channel) return
        
        // leader commands
        if(message.author.id == this.gameMaster.id) {
            // add command
            if(message.content.startsWith(`${options.prefix}add`)) {
                var user = message.content.substring(options.prefix.length + 3, message.content.length).replace(/\D/g, '')
                this.addPlayer(user)
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
    }

    /**
     * Add a player to the game.
     * @param {Discord.Member} member The member to add.
     * @param {string|Object} member The member or id of the member to add.
     */
    addPlayer(member) {
        if(this.stage != 'join' && this.stage != 'init') return
        if(typeof member == 'string') member = this.msg.guild.members.get(member)
        
        if(this.players.size >= this.playerCount.max) {
            this.msg.channel.sendMsgEmbed(`The game can't have more than ${this.playerCount.max} player${this.playerCount.max == 1 ? '' : 's'}! Player could not be added.`)
            return
        }

        if(this.players.has(member.id) || !member || member.bot) {
            this.msg.channel.sendMsgEmbed('Invalid user.', 'Error!', 13632027)
            return
        }

        if(member.id != this.gameMaster.id) this.msg.channel.sendMsgEmbed(`${member.user} was added to the game!`)
        member.user.createDM().then(dmChannel => {
            this.players.set(member.id, { score: 0, words: [], user: member.user, dmChannel })
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

    clearCollectors(collectors) {
        throw new Error('Error: This game does not have a clearCollectors() method.')
    }

    end() {
        throw new Error('Error: This game does not have an end() method.')
    }
    
    forceStop() {
        this.end()
        throw new Error('Error: This game does not have a forceStop() method.')
    }
}

// static fields
module.exports.id = 'game' // a 3-4 letter identifier for the game that people will use to start a game
module.exports.gameName = 'Game' // friendly name for display purposes
module.exports.playerCount = {
    min: 1, // minimum required player count
    max: 12 // maximum required player count
}
module.exports.genre = 'Game' // options are Card, Party, Board, Arcade, Tabletop, etc.
module.exports.about = 'A game.' // a one-sentence summary of the game
module.exports.rules = 'Rules about the game.' // explanation about how to play
