// Global dependencies
import options from '../../../config/options.js'
import Discord from '../../../discord_mod.js'
import metadata from '../metadata.js'
import fs from 'fs'

// CAH dependencies
import Game from '../../_Game/main.js'
import canvas from 'canvas';
const { createCanvas, registerFont, loadImage } = canvas;
import { whiteCards } from '../assets/cards.js'
import CAHDeck from './CAHDeck.js'
import BlackCard from './BlackCard.js'

const CARD_PACKS = {
    '90sn_pack': '90s',
    'ai_pack': 'ai',
    'can_pack': 'Canadian',
    'pax_pset': ['PAX2015', 'PAXE2013', 'PAXE2014', 'PAXEP2014', 'PAXP2013', 'PAXPP2014'],
    'pol_pset': ['trumpbag', 'trumpvote', 'hillary'],
    'ram_pset': ['misprint', 'reject', 'reject2'],
    'bep_set': ['Box', 'greenbox'],
    'weed_pack': 'weed',
    'food_pack': 'food',
    'fant_pack': 'fantasy',
    'prd_pack': 'period',
    'www_pack': 'www',
    'sci_pack': 'science',
    'hoc_pack': 'HOCAH',
    'hol_pset': ['xmas2012', 'xmas2013'],
    'hum_pack': 'hum',
}

const CARD_BACKS = {
    'Default': {
        friendlyName: 'Default',
        backgroundColor: 'black',
        textColor: 'white'
    },
    'whi_back': {
        friendlyName: 'White Card Back',
        backgroundColor: 'white',
        textColor: 'black'
    },
    'ace_back': {
        friendlyName: 'Ace of Spades Back',
        backgroundImage: 'ace-of-spades.png',
        textColor: 'white'
    },
    'gold_back': {
        friendlyName: 'Golden Ticket Back',
        backgroundImage: 'golden-ticket.png',
        textColor: 'white'
    },
    'pride_back': {
        friendlyName: 'Pride Back',
        backgroundImage: 'pride.png',
        textColor: 'white'
    },
    'island_back': {
        friendlyName: 'Island Back',
        backgroundImage: 'island.png',
        textColor: 'white'
    },
    'mona_back': {
        friendlyName: 'Mona Lisa Back',
        backgroundImage: 'mona-lisa.png',
        textColor: 'white'
    },
    'star_back': {
        friendlyName: 'Starry Night Back',
        backgroundImage: 'starry-night.png',
        textColor: 'white'
    },
    'uni_back': {
        friendlyName: 'Unicorn Back',
        backgroundImage: 'unicorn.png',
        textColor: 'white'
    },
}

export default class CardsAgainstHumanity extends Game {
    /**
     * name: the name of the game 
     * playerCount: object with the minimum and maximum number of players
     *  - min: minimum player count
     *  - max: minimum player count
     * about: info about the game
     * rules: the instructions on how to play the game
     * players: array of players in the game, Array.<GuildMember>
     */
    constructor(msg, settings) {
        super(msg, settings)
        this.metadata = metadata
        this.czars
        this.czarIndex = 0
        this.czar
        this.playerCount = {
            min: 3,
            max: 20
        }
        this.submittedCards = []
        this.lastMessageID
        this.gameStart = false
        this.cardDeck
        this.collectors = []
        this.playersToKick = []
        this.playersToAdd = []

        // get settings
        this.settings.sets = ['Base', 'CAHe1', 'CAHe2', 'CAHe3', 'CAHe4', 'CAHe5', 'CAHe6']
        this.settings.isDmNeeded = true
        // Default options, reconfigured later in this.generateOptions()
        this.gameOptions = []

        this.defaultPlayer = {
            cards: 'Array',
            score: 0,
            currentHand: 'String',
            submitted: false
        }
        
        if(!this.settings.handLimit)   this.settings.handLimit   = 10
        if(!this.settings.pointsToWin) this.settings.pointsToWin = 5
    }

    get leader () { return this.gameMaster }

