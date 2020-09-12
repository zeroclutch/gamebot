const Game = require(`../../Game`)
const PromptList = require('./PromptList')
const options = require('../../../config/options')
const metadata = require('../metadata.json')

/**
 * The base class for Connect 4 games.
 * 
 * All content is the property of its respective game owners
 */
module.exports = class Wisecracks extends Game {
    constructor(msg, settings) {
        super(msg, settings)
        
        this.metadata = metadata

        this.gameOptions = [
            {
                friendlyName: 'Hide inappropriate prompts',
                type: 'checkbox',
                default: 'False',
                choices: ['True', 'False'],
                note: `Only show text prompts that aren't profane or lewd.`
            },
            {
                friendlyName: 'Points to Win',
                type: 'free',
                default: 5,
                filter: m => !isNaN(parseInt(m.content)) && (parseInt(m.content) <= 12) && (parseInt(m.content) >= 2),
                note: 'Enter a number of points to win, between 2 and 12 points.'
            },
        ]

        this.defaultPlayer = {
            score: 0
        }

        this.index = 0

        this.settings.isDmNeeded = true

        this.timeLimit = 60000

        this.playerList = this.players.array()
        this.submissions = [
        ]
    }

    /**
     * Initialize the game with its specific settings.
     */
    async gameInit() {
        console.log(__dirname)
        let list = ['./games/Wisecracks/assets/promptsSFW.txt']
        if(this.options['Hide inappropriate prompts'] === 'False') {
            list.push('./games/Wisecracks/assets/promptsNSFW.txt')
        }
        this.promptList = new PromptList(list)
        return
    }

    /**
     * Scrambles an array
     * @param {Array} arr The input array
     * @returns {Array} The scrambled array
     */
    scramble(arr) {
        let array = Array.from(arr)
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array
    }

    /**
     * Select the players who will face off in the next round
     * @param {Number} i Index of first player
     */
    choosePlayers(i) {
        // If we are at the end of the current list, begin anew
        if(i >= this.playerList.length - 2) {
            this.playerList = this.scramble(this.players.array())
        }

        // Select the next two players
        return [this.playerList[i], this.playerList[i + 1]]
    }

    getWisecracks(player) {
        return new Promise((resolve, reject) => {
            this.msg.client.webUIClient.createWebUI(player.user, response => {
                resolve(response)
            }, {
                message: `Enter your response to the prompt: <b>${this.prompt.raw}</b>`,
                duration: 120
            }).then(url => {
                player.user.createDM()
                .then(channel => {
                    channel.send({
                    embed: {
                        description: `[**Click here** to enter your response](${url}), ${this.msg.author}! It will be sent in ${this.msg.channel}.`,
                        color: 5301186
                    }
                    }).then(m => {
                        this.msg.channel.sendMsgEmbed(`${player.user}, [click here to go to your DMs directly.](${m.url}) The link to enter your response is in your DMs!`)
                    }).catch(err => {
                            this.msg.channel.send({
                                embed: {
                                    title: 'There was an error sending you a DM!',
                                    description: `Make sure you have DMs from server members enabled in your Privacy settings.`,
                                    color: options.colors.error
                                }
                            })
                            console.error(err)
                        }
                    )
                })
            }).catch(err => {
                this.msg.channel.send({
                    embed: {
                        title: 'Error!',
                        description: `There was an error loading the response page.`,
                        color: 5301186
                    }
                })
                reject(err)
            })
        })
    }

    getVotes() {
        //
    }

    displayLeaderboard() {

    }

    /**
     * @returns {object} Returns the winning player if there is one
     */
    hasWinner () {
        let arr = this.players.array()
        for(let i = 0; i < this.players.size; i++) {
            if(arr[i] >= this.options['Points to Win']) {
                return arr[i]
            }
        }
        return false
    }

    playNextRound() {
        // Choose players who will face off
        let players = this.choosePlayers(this.index)
        this.index += 2
        // Get prompt
        this.prompt = this.promptList.get()
        this.channel.send({
            embed: {
                title: 'The prompt is',
                description: this.prompt.escaped,
                color: options.colors.info
            }
        })
        // Allow players to submit their Wisecracks™
        let submitted = []
        players.forEach(async player => {
            let response = await this.getWisecracks(player)
            submitted.push({response, player, score: 0})
            if(submitted.length == players.length) {
                // Vote on Wisecracks
                this.channel.send({
                    embed: {
                        title: this.prompt,
                        description: `${submitted.map((submission, i) => `**[${i + 1}]** ${submission.player.user}: ${submission.player.response}`).join('\n')}`,
                        footer: {
                            text: 'Type the number of the response to submit it.'
                        },
                        color: options.colors.info
                    }
                })
                let votes = []
                // Only allow vote-eligible players to submit once
                let collector = this.channel.createMessageCollector(
                    m => !votes.includes(m.author.id)
                    && m.author.id !== players[0].user.id && m.author.id !== players[1].user.id 
                    && this.players.find(player => player.user.id == m.author.id
                    && !isNaN(m.content) && (m.content === '1' || m.content === '2'), {time: 120000, max: this.players.size})
                )
                collector.on('collect', message => {
                    votes.push(message.author.id)
                    // Sort votes
                    if(message.content == '1') submitted[0].score++
                    if(message.content == '2') submitted[1].score++
                    message.delete()
                })

                collector.on('end', collected => {
                    let winner
                    if(submitted[0].score > submitted[0].score) {
                        winner = submitted[0]
                    } else if (submitted[0].score > submitted[1].score) {
                        winner = submitted[1]
                    } else {
                        winner = 'tie'
                    }
                    // Show results
                    this.channel.send({
                        embed: {
                            title: 'The winner is...',
                            description: winner == 'tie' ? `It was a tie between ${submitted[0].player.user} and ${submitted[1].player.user}` : `${winner.player.user} for **${submitted.response}**`
                        }
                    })
                    winner.player.score++

                    // Check if game is over
                    let gameWinner = this.hasWinner()
                    if(gameWinner) {
                        this.end(gameWinner)
                    } else {
                        this.playNextRound()
                    }
                })
            }
        })
    }

    async play() {
        this.playNextRound()
    }

    finish(id) {
        let winner = this.players.find(player => player.id == id)
        this.end(winner, `${winner.user} has won! ${this.renderBoard()}\nTo play games with the community, [join our server](${options.serverInvite})!`)
    }
    

}
