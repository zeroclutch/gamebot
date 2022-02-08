import Game from '../../_Game/main.js'
import options from './../../../config/options.js'
import { REPLIES } from './../../../config/types.js'
import metadata from './../metadata.js'
import Discord from './../../../discord_mod.js'
import { decrypt } from './../../../types/util/cryptography.js'
import fs from 'fs'
import { BUTTONS } from '../../../config/types.js'
import logger from 'gamebot/logger'

let questionList
decrypt(process.env.PASS_KEY, fs.readFileSync('./games/Survey Says/assets/data.enc', 'utf8'))
.then(data => questionList = JSON.parse(data))

export default class SurveySays extends Game {
    constructor(msg, settings) {
        super(msg, settings)
        
        this.metadata = metadata

        this.gameOptions = [
            {
                friendlyName: 'Timer',
                type: 'free',
                default: 60,
                filter: m => !isNaN(parseInt(m.content)) && (parseInt(m.content) <= 300) && (parseInt(m.content) >= 30),
                note: 'Enter a value in seconds for the countdown timer, between 30 and 300 seconds.'
            },
            {
                friendlyName: 'Points to Win',
                type: 'free',
                default: 5,
                filter: m => !isNaN(parseInt(m.content)) && (parseInt(m.content) <= 12) && (parseInt(m.content) >= 2),
                note: 'Enter how many points a player needs to win, between 2 and 12 points.'
            }
        ]

        this.defaultPlayer = {
            score: 0
        }

        this.question, this.questionList = [...questionList]

        this.guesser, this.guesserIndex = 0
    }

    select(arr) {
        let index = Math.floor(Math.random() * arr.length)
        let res = arr.splice(index, 1)
        return res[0]
    }

    /**
     * The play method, which begins the game and continues until a winner is found.
     */
    async play() {
        while(!this.getWinners() && !this.ending) {
            this.channel.send('The next round will begin in 5 seconds.')
            this.updatePlayers()
            await this.sleep(5000)

            // Pick random question
            do {
                this.question = this.select(this.questionList)
            } while(!this.question || !this.question.question)

            let guess = await this.awaitGuesserResponse().catch(logger.error)
            let submitted = await this.awaitPlayerResponse(guess).catch(logger.error)
            await this.sleep(3000)
            await this.awardPoints(guess, submitted)
        }
        this.end(this.getWinners())
    }

    /**
     * Adjusts the settings from user-friendly values to game-friendly values
     */
    async gameInit() {
        this.options['Timer'] = parseInt(this.options['Timer']) * 1000
    }

    async awaitGuesserResponse() {
        if(this.ending) return
        // Select a new guesser
        this.guesser = this.players.get(this.players.keyAt(this.guesserIndex++ % this.players.size))
        const filter = m => {
            if(isNaN(m.content) || m.author.id != this.guesser.user.id) return false
            let number = parseInt(m.content.replace('%',''))
            return number >= 0 && number <= 100
        }

        // Notify players
        await this.channel.sendEmbed(`The current guesser is ${this.guesser.user}! You get +1 point if you're within 10% of the real answer.\n\nYour question is: **${this.question.question}**`)

        // Await response
        let collected = await this.channel.awaitMessages({filter, max: 1, time: this.options['Timer'], errors: ['time']})
        .catch(err => {
            if(this.ending) return
            this.msg.channel.sendEmbed('You ran out of time. The guess is set to 50%', 'Uh oh...', options.colors.error)
        })
        if(this.ending) return
        return collected ? parseInt(collected.first().content.replace('%','')) : 50
    }

    async awaitPlayerResponse(guess) {
        if(this.ending) return
        // Send submission list
        let submitted = new Discord.Collection()
        let submissionList = await this.channel.send(this.renderSubmissionList(submitted, guess))

        let allPlayersSubmitted = false

        // Create message listener on channel
        const filter = i => this.players.has(i.user.id)

        return new Promise((resolve, reject) => {
            try {
                const collector = submissionList.createMessageComponentCollector({ filter, time: this.options['Timer']})

                collector.on('collect', i => {
                    if(this.ending) return
                    if(!submitted.has(i.user.id) && i.user.id !== this.guesser.user.id) {
                        // Update submitted list
                        submitted.set(i.user.id, i.customId)
                        // Update submission message
                        i.update(this.renderSubmissionList(submitted, guess))

                        if(submitted.size == this.players.size - 1) {
                            allPlayersSubmitted = true;
                            resolve(submitted)
                            collector.stop('submitted')
                        }
                    } else {
                        i.reply(REPLIES.DISALLOWED_ACTION)
                    }
                })

                // Resolve listener once collector ends
                collector.on('end', collected => {
                    if(this.ending) {
                        resolve(false)
                        return
                    }
                    if(allPlayersSubmitted) 
                        this.channel.sendEmbed('Drumroll please...')
                    resolve(submitted)
                })
            } catch (err) {
                reject(err)
            }
        })
    }

    async awardPoints(guess, submitted) {
        if(this.ending) return false
        let answer = guess < this.question.value ? BUTTONS.MORE : BUTTONS.LESS
        let correctGuessers = []
        let actualNumber = Math.floor(this.question.value * 10) / 10
        if(Math.abs(guess - actualNumber) <= 10) {
            correctGuessers.push(this.guesser.user.id)
            this.guesser.score++
        }

        if(submitted) {
            for(let [id, response] of submitted) {
                if(response == answer) {
                    correctGuessers.push(id)
                    this.players.get(id).score++
                }
            }
        }

        await this.channel.send({
            embeds: [{
                description: `The actual number was \`${actualNumber}%\`!\n\n${this.renderLeaderboard(correctGuessers)}`,
                color: options.colors.info,
                image: { url: 'attachment://image.png' }
            }],
            files: [{
               attachment: `games/Survey Says/assets/${answer}.png`,
               name: 'image.png'
            }]
        })
    }

    renderLeaderboard(correctGuessers) {
        let submissionList = ''
        this.players.forEach((player, id) => {
            if(correctGuessers && correctGuessers.includes(id)) {
                submissionList += '✅ '
            } else {
                submissionList += '<:red_x:933997651358277672> '
            }
            submissionList += `**${player.user}**: ${player.score} points\n`
        })
        return submissionList + `First to ${this.options['Points to Win']} points wins!`

    }

    renderSubmissionList(submitted, guess) {
        let submissionList = ''
        const icons = {
            more: '🔺',
            less: '🔻',
            none: '⬜️'
        }

        this.players.forEach((player, id) => {
            if(id == this.guesser.user.id) return
            submissionList += `${icons[submitted.get(id) || 'none']} **${player.user}**\n`
        })

        const submissionButtonRow = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
                .setCustomId(BUTTONS.MORE)
                .setLabel('More')
                .setStyle('SUCCESS'),
            new Discord.MessageButton()
                .setCustomId(BUTTONS.LESS)
                .setLabel('Less')
                .setStyle('DANGER'),
        )

        return {
            embeds: [{
                title: `Current guess: ${guess}% - ${this.question.question}`,
                description: submissionList + 'Select `More` if you thing the actual number is higher, or select `Less` if you think that it is lower.',
                color: options.colors.info,
            }],
            components: [ submissionButtonRow ]
        }
    }

    /**
     * Returns the winners if the game has a winner
     * @returns {Array<String>|Boolean} the array of winners if there is a winner, or false
     */
     getWinners() {
        let winners = []
        for(let [i, player] of this.players) {
            if(player.score >= this.options['Points to Win']) {
                winners.push(player)
            }
        }

        if(winners.length > 0)
            return winners
        else
            return false
    }

}