    /**
     * Initialize the game. Called before the play() method at the start of each game. 
     */
    async gameInit() {
        // create list of possible card czars
        this.updateCzars()

        // update settings
        this.settings.timeLimit   = parseInt(this.options['Timer']) * 1000
        this.settings.pointsToWin = parseInt(this.options['Points to Win'])

        // update set list
        this.settings.sets = await this.getSets(this.options['Sets'])
        
        // create and shuffle the deck
        this.cardDeck = new CAHDeck(this.settings.sets)
        this.cardDeck.shuffle()
    }

    sleep(ms) {
        this.stage = 'sleep'
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async clearCollectors (collectors) {
        await collectors.forEach(collector => {
            collector.stop('force stopped')
        })
        collectors = []
    }

    updateCzars() {
        this.czars = this.players.array()
        return this.czars
    }

    pickNextCzar() {
        this.czarIndex++
        if(!this.czars[this.czarIndex]) this.czarIndex = 0
        this.czar = this.czars[this.czarIndex]
        return this.czar
    }


    async generateOptions () {
        this.gameOptions = [
            {
                friendlyName: 'Sets',
                choices: await this.renderSetList(),
                default: ['**Base Set** *(460 cards)*', '**The First Expansion** *(80 cards)*', '**The Second Expansion** *(75 cards)*', '**The Third Expansion** *(75 cards)*', '**The Fourth Expansion** *(70 cards)*', '**The Fifth Expansion** *(75 cards)*', '**The Sixth Expansion** *(75 cards)*'],
                type: 'checkboxes',
                note: `You can purchase more packs in the shop, using the command \`${this.channel.prefix}shop cah\``
            },
            {
                friendlyName: 'Card Back',
                type: 'radio',
                choices: await this.renderCardBackList(),
                default: 'Default',
                note: `Select a card back. Type \`${this.channel.prefix}shop cah\` to view the card backs available for purchase.`
            },
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
                note: 'Enter a number of points to win, between 2 and 12 points.'
            },

        ]
    }

    async renderSetList () {
         // Build the list of sets
         let setList = []
         let whiteCount = 0

        // check available setLists
        this.availableSets = this.settings.sets.slice(0)
        // add defaults
        this.availableSets = this.settings.sets.concat(['BaseUK'])
        await this.gameMaster.fetchDBInfo().then(info => {
            // get unlocked items
            info.unlockedItems.forEach(item => {
                if(CARD_PACKS[item]) {
                    // map item ids to availableSets
                    let packs = CARD_PACKS[item]
                    if(typeof packs == 'string') this.availableSets.push(packs)
                    else this.availableSets = this.availableSets.concat(packs)
                }
            })
        }).catch(console.error)

        whiteCards.forEach((cards, metadata) => {
             if(!metadata.official) return
             if(!this.availableSets.includes(metadata.abbr)) return
             setList.push(`**${metadata.name}** *(${cards.length} cards)*`)
             if(this.settings.sets.includes(metadata.abbr)) whiteCount += cards.length
        })
        return setList
    }

    async renderCardBackList () {
        let cardBackList = ['Default']
        await this.gameMaster.fetchDBInfo().then(info => {
            // get unlocked items
            info.unlockedItems.forEach(item => {
                if(CARD_BACKS[item]) {
                    cardBackList.push(CARD_BACKS[item].friendlyName)
                }
            })
        }).catch(console.error)
        return cardBackList
    }

    /**
     * @returns List of sets by set ID
     */
    async getSets (setList) {
        // Extract pack name from string
        setList = setList.map(set => set.match(/([^\*\*])+(?=\*\*)/g).join())

        // Replace pack name with ID
        return setList
    }
    
