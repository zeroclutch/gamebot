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
                type: 'radio',
                default: false,
                note: `Only show text prompts that aren't profane or lewd.`
            },
        ]

        this.defaultPlayer = {
            score: 0
        }

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
        this.promptList = new PromptList({
            
        })
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
            this.playerList = scramble(this.players.array())
        }

        // Select the next two players
        return [this.playerList[i], this.playerList[i + 1]]
    }

    getWisecracks(player) {
        return new Promise((resolve, reject) => {
            this.msg.client.webUIClient.createWebUI(player.user, response => {
                resolve(response)
            }, {
                message: `Enter your response to the prompt <b>${this.prompt}</b>`
            }).then(url => {
                
            })
        })
    }

    getVotes() {

    }

    displayLeaderboard() {

    }

    /**
     * @returns {Boolean} true if there is a winner
     */
    hasWinner () {
        return
    }


    async play() {
        let players = this.players.array()
        let index = 0
        do {
            // Choose players who will face off
            let players = this.choosePlayers(index)
            index += 2
            // Allow players to submit their Wisecracks™
            // Vote on Wisecracks
            // Display leaderboard
        } while(!this.hasWinner())
    }

    finish(id) {
        let winner = this.players.find(player => player.id == id)
        this.end(winner, `${winner.user} has won! ${this.renderBoard()}\nTo play games with the community, [join our server](${options.serverInvite})!`)
    }
    

}
