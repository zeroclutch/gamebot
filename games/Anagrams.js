const Game = require('./Game')
const options = require('./../config/options')
const Discord = require('../discord_mod')
const fs = require('fs')

var words = fs.readFileSync('./gameData/WordGames/Collins_Scrabble_Dictionary.txt', { encoding: 'utf-8' }, err => {
    console.error(err)
})

var wordRegistry = {}

words = words.split('\n')
words.splice(0,1)

words.forEach(word => wordRegistry[word] = true)

module.exports = class Anagrams extends Game {
    constructor(msg, settings) {
        settings = settings || {}
        settings.gameName = 'Anagrams'
        super(msg, settings)
        
        this.gameOptions = [
            {
                friendlyName: 'Game Mode',
                choices: ['Free for all', 'Team'],
                default: 'Free for all',
                type: 'radio',
                note: 'In free for all, each player finds anagrams to get their own score. In team, players work together in random teams to get a team score.'
            },
            {
                friendlyName: 'Custom word',
                default: 'none',
                type: 'free',
                filter: m => m.content.length == 7 && m.content.replace(/[A-Z]|[a-z]/g, '') == 0 || m.content.toLowerCase() == 'none',
                note: 'The new value must be 7 characters long and contain only letters. Type "none" to disable the custom word.',
            },
        ]
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    /**
     * Scrambles a string.
     * str {string} str The original string.
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
     * Sets the current word to a new word.
     * @param {number} length The length of the word.
     */
    chooseWord(length) {
        const validWords = words.filter(w => w.length == length)
        const index = Math.floor(Math.random()*validWords.length)
        console.log(index)
        this.word = this.scramble(validWords[index])
        console.log(validWords[index])
        console.log(this.word)
        return this.word
    }

    /**
     * Checks to see if a given word is a real word and enough letters.
     * @param {string} word The submitted word to be validated. 
     * @param {string} originalWord The original word.
     * @param {string} player The player submitting the word. 
     * @returns {boolean} Returns true if the word is valid.
     */
    validateWord(word, originalWord, player) {
        word = word.toUpperCase()

        // check if word is real
        if(!wordRegistry[word]) {
            return false
        }

        // check if word can be created
        for(var i = 0; i < word.length; i++) {
            var index = originalWord.indexOf(word[i])
            if(index < 0) return false
            originalWord = originalWord.replace(word[i], '')
        }
        return true
    }

    /**
     * Return the value of the word based on the word's length.
     * @param {string} word 
     */
    getWordScore(word) {
        const SCORES = [0, 0, 0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
        return SCORES[word.length] || 1000
    }
 
    /**
     * Starts a new Anagrams game
     */
    async playOneForAll(callback) {
        this.chooseWord(7)
        this.channel.sendMsgEmbed('The game will start in 5 seconds. Check your direct messages to see the letters you have to unscramble!')
        this.players.forEach(player => {
            player.dmChannel.send({
                embed: {
                    title: 'Anagrams',
                    description: `To earn points, make words using the letters below and send them in this channel. You have 60 seconds to make as many words as possible. You don't have to use all the letters, and longer words are worth more points.\n\n**The letters are: \`Loading...\`**`,
                    color: options.colors.info
                }
            }).then(async message => {
                await this.sleep(5000)
                message.edit({
                    embed: {
                        title: 'Anagrams',
                        description: `To earn points, make words using the letters below and send them in this channel. You have 60 seconds to make as many words as possible. You don't have to use all the letters, and longer words are worth more points.\n\n**The letters are: \`${this.word}\`**`,
                        color: options.colors.info
                    }
                })
            }).then(() => {
                // create a collector on each DM channel
                const filter = m => this.validateWord(m.content, this.word)
                const collector = player.dmChannel.createMessageCollector(filter, {time: 60000})
                collector.on('end', (collected) => {
                    player.words = []
                    player.dmChannel.send(`Time is up! Return to <#${this.channel.id}> for the results!`)
                    // validate each message sent for 60 seconds
                    collected.forEach(message => {
                        let word = message.content.toUpperCase()
                        // check if player already has submitted this word
                        if(!player.words.includes(word)) {
                            player.words.push(word)
                            player.score += this.getWordScore(message.content)
                        }
                    })
                    callback()
                })
            })
        })
    }

    play() {
        if(this.options['Game Mode'] == 'Free for all') {
            this.playOneForAll(() => {
                console.log('Player 1 got: ' + this.players.first().score)
                var fields = []
                var winner = [{ score: -1 }]
                this.players.forEach(player => {
                    if(player.score > winner[0].score) {
                        winner = [player]
                    } else if (player.score == winner[0].score) {
                        winner.push(player)
                    }

                    fields.push({
                        name: `${player.user.tag} - ${player.score} POINTS`,
                        value: player.words ? player.words.join(', ') : 'No words submitted.'
                    })
                })
                var title
                if(winner.length == 1) {
                    title = `The winner is ${winner[0].user.tag}!`
                } else {
                    title = 'The winners are '
                    winner.forEach(winningPlayer => {
                        title += winningPlayer.user.tag + ', '
                    })
                }

                this.channel.send({
                    embed: {
                        color: options.colors.info,
                        title,
                        fields
                    }
                }).then(() => {
                    this.end()
                })
            })
        } else if (this.options['Game Mode'] == 'Team') {

        }
    }
}

// static fields
module.exports.id = 'ana'
module.exports.gameName = 'Anagrams'
module.exports.playerCount = {
    min: 1,
    max: 12
}
module.exports.genre = 'Word'
module.exports.about = ''
module.exports.rules = ''