    /**
     * Renders and sends a black card to the game channel.
     * @param {String} cardText The text to display on the card
     * @returns {Buffer} A buffer of the generated PNG
     */
    async renderCard (cardText) {
        const canvas = createCanvas(300, 300)
        const ctx = canvas.getContext('2d')

        // register fonts
        registerFont('./assets/fonts/SF-Pro-Display-Bold.otf', {family: 'SF Pro Display Bold'})
        
        let cardBack = CARD_BACKS['Default']
        for(let id in CARD_BACKS) {
            if(CARD_BACKS[id].friendlyName == this.options['Card Back']) {
                cardBack = CARD_BACKS[id]
            }
        }

        // Add background color
        if(cardBack.backgroundColor) {
            // add bg
            ctx.fillStyle = cardBack.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Add background image
        if(cardBack.backgroundImage) {
            await loadImage(fs.readFileSync(`./assets/images/card-backs/${cardBack.backgroundImage}`))
            .then(image =>  {
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
            })
        }
        
        // add text
        ctx.fillStyle = cardBack.textColor;
        ctx.font = '22px SF Pro Display Bold'
        let wordList = cardText.split(/[\n\s]/g),
            textLine = '',
            textTotal = ''
        for(let i = 0; i < wordList.length; i++) {
            // See if adding the next word would exceed the size
            if(ctx.measureText(textLine + wordList[i]).width > 255) {
                textTotal += textLine + '\n'
                textLine = ''
            }
            textLine += wordList[i] + ' '
        }
        textTotal += textLine
        ctx.fillText(textTotal , 25, 45)
        
        await loadImage(fs.readFileSync(`./assets/images/icons/logo-icon-${['white', 'black'].includes(cardBack.textColor) ? cardBack.textColor : 'white'}.png`))
        .then(image =>  {
            ctx.drawImage(image, 20, 256, 18, 16)
        })

        ctx.font = '16px SF Pro Display Bold'
        ctx.fillText('Gamebot for Discord', 50, 270)
        
        const fileName = Math.round(Math.random()*1000000) + '.png'
        const stream = canvas.createJPEGStream({
            quality: 1,
            chromaSubsampling: false,
            progressive: true
        })
        const embed = new Discord.MessageEmbed()
        .setTitle('This round\'s black card')
        .attachFiles([{
            attachment: stream,
            name: fileName
        }])
        .setFooter(this.blackCard.clean)
        .setImage(`attachment://${fileName}`)
        .setColor(4886754)

        this.client.logger.log('Generated image', {
            game: this.metadata.id,
        })

        this.msg.channel.send(embed).catch(console.error)
        return stream
    }

    renderPlayerHand(player) {
        // write out the list of cards
        let cardList = ''
        for(let i = 0; i < player.cards.length; i++) {
            let card = player.cards[i]
            if(card == '') continue
            cardList += `**${i + 1}:** ${card}\n`
        }
        return `The selected black card is: **${this.blackCard.escaped}**\n\n${cardList}\nEnter the number next to the card in the channel <#${this.channel.id}> to select it. You need to select ${this.blackCard.responses} more cards.`
    }

    renderSubmissionStatus() {
        let links = ''
        for(let item of this.players) {
            // create reference variables
            let key = item[0]
            let player = item[1]

            // skip the czar
            if(key == this.czar.user.id) continue

            if(player.submitted == 'time') {
                links += `${player.user} ⚠️ Time ran out!\n`
            } else if(player.submitted) {
                links += `${player.user} ✅ Submitted!\n`
            } else {
                links += `${player.user} ⛔ Not submitted. | [**VIEW HAND** *(player only)*](${player.currentHand})\n`
            }
        }
        return links
    }

    renderCardChoices() {
        let text = `The selected black card is: **${this.blackCard.escaped}**\n\n${this.czar.user}, select one of the white card choices below.\n\n`
        
        for(let i = 0; i < this.submittedCards.length; i++) {
            let card = this.submittedCards[i].card.join(', ')
            text += `**${i + 1}:** ${card}\n`
        }
        return text
    }
     
    renderLeaderboard() {
        let text = ''
        this.players.forEach(player => {
            text += `${player.user}: ${player.score || 0}\n`
        })
        return text
    }
    
    async reset() {
        // discard cards 
        if(this.blackCard) this.cardDeck.discard('black', [this.blackCard.text])

        // reset submissions
        this.submittedCards = []
        for(let item of this.players) {
            // create reference variables
            let key = item[0]
            let player = item[1]
            player.submitted = false
        }

        this.playersToAdd = []
        this.playersToKick = []
    }

    async runSelection() {
        // prevent duplicate selection phases
        if(this.stage == 'selection' || this.ending) return
        this.stage = 'selection'

        // display the card choices from each player anonymously
        await this.msg.channel.send({
            embed: {
                title: 'Choose the best card, Card Czar',
                description: this.renderCardChoices(),
                footer: {
                    text: `Type the number of the card to select it.`
                 },
                color: 4886754
            }
        })

        if(this.submittedCards.length == 0) {
            this.msg.channel.sendMsgEmbed('There were no submissions for this card!', 'Uh oh...')
            // display the scores
            this.msg.channel.send({
                embed: {
                    title: 'Current Standings',
                    description: this.renderLeaderboard(),
                    color: 4886754,
                    footer: {
                        text: `First to ${this.settings.pointsToWin} wins!`
                    }
                }
            })
            this.play()
            return
        }
        // let the Card Czar choose one
        const filter = m => (!isNaN(m.content) &&  m.author.id == this.czar.user.id && parseInt(m.content) <= this.submittedCards.length && parseInt(m.content) > 0)
        this.msg.channel.awaitMessages(filter, { max: 1, time: this.settings.timeLimit })
        .then(async collected => {
            if(this.ending) return
            collected.forEach(async m => {
                let index = parseInt(m.content) - 1
                let winner = this.submittedCards[index]

                // announce winner
                await this.msg.channel.send({
                    embed: {
                        title: '',
                        description: `The winning card is **${winner.card.join(', ')}** which belonged to ${winner.player.user}!\n\n${winner.player.user} has earned a point.`,
                        color: 4886754
                    }
                })

                // give the winning player a point
                let winningPlayer = winner.player 
                winningPlayer.score = winningPlayer.score || 0
                winningPlayer.score++ 

                // display the scores
                this.msg.channel.send({
                    embed: {
                        title: 'Current Standings',
                        description: this.renderLeaderboard(),
                        color: 4886754,
                        footer: {
                            text: `First to ${this.settings.pointsToWin} wins!`
                        }
                    }
                })

                if(winningPlayer.score >= this.settings.pointsToWin) {
                    this.end(winningPlayer)
                } else {
                    await this.play()
                }
            })

            // if time ran out
            if(collected.size == 0) {
                this.msg.channel.send({
                    embed: {
                        title: 'Time\'s up',
                        description: `There was no winner selected.`,
                        color: 13632027
                    }
                })

                // display the scores
                this.msg.channel.send({
                    embed: {
                        title: 'Current Standings',
                        description: this.renderLeaderboard(),
                        color: 4886754,
                        footer: {
                            text: `First to ${this.settings.pointsToWin} wins!`
                        }
                    }
                })
                await this.play()
            }
        })
        .catch(async err => {
            console.error(err)
            
        })
    }

    async play() {
        if(this.stage == 'sleeping' || this.ending) return
        await this.msg.channel.send('The next round will begin in 5 seconds.')

        this.updatePlayers()

        // check if game end
        if(this.ending) {
            let winner = { score: -1 }
            for(let item of this.players) {
                // create reference variables
                let key = item[0]
                let player = item[1]
                if(player.score > winner.score) {
                    winner = player
                }
            }
            this.end(winner)
            return
        }

        await this.reset()
        this.updateCzars()
        this.stage = 'sleeping'
        await this.sleep(5000)
        this.playGame()
    }

    async playGame() {
        if(this.ending) return
        this.stage = 'play'

        // choose a black card
        // only select single-blanks
        do {
            this.blackCard = new BlackCard(this.cardDeck.draw('black')[0])
        } while(this.blackCard.responses > 1 || !this.blackCard.text || this.blackCard.text.length == 0)
        if(!this.blackCard.text) {
            console.error('Error: card loaded with no text')
        }
        
        // render and send card image
        await this.renderCard(this.blackCard.clean)

        this.pickNextCzar()

        await this.msg.channel.send({
            embed: {
                description: `The current czar is ${this.czar.user}! Wait until the other players have submitted their cards, then choose the best one.`,
                color: 4886754
            }
        })

        // draw cards 
        for(let item of this.players) {
            // create reference variables
            let key = item[0]
            let player = item[1]

            // skip the czar 
            if(key == this.czar.user.id) continue

            // refill hand to max limit
            player.cards = player.cards || []
            player.cards = player.cards.concat(this.cardDeck.draw('white', this.settings.handLimit - player.cards.length))

            // dm each player with their hand
            await player.user.send('View your hand and select a card.', {
                embed: {
                    title: `Cards Against Humanity - Your Current Hand`,
                    description: this.renderPlayerHand(player),
                    color: 4886754
                }
            }).then(async m => {
                await player.user.send('View your hand and select a card.',{
                    embed: {
                        description: `Remember, type your card number in <#${this.channel.id}>, NOT in this channel!`,
                        color: options.colors.warning,
                        footer:  {
                            text: 'This is due to a recent change in Gamebot. For more info, see our support server.'
                        }
                    }
                })
                player.currentHandID = m.id
                player.currentHand = m.url
                player.dmChannel = m.channel
            })
        }
        // create new listener on the main channel
        let filter = m => {
            if(isNaN(m.content) ||
            !this.players.has(m.author.id) ||
            m.author.id == this.czar.user.id ||
            this.players.get(m.author.id).submitted) {
                return false
            }
            
            let number = parseInt(m.content)
            // Only allow valid card indexes to be selected
            return number <= this.settings.handLimit && number > 0 && this.players.get(m.author.id).cards[number - 1] != '' 
        }
        
        // await X messages, depending on how many white cards are needed
        let collector = this.channel.createMessageCollector(filter, { time: this.settings.timeLimit });

        this.collectors.push(collector)
        collector.on('collect', m => {
            if(this.ending) return

            m.delete()

            let player = this.players.get(m.author.id)
            let cardRemoved = parseInt(m.content) - 1
            // tell user which card they selected
            player.dmChannel.sendMsgEmbed(`You have selected: ${player.cards[cardRemoved]}\n\n**Return to game chat: <#${this.channel.id}>**`)

            // save selection for one card
            this.submittedCards.push({
                player,
                card: [player.cards[cardRemoved]]
            })
            player.submitted = true

            // update in chat
            this.msg.channel.messages.fetch(this.lastMessageID).then(message => {
                message.edit('', {
                    embed: {
                        title: 'Submission status',
                        description: this.renderSubmissionStatus(),
                        color: 4513714
                    }
                })
            })

            // remove cards from hand
            player.cards.splice(cardRemoved, 1, '')

            if(this.submittedCards.length == this.players.size - 1) {
                collector.stop()
            }

        })

        collector.on('end', (collected, reason) => {
            if(this.ending) return
            // check all players at the end
            for(let item of this.players) {
                // create reference variables
                let key = item[0]
                let player = item[1]

                // handle timeout
                if(reason == 'time' && !player.submitted && this.czar.user.id != player.user.id) {
                    player.submitted = 'time'
                    player.dmChannel.send({
                        embed: {
                            description: `Time has run out. **Return to game chat <#${this.channel.id}>.**`,
                            color: options.colors.info
                        }
                    })
                }

                // remove the empty cards
                player.cards = player.cards.filter(card => card != '')
            }

            // update in chat
            this.msg.channel.messages.fetch(this.lastMessageID).then(message => {
                message.edit('', {
                    embed: {
                        title: 'Submission status',
                        description: this.renderSubmissionStatus(),
                        color: 4513714
                    }
                })
            })

            if(this.stage != 'selection') {
                CAHDeck.shuffleArray(this.submittedCards)
                this.clearCollectors(this.collectors)
                this.runSelection()
            }
        })

        // send an embed to main channel with links to each player hand [Go to hand](m.url)
        this.msg.channel.sendMsgEmbed(this.renderSubmissionStatus(), 'Submission status').then(m => {
            this.lastMessageID = m.id
        }).catch(err => {
            console.error(err)
        })
    }

}