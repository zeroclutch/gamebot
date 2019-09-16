// global dependencies
const Game = require('../games/Game')
const Discord = require('../discord_mod')
const options = require('../config/options')
const fs = require('fs')

var words = fs.readFileSync('./gameData/WordGames/Collins_Scrabble_Dictionary.txt', { encoding: 'utf-8' }, err => {
    console.error(err)
})

words = words.split('\n')
words.splice(0,1)

const EXPANSION_PACKS = {
    '8let-mode': 8,
    '9let-mode': 9,
    '10let-mode': 10,
    '12let-mode': 12,
}

const SCORES = new Discord.Collection()
SCORES.set(1, 0)
SCORES.set(2, 0)
SCORES.set(3, 50)
SCORES.set(4, 100)
SCORES.set(5, 200)
SCORES.set(6, 300)
SCORES.set(7, 400)
SCORES.set(8, 500)
SCORES.set(9, 600)
SCORES.set(10, 700)
SCORES.set(11, 800)
SCORES.set(12, 900)
SCORES.set(13, 1000)


/** @class Class representing My Game */
module.exports = class MyGame extends Game {
    /**
     * Creates and instantiates a new MyGame.
     * 
     * @constructor
     * @param {Discord.Message} msg The original message that was sent to start the game.
     * @param {object} settings The settings the game master uses to configure the game.
     */
    constructor(msg, settings) {
        super()

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
        this.word = 'DEFAULT'
        this.mode = 7
        this.minLetters = 3

        /** RECOMMENDED FIELDS **/
        this.stage = 'init'
    }

    /**
     * Gets the leader of the game.
     *
     * @return {Discord.User} The leader of the game.
     */
    get leader() {
        return this.gameMaster
    }

    /**
     * Scrambles a string.
     * @return {string} str The original string.
     * @return {string} The scrambled string.
     */
    scramble(str) {
        var arr = str.split(''),
        n = arr.length;

        for(var i = n - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr.join('');
    }

    /**
     * Begins a new game. This will be called by the play command.
     *
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
     * Sets the current word to a new word.
     * @param {number} length The length of the word.
     */
    async chooseWord(length) {
        const validWords = words.filter(w => w.length == length)
        const index = Math.floor(Math.random()*validWords.length)
        console.log(index)
        this.word = this.scramble(words[index])
        console.log(words[index])
        console.log(this.word)
        return this.word
    }

    /**
     * Checks to see if a given word is a real word and enough letters.
     * @param {string} word The word to be validated. 
     * @returns {boolean} Returns true if the word is valid.
     */
    async validateWord(word) {
        word = word.toUpperCase()
        var original = this.word

        // check if word can be created
        if(word.length < this.minLetters) return false
        for(var i = 0; i < word.length; i++) {
            const letter = word[i]
            const index = original.indexOf(letter)
            if(index > -1) {
                // remove letter
                original.splice(index, 1)
            } else {
                return false
            }
        }

        // check if word is real
        if(words.indexOf(word) > -1) {
            return true
        }
        return false
    }

    async play() {
        await this.chooseWord(this.mode)
        this.players.forEach(player => {
            player.dmChannel.send('The word is ' + this.word)
        })
        // create a collector on each DM channel
        // validate each message sent for 60 seconds
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
                this.kickPlayer(user)
            }
        } else {
            // leave command
            if(message.content.startsWith(`${options.prefix}leave`)) {
                // check if the player count will stay within the min and max
                // remove player from this.players
            }
        }
    }

    /**
     * Add a player to the game.
     * @param {Discord.Member} member The member to add.
     * @param {string} member The id of the member to add.
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
     * Kick a player from the game.
     * @param {Discord.Member} member The member to kick.
     * @param {string} member The id of the member to kick.
     */
    kickPlayer(member) {
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

    sleep(ms) {
        this.stage = 'sleep'
        return new Promise(resolve => setTimeout(resolve, ms));
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
     * @param {object} winner
     */
    end(winner) {
        // Send a message in the game channel (this.msg.channel) that the game is over.
        this.clearCollectors(this.collectors)
        // Remove all event listeners created during this game.
        this.msg.channel.gamePlaying = false
        this.msg.channel.game = undefined
    }

    /**
     * Force ends a game. This will be called by the end command.
     */
    forceStop() {
        this.ending = true
        this.end()
    }

}

// static fields
module.exports.id = 'ana' // a 3-4 letter identifier for the game that people will use to start a game
module.exports.gameName = 'Anagrams' // friendly name for display purposes
module.exports.playerCount = {
    min: 1, // minimum required player count
    max: 20 // maximum required player count
}
module.exports.genre = 'Word' // options are Card, Party, Board, Arcade, Tabletop, etc.
module.exports.about = 'Unscramble words faster than your friends!' // a one-sentence summary of the game
module.exports.rules = 'Players are sent a DM with the word that they have to unscramble. Type as many 3+ letter words as possible before time runs out. At the end, the scores are tallied up and the winner is announced.' // explanation about how to play