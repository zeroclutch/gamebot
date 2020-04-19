// global dependencies
const Discord = require('./../discord_mod')
const Game = require('./Game')
const options = require('./../config/options')
const fs = require('fs')

// cah dependencies
const { createCanvas, registerFont } = require('canvas')


// Get card sets from filesystem
// Collection<Object metadata, Array<String card> cards>
var blackCards = new Discord.Collection()

// Collection<Object metadata, Array<String card> cards>
var whiteCards = new Discord.Collection()

// get card sets
const cardFolder = fs.readdirSync('./gameData/CardsAgainstHumanity')

// add cards to list
for (const cardSet of cardFolder) {
  //search through each folder
  if(!cardSet.includes('.DS_Store')) {
    var metadata = JSON.parse(fs.readFileSync(`./gameData/CardsAgainstHumanity/${cardSet}/metadata.json`, 'utf8'))
    var blackCardList = fs.readFileSync(`./gameData/CardsAgainstHumanity/${cardSet}/black.md.txt`, 'utf8').split('\n')
    var whiteCardList = fs.readFileSync(`./gameData/CardsAgainstHumanity/${cardSet}/white.md.txt`, 'utf8').split('\n')
    blackCards.set(metadata, blackCardList)
    whiteCards.set(metadata, whiteCardList)
  }
}

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


class CAHDeck {
    constructor(sets) {
        // adds all appropriate sets to the collection of cards
        this.sets = sets
        this.whiteCards = []
        this.blackCards = []
        this.discards = {
            white: [],
            black: []
        }
        this.blackCard = new BlackCard('')
        console.log(this.sets)
        this.sets.forEach(set => {
            whiteCards.find((cards, metadata) => metadata.name == set).forEach(card => this.whiteCards.push(card))
            blackCards.find((cards, metadata) => metadata.name == set).forEach(card => this.blackCards.push(card))
        })

        this.defaultPlayer = {
            cards: [],
            score: 0,
            currentHand: '',
            submitted: false
        }
    }

    // shuffles an array
    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // shuffles both decks
    shuffle (options) {
        this.constructor.shuffleArray(this.whiteCards)
        this.constructor.shuffleArray(this.blackCards)
    }

    // draws the top card(s) from the deck
    draw (deck, count) {
        count = isNaN(count) ? 1 : count
        if(deck == 'white') deck = this.whiteCards
        if(deck == 'black') deck = this.blackCards
        var drawCards = deck.slice(0, count)
        deck.splice(0, count)
        return drawCards
    }

    // discards a card
    discard (deck, cards) {
        if(deck == 'white') this.discards.white.concat(cards)
        if(deck == 'black') this.discards.black.concat(cards)
    }
}

class BlackCard {
    constructor(text) {
        this.cardText = text
        // get possible card responses based on blanks, minimum 1
        this.cardResponses =  Math.max(text.split(/\_/g).length - 1, 1)
        // if a number is specified, use that instead.
        if(text.charAt(0) == '[' && text.charAt(2) == ']') {
            this.cardResponses = parseInt(text.charAt(1))
            this.cardText = this.cardText.substring(3, text.length)
        }

    }

    get responses () {
        return this.cardResponses
    }

    get text() {
        return this.cardText
    }

    /**
     * Extends underscores and removes '\n's
     */
    get clean() {
        return this.cardText.replace(/\_/g, '_____').replace(/\\n/g, ' ')
    }

    /**
     * Cleans text and escapes markdown characters to be discord-text friendly
     */
    get escaped() {
        return this.cardText.replace(/\_/g, '_____').replace(/\\n/g, ' ').replace(/\_/g, '\\_').replace(/\*/g, '\\*').replace(/\~/g, '\\~')
    }
}

