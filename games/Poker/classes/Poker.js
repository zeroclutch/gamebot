import { ButtonStyle, ButtonBuilder, ActionRowBuilder } from 'discord.js';
import PokerGame from 'poker-ts'
import Game from '../../_Game/main.js';

import metadata from '../metadata.js';

import options from '../../../config/options.js';
import CardDeck from './CardDeck.js';

import logger from 'gamebot/logger'

// 🎉 🎉 🎉 Congrats to the `table.winners()` 🎉 🎉 🎉 

class Poker extends Game {
    constructor(msg, args) {
        super(msg, args)
        // Import metadata
        this.metadata = metadata

        // Automatically end game if no one is playing anymore
        this.inactiveRounds = 0

        // Configure Poker
        this.table = new PokerGame.Table({ smallBlind: 50, bigBlind: 100 }, this.metadata.playerCount.max)

        const isBetween = (value, min, max) => !isNaN(parseInt(value)) && parseInt(value) >= +min && parseInt(value) <= +max
        
        // Set configurable options
        this.gameOptions = [
            {
                friendlyName: 'Timer',
                default: '0',
                type: 'number',
                filter: m => !isNaN(m.content) && (isBetween(m.content, 20, 500) || m.content === '0'),
                note: 'The time allowed for an action in seconds. Enter 0 to disable the timer.'
            },
            {
                friendlyName: 'Small Blind',
                default: 50,
                default: '1/2 Big Blind',
                choices: ['None', '1/3 Big Blind', '1/2 Big Blind', '2/3 Big Blind'],
                type: 'radio',
                note: 'The amount of chips the small blind is worth. It\'s always a fraction of the big blind.'
            },
            {
                friendlyName: 'Big Blind',
                default: 100,
                type: 'number',
                filter: m => isBetween(m.content, 100, 1000),
                note: 'The amount of chips the big blind is worth. Must be between 100 and 1000 chips.'
            },
            {
                friendlyName: 'Buy-in',
                default: 10_000,
                filter: m => isBetween(m.content, 1000, 100_000),
                type: 'number',
                note: 'The amount of chips each player starts with. Must be between 1000 and 100,000 chips.'
            },
            {
                friendlyName: 'Betting Limits',
                default: 'No Limit',
                choices: ['No Limit', 'Pot Limit', 'Fixed Limit'],
                type: 'radio',
                note: 'Fixed limit betting means that the amount you can raise the bet by is fixed. This is the simplest form of betting. Pot limit means that you can bet a maximum of the number of chips in the pot. No limit means that you can bet any amount of chips.'
            },
            {
                friendlyName: 'Big Bet',
                default: 100,
                type: 'number',
                filter: m => !isNaN(m.content) && (parseInt(m.content) <= 0) && (parseInt(m.content) >= this.gameOptions['Buy-in'].value),
                note: 'For fixed-limit betting only. This is the amount of additional chips a player can raise on a big bet, on top of a small bet. The small bet is always the minimum amount allowed.'
            },
        ]

        this.BUTTON_STYLES = Object.freeze({
            'fold': ButtonStyle.Danger,
            'check': ButtonStyle.Secondary,
            'call': ButtonStyle.Primary,
            'bet': ButtonStyle.Success,
            'big bet': ButtonStyle.Success,
            'raise': ButtonStyle.Success,
            'view hand': ButtonStyle.Secondary,
        })

        this.HAND_RANKINGS = Object.freeze([
            'high card',
            'pair',
            'two pair',
            'three of a kind',
            'straight',
            'flush',
            'full house',
            'four of a kind',
            'straight flush',
            'royal flush'
        ])

        this.deck = new CardDeck()
        this.pokerChip = '<:pokerchip:1071006783683964958>'

        this.playersInHand = []
    }

