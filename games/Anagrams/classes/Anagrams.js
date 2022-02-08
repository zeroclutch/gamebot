import Game from '../../_Game/main.js'
import options from '../../../config/options.js'
import metadata from '../metadata.js'
import logger from 'gamebot/logger'
import fs from 'fs'

let words = fs.readFileSync('./gameData/WordGames/Collins_Scrabble_Dictionary.txt', { encoding: 'utf-8' }, err => {
    logger.error(err)
})

let wordRegistry = {}

words = words.split('\n')
words.splice(0,1)

words.forEach(word => wordRegistry[word] = true)

export default class Anagrams extends Game {
    constructor(msg, settings) {
        super(msg, settings)
        this.metadata = metadata
        this.gameOptions = [
            {
                friendlyName: 'Game Mode',
                choices: ['Frenzy'/*, 'DMs'*/],
                default: 'Frenzy',
                type: 'radio',
                note: 'In frenzy, the game is played in this channel, and two players cannot submit the same word.'
            },
            {
                friendlyName: 'Custom Word',
                default: 'none',
                type: 'free',
                filter: m => m.content.length === 7 && m.content.replace(/[A-Z]|[a-z]/g, '') === '' || m.content.toLowerCase() == 'none',
                note: 'The new value must be 7 characters long and contain only letters. Enter "none" to disable the custom word.',
            },
        ]

        this.defaultPlayer = {
            words: 'Array',
            score: 0
        }

        this.settings.defaultUpdatePlayerMessage = null
        
        this.words = []
    }

    /**
     * Initialize the game with its specific settings.
     */
    gameInit() {
        this.settings.updatePlayersAnytime = true
    }

