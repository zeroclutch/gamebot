import Game from '../../_Game/main.js'
import PromptList from './PromptList.js'
import options from '../../../config/options.js'
import metadata from '../metadata.js'
import logger from 'gamebot/logger'

import { PermissionFlagsBits } from 'discord-api-types/v10'

/**
 * The base class for Wisecracks games.
 * 
 * All content is the property of its respective owners.
 */
export default class Wisecracks extends Game {
    constructor(msg, settings) {
        super(msg, settings)
        
        this.metadata = metadata

        this.gameOptions = [
            {
                friendlyName: 'Hide inappropriate prompts',
                type: 'radio',
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

        // Add players to array
        this.playerList = Array.from(this.players.values())
        
        this.submissions = []
    }

    /**
     * Initialize the game with its specific settings.
     */
    async gameInit() {
        let list = ['./games/Wisecracks/assets/promptsSFW.txt']
        if(this.options['Hide inappropriate prompts'] === 'False') {
            list.push('./games/Wisecracks/assets/promptsNSFW.txt')
        }
        this.promptList = new PromptList(list)

        this.playerList = this.scramble(Array.from(this.players.values()))
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
        // Select the next two players
        return [this.playerList[i % this.players.size], this.playerList[(i + 1) % this.players.size]]
    }

    getWisecracks(player) {
        const duration = 120
        return new Promise((resolve, reject) => {
            try {
                this.msg.client.webUIClient.createWebUI(player.user, response => {
                    response = response.substring(0, 2048).trim()
                    
                    player.user.send({
                        embeds: [{
                            title: 'Successfully submitted!',
                            description: `You have entered: ${response}\n\n**Return to game channel:** ${this.channel}`,
                            color: options.colors.info
                        }]
                    })
                    resolve(response)
                }, {
                    message: `Enter your response to the prompt: <b>${this.prompt.raw}</b>`,
                    duration
                }).then(url => {
                    // Set timer 120 seconds
                    setTimeout(() => {
                        if(this.ending) reject()
                        resolve()
                    }, duration * 1000)

                    player.user.createDM()
                    .then(channel => {
                        channel.send({
                        embeds: [{
                            description: `[**Click here** to enter your response](${url}), ${player.user}! It will be sent in ${this.msg.channel}.`,
                            color: 5301186
                        }]
                        }).then(m => {
                            this.msg.channel.sendEmbed(`${player.user}, [click here to go to your DMs directly.](${m.url}) The link to enter your response is in your DMs!`)
                        }).catch(err => {
                                this.msg.channel.send({
                                    embeds: [{
                                        title: 'There was an error sending you a DM!',
                                        description: `Make sure you have DMs from server members enabled in your Privacy settings.`,
                                        color: options.colors.error
                                    }]
                                })
                                logger.error(err)
                            }
                        )
                    })
                }).catch(err => {
                    this.msg.channel.send({
                        embeds: [{
                            title: 'Error!',
                            description: `There was an error loading the response page.`,
                            color: 5301186
                        }]
                    })
                    reject(err)
                })
            } catch (err) {
                reject(err)
            }
        })
    }

    getVotes() {
    }

    displayLeaderboard() {
        let players = Array.from(this.players.values())
        let leaderboard = ''
        for(let i = 0; i < players.length; i++) {
            let lastLine = i == players.length - 1
            let player = players[i]
            leaderboard += `${player.user}: ${player.score} points${lastLine ? '' : '\n'}`
        }
        return {
            embeds: [{
                title: 'Current standings',
                description: leaderboard,
                color: options.colors.info,
                footer: {
                    text: `First to ${this.options['Points to Win']} wins!`
                }
            }]
        }
    }

    /**
     * @returns {object} Returns the winning player if there is one
     */
    hasWinner () {
        let arr = Array.from(this.players.values())
        let winners = []
        for(let i = 0; i < this.players.size; i++) {
            if(arr[i].score >= parseInt(this.options['Points to Win'])) {
                winners.push(arr[i])
            }
        }
        if(winners.length > 0)
            return winners
        else
            return false
    }

    playNextRound() {
        if(this.ending) return
        // Choose players who will face off
        let players = this.choosePlayers(this.index)
        this.index += 2
        // Get prompt
        this.prompt = this.promptList.get()
        this.channel.send({
            embeds: [{
                title: 'The prompt is...',
                description: this.prompt.escaped,
                color: options.colors.info,
                footer: {
                    text: 'Two players have to submit their responses to this by clicking the link below.'
                }
            }]
        })
        // Allow players to submit their Wisecracks™
        let submitted = []
        players.forEach(async player => {
            let response = await this.getWisecracks(player).catch(() => false)
            if(this.ending) return
            submitted.push({response, player, score: 0})
            if(submitted.length == players.length) {
                // Vote on Wisecracks
                this.channel.send({
                    embeds: [{
                        title: this.prompt.raw,
                        description: `${submitted.map((submission, i) => `**[${i + 1}]** ${submission.response || '**No response.**'}`).join('\n')}\n\nEveryone else, vote for your favorite answer!`,
                        footer: {
                            text: 'Type the number of the response to vote.'
                        },
                        color: options.colors.info
                    }]
                })
                let votes = []
                // Only allow vote-eligible players to submit once
                let collector = this.channel.createMessageCollector({
                    filter: m => !votes.includes(m.author.id)
                    && m.author.id !== players[0].user.id && m.author.id !== players[1].user.id 
                    && this.players.has(m.author.id)
                    && !isNaN(m.content) && (m.content === '1' || m.content === '2'), 
                    time: 120000
                })
                
                collector.on('collect', async message => {
                    if(this.ending) return
                    votes.push(message.author.id)
                    // Sort votes
                    if(message.content == '1') submitted[0].score++
                    if(message.content == '2') submitted[1].score++
                    
                    // Ensure we have permission to delete the message
                    if(await this._hasPermission(PermissionFlagsBits.ManageMessages)) message.delete().catch(logger.error.bind(logger))

                    if(votes.length === this.players.size - 2) {
                        collector.stop('submitted')
                    }
                })

                collector.on('end', async (collected, reason) => {
                    if(this.ending) return
                    let winner
                    if(submitted[0].score > submitted[1].score) {
                        winner = submitted[0]
                    } else if (submitted[0].score < submitted[1].score) {
                        winner = submitted[1]
                    } else {
                        winner = 'tie'
                    }

                    // Show results
                    this.channel.send({
                        embeds: [{
                            title: 'The winner is...',
                            description: winner == 'tie' ? `It was a tie between ${submitted[0].player.user} and ${submitted[1].player.user}!` : `${winner.player.user} for **${winner.response}**`,
                            footer: {
                                text: 'They earned one point.'
                            },
                            color: options.colors.info
                        }]
                    })

                    if(winner === 'tie') {
                        submitted[0].player.score++
                        submitted[1].player.score++
                    } else {
                        winner.player.score++
                    }

                    // Check if game is over
                    let gameWinner = this.hasWinner()
                    if(gameWinner) {
                        this.end(gameWinner)
                    } else {
                        this.channel.send(this.displayLeaderboard())
                        this.channel.send('The next round will start in 5 seconds.')
                        this.updatePlayers()
                        await this.sleep(5000)
                        this.playNextRound()
                    }
                })
            }
        })
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    play() {
        this.playNextRound()
    }
    

}