    gameInit() {
        const table = this.table

        this.options['Big Blind'] = parseInt(this.options['Big Blind'])

        const calculateSmallBlind = (smallBlind) => {
            switch(smallBlind) {
                case 'None':
                    return 0
                case '1/3 Big Blind':
                    return Math.floor(this.options['Big Blind'] / 3)
                case '1/2 Big Blind':
                    return Math.floor(this.options['Big Blind'] / 2)
                case '2/3 Big Blind':
                    return Math.floor(this.options['Big Blind'] * 2 / 3)
            }
        }

        // Configure table settings
        table.setForcedBets({
            smallBlind: calculateSmallBlind(this.options['Small Blind']),
            bigBlind: this.options['Big Blind'],
        });

        for(let i = 0; i < this.players.size; i++) {
            table.sitDown(i, parseInt(this.options['Buy-in'])) // seat a player at seat 0 with 1000 chips buy-in
            
            let player = this.players.get(this.players.keyAt(i))
            player.seatIndex = i
        }
    }

    getTimer() {
        this.options['Timer'] === '0' ? null : parseInt(this.options['Timer']) * 1000
    }

    getButtonStyle(action) {
        return this.BUTTON_STYLES[action]
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1)
    }

    async awaitPlayerAction(seatIndex) {
        const player = this.players.find(p => p.seatIndex === seatIndex);
        return await this.awaitPlayerInput(player, this.table.legalActions());
    }

    viewCommunityCards() {
        if(this.table.roundOfBetting() === 'preflop') return 'No community cards yet!'
        const communityCards = this.table.communityCards()
        return this.renderCommunityCards(communityCards)
    }

    renderCard(rank, suit) {
        const name = `${rank}${suit}`
        return `<:${name}:${this.deck.resolveName(name)}>`
    }

    renderHand(cards) {
        return cards.map(card => this.renderCard(card.rank, card.suit)).join(' ')
    }

    renderCommunityCards(cards) {
        return cards.map(card => this.renderCard(card.rank, card.suit)).join('') + this.renderCard('CardBack', '').repeat(Math.max(0, 5 - cards.length))
    }

    viewHand(player) {
        return this.renderHand(
            this.table.holeCards()[player.seatIndex]
        )
    }

    getTotalChips(player) {
        return this.table.seats()[player.seatIndex]?.totalChips
    }

    resolveIndex(seatIndex) {
        return this.players.find(p => p.seatIndex === seatIndex)
    }

    resolveHandRanking(handRanking) {
        return this.HAND_RANKINGS[handRanking]
    }

    renderActionMessage(player, validActions) {
        return {
            title: `Betting: ${this.capitalize(this.table.roundOfBetting())}`,
            description: `${player.user}, select an action from one of the buttons below.`,
            fields: [
                {
                    name: 'Pot',
                    value: this.table.pots().map(pot => `${pot.size}${this.pokerChip}`).join(', ')
                },
                {
                    name: 'Players in this hand',
                    value: this.table.handPlayers().map((user, seatIndex) => {
                        if(user) {
                            let { totalChips, betSize } = user
                            return `${this.resolveIndex(seatIndex).user} | ${totalChips}${this.pokerChip} total | ${betSize}${this.pokerChip} bet`
                        }
                    }).filter(p => p).join('\n') 
                },
                {
                    name: 'Community Cards',
                    value: ''
                },
            ],
            color: options.colors.info
        }
    }

    renderShowdownMessage(table, playersInHand) {
        return {
            color: options.colors.info,
            fields: [
                {
                    name: 'Player Hands',
                    value: table.holeCards()
                        .map((cards, seatIndex) => (cards && playersInHand.includes(this.resolveIndex(seatIndex).user.id)) ? `${this.resolveIndex(seatIndex).user} | ${this.renderHand(cards)}` : '').filter(h => h).join('\n')
                },
                {
                    name: 'Community Cards',
                    value: this.renderCommunityCards(table.communityCards())
                }
            ]
        }
    }

    renderWinnerMessage(table) {
        const winners = table.winners()
        return {
            color: options.colors.info,
            description: winners[0].map(([seatIndex, { ranking }, cards]) => `${this.resolveIndex(seatIndex).user} won with a ${this.resolveHandRanking(ranking)}!`).join(', '),
        }
    }

    awaitPlayerInput(player, validActions) {
        return new Promise(async (resolve, reject) => { 

            // Find call amount
            const bets = this.table.handPlayers().filter(p => p).map(({ betSize }) => betSize)
            const maxBet = Math.max(...bets)
            const playerBet = this.table.handPlayers()[player.seatIndex]?.betSize || 0
            const callAmount = maxBet - playerBet
            // If call is 0, we can't trust this calculation

            // Add labels for specific buttons
            const getCallLabel = action => (action === 'call' && callAmount > 0) ? ` (${callAmount})` : ''
            const getRaiseLabel = action => ((action === 'raise' || action === 'bet') && this.options['Betting Limits'] === 'Fixed Limit') ? ` (to ${validActions.chipRange.min})` : ''

            let raiseOrBet = ''

            // Create buttons for each valid action
            let actionList = validActions.actions.map(action => {
                if(action === 'raise' || action === 'bet') raiseOrBet = action
                return new ButtonBuilder()
                    .setCustomId(action)
                    .setLabel(this.capitalize(action) + getCallLabel(action) + getRaiseLabel(action))
                    .setStyle(this.getButtonStyle(action))
            })

            // Add big bet button
            let bigBetAmount = Math.min(validActions.chipRange.max, validActions.chipRange.min + parseInt(this.options['Big Blind']))
            if(raiseOrBet && this.options['Betting Limits'] === 'Fixed Limit' && validActions.chipRange.max > validActions.chipRange.min) {
                actionList.push(
                    new ButtonBuilder()
                        .setCustomId('big bet')
                        .setLabel(`Big ${raiseOrBet} (to ${bigBetAmount})`)
                        .setStyle(this.getButtonStyle('big bet'))
                )
            }

            // Add view hand button
            actionList.push(
                new ButtonBuilder()
                    .setCustomId('view hand')
                    .setLabel('View Hand')
                    .setStyle(this.getButtonStyle('view hand'))
            )

            // Our custom actions must be registered for the collector filter
            validActions.actions.push('big bet', 'view hand')

            // Ask the player which action they would like to take
            const selectActionRow = new ActionRowBuilder()
            .addComponents(
                actionList
            )
            
            await this.channel.send({
                content: `${player.user}, it's your turn!`,
                embeds: [this.renderActionMessage(player, validActions)],
            })

            
            // Wait a moment for the message to be viewed
            await this.sleep(100)

            const actionMessage = await this.channel.send({
                content: this.viewCommunityCards(),
                components: [selectActionRow]
            })

            // Wait for the player to select an action
            const actionFilter = i => this.players.has(i.user.id) && validActions.actions.includes(i.customId) 
            const actionCollector = actionMessage.createMessageComponentCollector({ filter: actionFilter, time: this.getTimer() })

            actionCollector.on('collect', async i => {
                // Any user can view hand
                if(i.customId === 'view hand') {
                    // Show the player their hand
                    i.reply({ content: this.viewHand(this.players.get(i.user.id)), ephemeral: true })
                } else {
                    // Only the player who selected the action can continue
                    if(i.user.id === player.user.id){
                        actionCollector.stop(i.customId)
                        await i.reply({ content: `${player.user} selected ${i.customId}!` })
                    }
                }
            })

            actionCollector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    // If the player didn't select an action in time, fold
                    this.inactiveRounds++
                    resolve(['fold', null])
                    return
                }
                // If anyone else selected an action, reset the inactive rounds counter
                this.inactiveRounds = 0

                // Wait a moment for the message to be viewed
                await this.sleep(500)

                const selectedAction = collected.last().customId

                // Wait for the player to select a bet size
                if (selectedAction === 'bet' || selectedAction === 'raise') {
                    if(this.options['Betting Limits'] === 'Fixed Limit') {
                        resolve([selectedAction, validActions.chipRange.min])
                    } else {
                        const betSize = await this.awaitPlayerBetSize(player, validActions)
                        if(!betSize) {
                            // If the player didn't select a bet size in time, fold
                            resolve(['fold', null])
                            return
                        }
                        resolve([selectedAction, betSize])
                    }
                } else if(selectedAction === 'big bet') {
                    resolve(['bet', bigBetAmount])
                } else {
                    // General case
                    resolve([selectedAction, null])
                }
            })

        })
    }

    getBetLimits(validActions) {
        let minBet = -1
        let maxBet = -1
        switch(this.options['Betting Limits']) {
            case 'Pot Limit': {
                minBet = validActions.chipRange.min
                maxBet = this.table.pots().reduce((acc, pot) => acc + pot.size, 0)
                break
            }
            case 'Fixed Limit': {
                minBet = validActions.chipRange.min
                maxBet = validActions.chipRange.min
                break
            }
            case 'No Limit':
            default: {
                minBet = validActions.chipRange.min
                maxBet = validActions.chipRange.max
                break
            }
        }

        if(minBet === -1 || maxBet === -1) {
            throw new Error('Invalid betting limits') 
        }

        return { minBet, maxBet }
    }

    getValidBets(player, validActions) {
        const { minBet, maxBet } = this.getBetLimits(validActions)
        
        // Find the size of the current pot
        let currentPot = this.table.pots().reduce((acc, pot) => acc + pot.size, 0)
        let currentRoundBets = this.table.handPlayers().reduce((acc, p) => acc + (p?.betSize || 0), 0)
        let pot = currentPot + currentRoundBets

        let standardBets = []
        if(this.table.roundOfBetting() === 'preflop') {
            standardBets = [{
                name: 'Minimum Bet',
                value: minBet,
            }, {
                name: '2x Min Bet',
                value: minBet * 2
            }]
        } else {
            standardBets = [{
                name: '1/3 Pot',
                value: Math.floor(pot / 3),
            }, {
                name: '1/2 Pot',
                value: Math.floor(pot / 2)
            }, {
                name: 'Pot',
                value: pot
            }, {
                name: '2x Pot',
                value: pot * 2
            }]
        }

        let validBets = []

        // Find the bets that the player can make
        for(let i = 0; i < standardBets.length; i++) {
            let standardBet = standardBets[i].value
            if(standardBet > maxBet) {}
            else if(standardBet < minBet) {}
            else {
                // Limit betting to pot depending on options
                if(this.options['Betting Limits'] === 'No Limit' || (this.options['Betting Limits'] === 'Pot Limit' && standardBet <= pot)) {
                    validBets.push(
                        new ButtonBuilder()
                            .setCustomId(standardBets[i].name)
                            .setLabel(`${standardBets[i].name} (${standardBets[i].value})`)
                            .setStyle(ButtonStyle.Secondary)
                    )
                }
            }
        }

        // Add the custom bet button
        validBets.push(
            new ButtonBuilder()
                .setCustomId('Custom Bet')
                .setLabel('Custom Bet')
                .setStyle(this.getButtonStyle('bet'))
        )


        return [validBets, standardBets]
    }

    awaitPlayerBetSize(player, validActions) {
        return new Promise(async (resolve, reject) => {
            // Create a button collector to wait for the player to select a bet size
            const [validBets, standardBets] = this.getValidBets(player, validActions)
            const betSizeMessage = await this.channel.send({
                content: 'Select a bet size.',
                components: [new ActionRowBuilder().addComponents(
                    validBets
                )]
            }).catch(reject)

            const componentList = betSizeMessage.components[0].components

            let betSizeFilter = i => componentList.find(component => component.customId === i.customId) && i.user.id === player.user.id

            let betSizeCollector = betSizeMessage.createMessageComponentCollector({ filter: betSizeFilter, time: this.getTimer() })

            betSizeCollector.on('collect', async i => {
                betSizeCollector.stop(i.customId)
                await i.reply({ content: `${player.user} selected ${i.customId}!` })
            })

            betSizeCollector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    // If the player didn't select a bet size in time, fold
                    resolve(null)
                    return
                }

                // Wait a moment for the message to be viewed
                await this.sleep(500)

                const selectedBetSize = collected.last().customId

                // Wait for the player to select a bet size
                if (selectedBetSize === 'Custom Bet') {
                    const betSize = await this.awaitPlayerCustomBetSize(player, validActions)
                    resolve(betSize)
                } else {
                    // General case
                    resolve(standardBets.find(bet => bet.name === selectedBetSize).value)
                }
            })
        })
    }

    awaitPlayerCustomBetSize(player, validActions) {
        return new Promise(async (resolve, reject) => {
            try {
                // Find valid bet size range
                const { minBet, maxBet } = this.getBetLimits(validActions)

                await this.channel.send(`${player.user}, type in a bet size from **${minBet}** to **${maxBet}**`)

                const betSizeFilter = m => m.author.id === player.user.id && !isNaN(m.content) && (parseInt(m.content) <= maxBet) && (parseInt(m.content) >= minBet)
                const betSizeCollector = this.channel.createMessageCollector({ filter: betSizeFilter, time: this.getTimer() })

                betSizeCollector.on('collect', async m => {
                    betSizeCollector.stop(m.content)
                })

                betSizeCollector.on('end', async (collected, reason) => {
                    if (reason === 'time') {
                        // If the player didn't select an action in time, fold
                        resolve(['fold', null])
                        return
                    }

                    const betSize = parseInt(collected.first().content)

                    // Select the bet size
                    resolve(betSize)
                })
            } catch(e) {
                reject(e)
            }
        })
    }

    async play() {
        const table = this.table
        table.startHand();

        while (table.isHandInProgress()) {
            this.playersInHand = Array.from(this.players.keys());
            while (table.isBettingRoundInProgress()) {
                const seatIndex = table.playerToAct();
                
                // Get `action` and possibly `betSize` in some way
                //const [action, betSize] = getPlayerActionSomehow(seatIndex);
                const [action, betSize] = await this.awaitPlayerAction(seatIndex);

                if(action === 'fold') {
                    let foldingPlayer = this.resolveIndex(seatIndex).user.id
                    let foldingPlayerIndex = this.playersInHand.indexOf(foldingPlayer)
                    this.playersInHand.splice(foldingPlayerIndex, 1)
                }

                table.actionTaken(action, betSize);
            }
            
            table.endBettingRound()
            
            if (table.areBettingRoundsCompleted()) {
                // Only show the showdown message if there are more than 1 players
                const showDownMessage = this.renderShowdownMessage(table, this.playersInHand)

                table.showdown()

                // Show what the winner had
                if(table.winners() && table.winners().length) {
                    await this.channel.send({
                        embeds: [showDownMessage]
                    })
                    await this.channel.send({
                        embeds: [this.renderWinnerMessage(table)]
                    })
                } else if(this.playersInHand.length === 1) {
                    let player = this.players.get(this.playersInHand[0])
                    await this.channel.send(`${player.user} won the hand!`)
                } else {
                    // This should not happen
                    logger.warn('No winners found, but there are still players in the hand.')
                    await this.channel.send('The hand is over.')
                }

                // Check if we have reached enough inactive rounds
                if(this.inactiveRounds >= this.players.size * this.settings.maximumInactiveRounds) {
                    this.end(undefined, 'The game has ended due to inactivity.')
                    return
                }

                // Add and remove players
                // We don't need to worry about player restraints here,
                // because we already checked them when the player joined
                this.playersToKick.forEach(member => table.standUp(this.players.get(member.id).seatIndex))
                const newSeats = {}
                this.playersToAdd.forEach(member => {
                    let nextFreeSeat = table.seats().findIndex(occupied => !occupied)
                    table.sitDown(nextFreeSeat, this.options['Buy-in'])
                    newSeats[member.id] = nextFreeSeat
                })
                
                await this.updatePlayers(false)

                // Update players with their seats
                this.players.forEach(player => {
                    if(player.user.id in newSeats) player.seatIndex = newSeats[player.user.id]
                })

                // Check if we only have 1 player left
                let playersLeft = table.seats().map((p, i) => p ? i : null).filter(p => p !== null)

                if(playersLeft.length === 1) {
                    this.end(this.resolveIndex(playersLeft[0]))
                    return
                }


                // Delay for 5 seconds
                await this.channel.send('The next hand will start in 5 seconds. Shuffling cards...')
                await this.sleep(5000)
                
                // Start a new hand
                table.startHand()
            }
        }
    }

    beforeEnd() {
        this.channel.send({
            embeds: [{
                description: '*Gamebot does not encourage gambling. If you or someone you know has a gambling problem, you can find help at the [NCP Gambling website (USA-only)](https://www.ncpgambling.org/help-treatment/national-helpline-1-800-522-4700/) or with these [international resources](https://www.ncpgambling.org/5475-2/).*',
                color: options.colors.info,
            }]
        })
    }
}

export default Poker