    /**
     * Scrambles a string.
     * str {string} str The original string.
     * @return {string} The scrambled string.
     */
    scramble(str) {
        let arr = str.split(''),
        n = arr.length;

        for(let i = n - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let tmp = arr[i];
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
        this.pangram = validWords[index]
        this.word = this.scramble(validWords[index])
        return this.word
    }

    /**
     * Converts a word into Discord emojis
     * @param {String} word 
     */
    emojify(word) {
        return word.split('').map(letter => `\`${letter.toUpperCase()}\``).join(' ')
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

        if(word.length < 3) {
            return false
        }

        if(this.words.includes(word)) {
            return false
        }

        // check if word can be created
        for(let i = 0; i < word.length; i++) {
            let index = originalWord.indexOf(word[i])
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
        const SCORES = [0, 0, 0, 50, 100, 200, 400, 600, 700, 800, 900, 1000, 1100, 1200]
        return !isNaN(SCORES[word.length]) ? SCORES[word.length] : 1200
    }
 
    /**
     * Starts a new Anagrams game
     */
    async playFrenzy(callback) {
        if(this.options['Custom Word'] == 'none') {
            this.chooseWord(7)
        } else {
            this.word = this.options['Custom Word'].toUpperCase()
        }
        this.channel.send({
            embeds: [{
                title: 'Anagrams',
                description: `The game will start in 5 seconds.\n\nTo earn points, make words using the letters below and send them in this channel. You have 60 seconds to make as many words as possible. You don't have to use all the letters, and longer words are worth more points.\n\n**The letters are: \`Loading...\`**`,
                color: options.colors.info
            }]
        }).then(async message => {
            await this.sleep(5000)
            message.edit({
                embeds: [{
                    title: 'Anagrams',
                    description: `To earn points, make words using the letters below and send them in this channel. You have 60 seconds to make as many words as possible. You don't have to use all the letters, and longer words are worth more points.\n\n**The letters are: ${this.emojify(this.word)}**`,
                    color: options.colors.info
                }]
            })
        }).then(() => {
            // create a collector on the main channel
            const filter = m => !m.author.bot  || m.client.isTestingMode
            const ROUND_LENGTH = 60000
            const collector = this.channel.createMessageCollector({filter, time: ROUND_LENGTH})
            const isPangram = word => word.length == this.word.length

            collector.on('collect', message => {
                if(this.ending) return

                const player = this.players.get(message.author.id)
                if(!player) return

                if(!this.validateWord(message.content, this.word, player)) return
                let word = message.content.toUpperCase()
                
                player.words = player.words || []

                let score = this.getWordScore(message.content)
         
                this.words.push(word)
                player.words.push(word)
                player.score += score
                this.channel.sendEmbed(`<@${message.author.id}> got **${word}** for **${score}** points.\n\nThe letters are: ${this.emojify(this.word)}`, isPangram(word) ? 'PANGRAM!' : '', isPangram(word) ? options.colors.economy : options.colors.info)
            })

            setTimeout(() => {
                if(this.ending) return
                callback()
            }, ROUND_LENGTH)
        })
    }

    /**
     * Starts a new Anagrams game in DMs
     */
    async playDMs(callback) {
        if(this.options['Custom Word'] == 'none') {
            this.chooseWord(7)
        } else {
            this.word = this.options['Custom Word'].toUpperCase()
        }
        this.channel.sendEmbed('The game will start in 5 seconds. Check your direct messages to see the letters you have to unscramble!')
        this.players.forEach(player => {
            // Alert each user the game is starting
            player.dmChannel.send({
                embeds: [{
                    title: 'Anagrams',
                    description: `To earn points, make words using the letters below and send them in this channel. You have 60 seconds to make as many words as possible.\n\n**The letters are: \`Loading...\`**`,
                    color: options.colors.info
                }]
            }).then(async message => {
                // Wait 5 seconds before start
                await this.sleep(5000)
                message.edit({
                    embeds: [{
                        title: 'Anagrams',
                        description: `To earn points, make words using the letters below and send them in this channel. You have 60 seconds to make as many words as possible.\n\n**The letters are: ${this.emojify(this.word)}**`,
                        color: options.colors.info
                    }]
                })
                // create a collector on each DM channel
                 //this.validateWord(m.content, this.word) && !player.words.includes(word)
                //console.log(player.dmChannel)
                player.user.createDM().then(channel => {
                    const filter = m => {
                        return true
                    }
                    let collector = channel.createMessageCollector({ filter, time: 15000 })
                    collector.on('collect', m => console.log(`Collected ${m.content}`))
                    collector.on('end', collected => console.log(`Collected ${collected.size} items`));
                    
                })
                /* collector.on('collect', (message) => {
                    let word = message.content.toUpperCase()
                    let score = this.getWordScore(word)
                    player.dmChannel.send({
                        embeds: [{
                            description: `You got **${word}** for **${score}** points.\n\nThe letters are: \`${this.word}\``,
                            title: isPangram(word) ? 'PANGRAM!' : '', 
                            color: isPangram(word) ? options.colors.economy : options.colors.info
                        }]
                    })
                    player.score += this.getWordScore(word)
                    player.words.push(word)
                })*/
                /*player.collector.on('end', (collected) => {
                    callback()
                })*/
            }).catch(logger.error)
        })
    }

    play() {
        if(this.options['Game Mode'] == 'Frenzy') {
            this.playFrenzy(() => {this.finish()})
        } else if (this.options['Game Mode'] == 'DMs') {
            this.playDMs(() => {this.finish()})
        }
    }

    finish() {
        let fields = []
        let winner = [{ score: -1 }]
        this.players.forEach(player => {
            if(player.score > winner[0].score) {
                winner = [player]
            } else if (player.score == winner[0].score) {
                winner.push(player)
            }

            fields.push({
                name: `${player.user.tag} - ${player.score} POINTS`,
                value: player.words && player.words.length > 0 ? player.words.join(', ') : 'No words submitted.'
            })
        })

        // Add pangram
        fields.push({ name: 'Pangram', value: `The pangram was ${this.pangram}.` })

        this.channel.send({
            embeds: [{
                color: options.colors.info,
                title: 'Scoreboard',
                fields
            }]
        }).then(() => {
            this.end(winner)
        })
    }
    

}