// static field sets
CAHDeck.sets = []

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
        this.players = new Discord.Collection()
        this.msg = msg
        this.czars
        this.czarIndex = 0
        this.czar
        this.gameMaster = msg.author
        this.playerCount = {
            min: 1,
            max: 12
        }
        this.submittedCards = []
        this.lastMessageID
        this.gameStart = false
        this.cardDeck
        this.collectors = []
        this.stage = ''
        this.playersToKick = []
        this.playersToAdd = []
        this.ending = false

        // get settings
        this.settings = settings || {}
        this.settings.sets = ['Base', 'CAHe1', 'CAHe2', 'CAHe3', 'CAHe4', 'CAHe5', 'CAHe6']
        this.gameName = 'Cards Against Humanity'
        this.settings.isDmNeeded = true
        // Default options, reconfigured later in this.generateOptions()
        this.gameOptions = [
            {
                friendlyName: 'Sets',
                choices: this.settings.sets,
                default: ['**Base Set** *(460 cards)*'],
                type: 'checkboxes',
                note: `You can purchase more packs in the shop, using the command \`${options.prefix}shop cah\``
            },
            {
                friendlyName: 'Timer',
                type: 'free',
                default: 60,
                filter: m => !isNaN(parseInt(m.content)) && (parseInt(m.content) <= 300) && (parseInt(m.content) >= 30),
                note: 'Enter a value in seconds for the countdown timer, between 30 and 300 seconds.'
            }
        ]
        
        
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
            // TODO ADD THIS CODE TO LEAVE AND ADD CMDS
            if(this.playersToKick.find(player => player == user)) {
                msg.channel.sendMsgEmbed(`<@${user}> is already being removed at the start of the next round.`)
                return
            }
            if(user == this.gameMaster.id) {
                msg.channel.sendMsgEmbed(`The game leader can\'t be kicked! To end a game, use the command \`${options.prefix}end.\``)
                return
            }
            if(this.players.size + this.playersToAdd.length - this.playersToKick.length <= this.playerCount.min) {
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
            
            if(this.players.size - this.playersToKick.length + this.playersToAdd >= this.playerCount.max) {
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
                // refresh czars list
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
        if(msg.content.startsWith('=eval') && msg.author.id == options.ownerID && msg.channel.id == this.msg.channel.id) {
            var response = '';
            try {
                response = await eval(''+msg.content.substring(6,msg.content.length)+'')
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
                default: ['**Base Set** *(460 cards)*'],
                type: 'checkboxes',
                note: `You can purchase more packs in the shop, using the command \`${options.prefix}shop cah\``
            },
            {
                friendlyName: 'Timer',
                type: 'free',
                default: 60,
                filter: m => !isNaN(parseInt(m.content)) && (parseInt(m.content) <= 300) && (parseInt(m.content) >= 30),
                note: 'Enter a value in seconds for the countdown timer, between 30 and 300 seconds.'
            }
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

    /**
     * @returns List of sets by set ID
     */
    async getSets (setList) {
        // Extract pack name from string
        console.log(setList)
        setList = setList.map(set => set.match(/([^\*\*])+(?=\*\*)/g).join())

        // Replace pack name with ID
        console.log(setList)
        return setList
    }

    renderCardText (string) {
        // split to whitespace and newlines
        var stringParts = string.split(/[\n\s]/g)
        var newString = ''
        var lineCount = 0
        for(let i = 0; i < stringParts.length - 1; i++) {
            newString += stringParts[i] + ' '
    
            // add next 2 string parts
            lineCount += stringParts[i].length
            lineCount += stringParts[i + 1].length
    
            if(lineCount > 16) {
                // insert break if line is too long
                newString += '\n'
                lineCount = 0
            } else {
                // remove next string part
                lineCount -= stringParts[i + 1].length
            }
        }
        // add last part
        newString += stringParts[stringParts.length - 1]
    
        return newString
    }
    
    renderCard (cardText) {
        const canvas = createCanvas(300, 300)
        const ctx = canvas.getContext('2d')
        // register fonts
        registerFont('./assets/fonts/SF-Pro-Display-Bold.otf', {family: 'SF Pro Display Bold'})
        
        // add bg
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // add text
        ctx.fillStyle = 'white';
        ctx.font = '24px SF Pro Display Bold'
        ctx.fillText(this.renderCardText(cardText), 20, 40)
        
        ctx.font = '12px SF Pro Display Bold'
        ctx.fillText('♣︎ Gamebot for Discord', 20, 280)

        const tempDir = './assets/temp'

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        
        const fileName = Math.round(Math.random()*1000000) + '.png'
        const filePath = `${tempDir}/${fileName}`
        const out = fs.createWriteStream(filePath)
        const stream = canvas.createPNGStream()
        stream.pipe(out)
        
        out.on('finish', () =>  {
            const embed = new Discord.RichEmbed()
            .setTitle('This round\'s black card')
            .attachFiles([filePath])
            .setFooter(this.blackCard.clean)
            .setImage(`attachment://${fileName}`)
            .setColor(4886754)
            this.msg.channel.send(embed)
            .then(() => fs.unlinkSync(filePath))
        }) 
    }

    renderPlayerHand(player) {
        // write out the list of cards
        var cardList = ''
        for(let i = 0; i < player.cards.length; i++) {
            let card = player.cards[i]
            if(card == '') continue
            cardList += `**${i + 1}:** ${card}\n`
        }
        return `The selected black card is: **${this.blackCard.escaped}**\n\n${cardList}\nReturn to game chat: <#${this.msg.channel.id}>`
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
        this.renderCard(this.blackCard.clean)

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
            var drawnCards = await this.cardDeck.draw('white', this.settings.handLimit - player.cards.length)
            player.cards = player.cards.concat(drawnCards)

            
            // dm each player with their hand
            await player.user.send('View your hand and select a card.', {
                embed: {
                    title: `Cards Against Humanity - Your Current Hand`,
                    description: this.renderPlayerHand(player),
                    color: 4886754,
                    footer: {
                       text: `Type the number of the card in DM to select it. You need to select ${this.blackCard.responses} more cards.`
                    }
                }
            }).then(m => {
                player.currentHandID = m.id
                player.currentHand = m.url
                player.dmChannel = m.channel
            }).then(() => {
                // create new listener on each player channel
                const filter = m => (!isNaN(m.content) && parseInt(m.content) <= this.settings.handLimit && parseInt(m.content) > 0 && player.cards[parseInt(m.content) - 1] != '')
                // await X messages, depending on how many white cards are needed
                // for some reason black cards with 3+ are stopping at 1 less than they need to, to rectify this I have added this hideous ternary operator!
                player.collector = player.dmChannel.createMessageCollector(filter, { max: this.blackCard.responses < 3 ? this.blackCard.responses : this.blackCard.responses + 1,  time: this.settings.timeLimit });
                this.collectors.push(player.collector)
                player.collector.on('collect', m => {
                    var player = this.players.get(m.author.id)
                    var cardRemoved = parseInt(m.content) - 1
                    // tell user which card they selected
                    m.channel.send('You have selected: ' + player.cards[cardRemoved])

                    // check to see if player has already submitted a card
                    if(player.collector.collected.size > 1) {
                        // add selection
                        this.submittedCards.find(item => player.user.id == item.player.user.id).card.push(player.cards[cardRemoved])
                    } else {
                        // save selection
                        this.submittedCards.push({
                            player,
                            card: [player.cards[cardRemoved]]
                        })
                    }

                    // remove cards from hand
                    var cardRemoved = parseInt(m.content) - 1
                    player.cards.splice(cardRemoved, 1, '')

                    var playerCards = this.submittedCards.find(item => player.user.id == item.player.user.id).card
                    
                    m.channel.fetchMessage(player.currentHandID).then(message => {
                        var remaining = this.blackCard.responses - playerCards.length
                        message.edit('', {
                            embed: {
                                title: `Cards Against Humanity - Your Current Hand`,
                                description: this.renderPlayerHand(player),
                                color: 4886754,
                                footer: {
                                    text: `Type the number of the card in DM to select it. You need to select ${remaining} more card${remaining == 1 ? '' : 's'}.`
                                }
                            }
                        })
                    })
                });

                player.collector.on('end', (collected, reason) => {
                    if(this.ending) return
                    // check all players at the end
                    for(var item of this.players) {
                        // create reference variables
                        var key = item[0]
                        var player = item[1]

                        // handle timeout
                        if(reason == 'time' && !player.submitted && this.czar.user.id != player.user.id) {
                            player.submitted = 'time'
                            player.user.send({
                                embed: {
                                    description: `Time has run out. **Return to game chat <#${this.msg.channel.id}>.**`,
                                    color: 4513714
                                }
                            })
                        }
                    }

                    if(collected.size > 0) {
                        // get player by id
                        var player = this.players.get(collected.values().next().value.author.id)

                        // update in chat that this user has selected their card
                        if(this.blackCard.responses == collected.size) {
                            player.submitted = true
                            player.user.send({
                                embed: {
                                    description: `You have submitted all the cards. **Return to game chat <#${this.msg.channel.id}>.**`,
                                    color: 4513714
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

                    // check if everyone has submitted or if time has run out, if so, move to selection phase
                    var submitted = 0
                    for(var item of this.players) {
                        // create reference variables
                        var key = item[0]
                        var player = item[1]
                        // tick off user if the player has submitted or was added mid-round
                        if(player.submitted) {
                            submitted++
                        }
                    }
                    if(submitted >= this.players.size - 1 && this.stage != 'selection') {
                        CAHDeck.shuffleArray(this.submittedCards)
                        this.runSelection()
                    }
                });
            })
        }

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

// static fields
module.exports.id = 'cah'
module.exports.gameName = 'Cards Against Humanity'
module.exports.playerCount = {
    min: 3,
    max: 12
}
module.exports.genre = 'Card'
module.exports.about = 'A party game for horrible people.'
module.exports.rules = 'Each round, a black card is selected, and everyone else answers with their funniest white card. Your white cards will be DMed to you, and you will select them from your DMs. One player is selected to be the Card Czar each round, and they give a point to the player with the funniest white card.'
