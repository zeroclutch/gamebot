// Global dependencies
const options = require('../../../config/options')
const Discord = require('../../../discord_mod')
const metadata = require('../metadata.json')
const fs = require('fs')

// CAH dependencies
const Game = require('../../Game')
const { createCanvas, registerFont, loadImage } = require('canvas')
const { whiteCards } = require('../assets/cards')
const CAHDeck = require('./CAHDeck')
const BlackCard = require('./BlackCard')

const CARD_PACKS = {
    '90sn_pack': '90s',
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
    'hol_pset': ['xmas2012', 'xmas2013']
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

module.exports = class CardsAgainstHumanity extends Game {
    /**
     * name: the name of the game 
     * playerCount: object with the minimum and maximum number of players
     *  - min: minimum player count
     *  - max: minimum player count
     * about: info about the game
     * rules: the instructions on how to play the game
     * players: array of players in the game, Array<GuildMember>
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
        this.settings = {}
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

        this.messageListener = msg => {this.onMessage(msg)}
    }

    get leader () { return this.gameMaster }

    /**
     * Initialize the game. Called before the play() method at the start of each game. 
     */
    async gameInit() {
        this.stage = 'init'
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

    async onMessage (msg) {
        // only respond to commands in the correct channel
        if(msg.channel.id != this.msg.channel.id) return
        // kick command
        if(msg.content.startsWith(`${options.prefix}kick `) && msg.author.id == this.gameMaster.id && msg.channel.id == this.msg.channel.id) {
            const user = msg.content.substring(options.prefix.length + 4).replace(/\D/g, '')
            if(this.playersToKick.find(player => player == user)) {
                msg.channel.sendMsgEmbed(`<@${user}> is already being removed at the start of the next round.`)
                return
            }
            if(user == this.gameMaster.id) {
                msg.channel.sendMsgEmbed(`The game leader can\'t be kicked! To end a game, use the command \`${options.prefix}end.\``)
                return
            }
            if((this.players.size + this.playersToAdd.length - this.playersToKick.length) <= this.playerCount.min) {
                msg.channel.sendMsgEmbed(`The game can't have fewer than ${this.playerCount.min} player${this.playerCount.min == 1 ? '' : 's'}! To end a game, use the command \`${options.prefix}end.\``)
                return
            }
            msg.channel.sendMsgEmbed(`<@${user}> will be removed at the start of the next round.`)
            this.playersToKick.push(user)
        }

        // add command
        if(msg.content.startsWith(`${options.prefix}add`) && msg.author.id == this.gameMaster.id && msg.channel.id == this.msg.channel.id) {
            const user = msg.content.substring(options.prefix.length + 3).replace(/\D/g, '')
            if(this.playersToAdd.find(player => player == user)) {
                msg.channel.sendMsgEmbed(`<@${user}> is already being added at the start of the next round.`)
                return
            }
            
            if((this.players.size + this.playersToAdd.length - this.playersToKick.length) >= this.playerCount.max) {
                msg.channel.sendMsgEmbed(`The game can't have more than ${this.playerCount.max} player${this.playerCount.max == 1 ? '' : 's'}! Player could not be added.`)
                return
            }

            if(!this.players.has(user)) {
                var member = msg.guild.members.get(user)
                if(!member || member.user.bot) {
                    msg.channel.sendMsgEmbed('Invalid user.', 'Error!', 13632027)
                    return
                }
                if(this.stage != 'init') {
                    this.playersToAdd.push(member.id)
                } else {
                    this.addPlayer(member.id)
                    this.msg.channel.sendMsgEmbed(`${member.user} was added to the game.`)
                    return
                }
                msg.channel.sendMsgEmbed(`${member.user} will be added at the start of the next round.`)
            }
            
        }

        // leave command
        if(msg.content.startsWith(`${options.prefix}leave`) && this.players.has(msg.author.id) && msg.channel.id == this.msg.channel.id) {
            if(this.playersToKick.find(player => player == user)) {
                msg.channel.sendMsgEmbed(`<@${user}> is already being removed at the start of the next round.`)
                return
            }
            
            if(msg.author.id == this.gameMaster.id) {
                msg.channel.sendMsgEmbed(`The game leader can\'t leave! To end a game, use the command ${options.prefix}end.`)
                return
            }
            if(this.players.size + this.playersToAdd.length - this.playersToKick.length <= this.playerCount.min) {
                msg.channel.sendMsgEmbed(`The game can't have fewer than ${this.playerCount.min} player${this.playerCount.min == 1 ? '' : 's'}! To end a game, ask the game leader to use the command ${options.prefix}end.`)
                return
            }
            msg.channel.sendMsgEmbed(`${msg.author} will be removed at the start of the next round.`)
            this.playersToKick.push(msg.author.id)
        }

        // info command
        if(msg.content.startsWith(`${options.prefix}gameinfo`) && msg.author.id == options.ownerID && msg.channel.id == this.msg.channel.id) {
            msg.channel.sendMsgEmbed(`
                stage: \`${this.stage}\`\n
                players.size: \`${this.players.size}\`\n
                submittedCards: \`${this.submittedCards.length}\`\n
                lastMessageID: \`${this.lastMessageID}\`\n
                czar.id: \`${this.czar.user.id}\`\n
                active collectors: \`${this.collectors.length}\`\n`)
        }

        // eval command
        if(msg.content.startsWith(`${options.prefix}evalg`) && msg.author.id == options.ownerID && msg.channel.id == this.msg.channel.id) {
            var response = '';
            try {
                response = await eval(''+msg.content.replace(`${options.prefix}evalg `, '')+'')
                msg.channel.send("```css\neval completed```\nResponse Time: `" + (Date.now()-msg.createdTimestamp) + "ms`\nresponse:```json\n" + JSON.stringify(response) + "```\nType: `" + typeof(response) + "`");
            } catch (err) {
                msg.channel.send("```diff\n- eval failed -```\nResponse Time: `" + (Date.now()-msg.createdTimestamp) + "ms`\nerror:```json\n" + err + "```");
            }
        }
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
                note: `You can purchase more packs in the shop, using the command \`${options.prefix}shop cah\``
            },
            {
                friendlyName: 'Card Back',
                type: 'radio',
                choices: await this.renderCardBackList(),
                default: 'Default',
                note: `Select a card back. Type \`${options.prefix}shop cah\` to view the card backs available for purchase.`
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
         var setList = []
         var whiteCount = 0

        // check available setLists
        this.availableSets = this.settings.sets.slice(0)
        // add defaults
        this.availableSets = this.settings.sets.concat(['BaseUK'])
        await this.gameMaster.fetchDBInfo().then(info => {
            // get unlocked items
            info.unlockedItems.forEach(item => {
                if(CARD_PACKS[item]) {
                    // map item ids to availableSets
                    var packs = CARD_PACKS[item]
                    if(typeof packs == 'string') this.availableSets.push(packs)
                    else this.availableSets = this.availableSets.concat(packs)
                }
            })
        })

        whiteCards.forEach((cards, metadata) => {
             if(!metadata.official) return
             if(!this.availableSets.includes(metadata.abbr)) return
             setList.push(`**${metadata.name}** *(${cards.length} cards)*`)
             if(this.settings.sets.includes(metadata.abbr)) whiteCount += cards.length
        })
        return setList
    }

    async renderCardBackList () {
        var cardBackList = ['Default']
        await this.gameMaster.fetchDBInfo().then(info => {
            // get unlocked items
            info.unlockedItems.forEach(item => {
                if(CARD_BACKS[item]) {
                    cardBackList.push(CARD_BACKS[item].friendlyName)
                }
            })
        })
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
        for(var i = 0; i < wordList.length; i++) {
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
        const stream = canvas.createPNGStream()
        const embed = new Discord.RichEmbed()
        .setTitle('This round\'s black card')
        .attachFile({
            attachment: stream,
            name: fileName
        })
        .setFooter(this.blackCard.clean)
        .setImage(`attachment://${fileName}`)
        .setColor(4886754)
        this.msg.channel.send(embed).catch(console.error)
        return stream
    }

    renderPlayerHand(player) {
        // write out the list of cards
        var cardList = ''
        for(let i = 0; i < player.cards.length; i++) {
            let card = player.cards[i]
            if(card == '') continue
            cardList += `**${i + 1}:** ${card}\n`
        }
        return `The selected black card is: **${this.blackCard.escaped}**\n\n${cardList}\nEnter the number next to the card in the channel <#${this.channel.id}> to select it. You need to select ${this.blackCard.responses} more cards.`
    }

    renderSubmissionStatus() {
        var links = ''
        for(var item of this.players) {
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
        var text = `The selected black card is: **${this.blackCard.escaped}**\n\n${this.czar.user}, select one of the white card choices below.\n\n`
        
        for(var i = 0; i < this.submittedCards.length; i++) {
            let card = this.submittedCards[i].card.join(', ')
            text += `**${i + 1}:** ${card}\n`
        }
        return text
    }
     
    renderLeaderboard() {
        var text = ''
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
        for(var item of this.players) {
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
                var winner = this.submittedCards[index]

                // announce winner
                await this.msg.channel.send({
                    embed: {
                        title: '',
                        description: `The winning card is **${winner.card.join(', ')}** which belonged to ${winner.player.user}!\n\n${winner.player.user} has earned a point.`,
                        color: 4886754
                    }
                })

                // give the winning player a point
                var winningPlayer = winner.player 
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

        // add players
        await this.playersToAdd.forEach(user => {
            if(this.players.size == this.playerCount.max) {
                this.msg.channel.send(`${user} could not be added.`, 'Error: Too many players.', 13632027)
                return
            }
            this.addPlayer(user)
        })

        // kick players
        await this.playersToKick.forEach(user => {
            if(this.players.size == this.playerCount.min) {
                this.msg.channel.send(`${user} could not be removed.`, 'Error: Too few players.', 13632027)
                return
            }
            // remove player data
            this.players.delete(user)
            this.msg.channel.sendMsgEmbed(`<@${user}> was removed from the game.`)
        })

        // check if game end
        if(this.ending) {
            var winner = { score: -1 }
            for(var item of this.players) {
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
        this.stage = 'playing'

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
        for(var item of this.players) {
            // create reference variables
            var key = item[0]
            var player = item[1]

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

            var player = this.players.get(m.author.id)
            var cardRemoved = parseInt(m.content) - 1
            // tell user which card they selected
            player.dmChannel.sendMsgEmbed(`You have selected: ${player.cards[cardRemoved]}\n\n**Return to game chat: <#${this.channel.id}>**`)

            // save selection for one card
            this.submittedCards.push({
                player,
                card: [player.cards[cardRemoved]]
            })
            player.submitted = true

            // update in chat
            this.msg.channel.fetchMessage(this.lastMessageID).then(message => {
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
            for(var item of this.players) {
                // create reference variables
                var key = item[0]
                var player = item[1]

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
            this.msg.channel.fetchMessage(this.lastMessageID).then(message => {
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

    async end(winner) {
        this.stage = 'over'

        var endPhrase = ''
        if(winner) {
            endPhrase = `${winner.user} has won!`
        } else {
            endPhrase = 'Game ended. There is no winner.'
        }

        this.msg.channel.sendMsgEmbed(endPhrase).then(msg => {
            this.clearCollectors(this.collectors)
            this.reset()
            this.msg.channel.gamePlaying = false
            this.msg.channel.game = undefined
            this.msg.client.removeListener('message', this.messageListener)
        })
    }

    forceStop() {
        this.ending = true
        this.end()
    }

}