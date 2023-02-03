import { ButtonStyle, ButtonBuilder, ActionRowBuilder } from 'discord.js';
import PokerGame from 'poker-ts'
import Game from '../../_Game/main.js';

import metadata from '../metadata.js';

import options from '../../../config/options.js';
import CardDeck from './CardDeck.js';

// 🎉 🎉 🎉 Congrats to the `table.winners()` 🎉 🎉 🎉 

class Poker extends Game {
    constructor(msg, args) {
        super(msg, args)
        // Import metadata
        this.metadata = metadata

        // Configure Poker
        this.table = new PokerGame.Table({ smallBlind: 50, bigBlind: 100 }, this.metadata.playerCount.max)
        
        // Set configurable options
        this.gameOptions = [
            {
                friendlyName: 'Timer',
                default: 60,
                type: 'number',
                filter: m => !isNaN(m.content) && (((parseInt(m.content) >= 20) && (parseInt(m.content) <= 500)) || m.content === '0'),
                note: 'The time allowed for an action in seconds. Enter 0 to disable the timer.'
            },
            {
                friendlyName: 'Small Blind',
                default: 50,
                type: 'number',
                filter: m => !isNaN(m.content) && (parseInt(m.content) <= 0) && (parseInt(m.content) <= this.gameOptions['Big Blind'].value),
                note: 'The amount of chips the small blind is worth. Must be smaller than the Big Blind'
            },
            {
                friendlyName: 'Big Blind',
                default: 100,
                type: 'number',
                filter: m => !isNaN(m.content) && (parseInt(m.content) <= 0) && (parseInt(m.content) >= this.gameOptions['Small Blind'].value),
                note: 'The amount of chips the big blind is worth.'
            },
            {
                friendlyName: 'Buy-in',
                default: 1000,
                filter: m => !isNaN(m.content) && (parseInt(m.content) <= 0) && (parseInt(m.content) >= this.gameOptions['Big Blind'].value),
                type: 'number',
                note: 'The amount of chips each player starts with.'
            },
        ]

        this.BUTTON_STYLES = Object.freeze({
            'fold': ButtonStyle.Danger,
            'check': ButtonStyle.Secondary,
            'call': ButtonStyle.Primary,
            'bet': ButtonStyle.Success,
            'raise': ButtonStyle.Success,
            'view hand': ButtonStyle.Secondary,
        })

        this.deck = new CardDeck()

    }

    gameInit() {
        const table = this.table

        // Configure table settings
        table.setForcedBets({
            smallBlind: parseInt(this.options['Small Blind']),
            bigBlind: parseInt(this.options['Big Blind'])
        });

        for(let i = 0; i < this.players.size; i++) {
            table.sitDown(i, parseInt(this.options['Buy-in'])) // seat a player at seat 0 with 1000 chips buy-in
            
            let player = this.players.get(this.players.keyAt(i))
            player.seatIndex = i
        }
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
        return this.renderHand(communityCards)
    }

    renderCard(rank, suit) {
        const name = `${rank}${suit}`
        return `<:${name}:${this.deck.resolveName(name)}>`
    }

    renderHand(cards) {
        return cards.map(card => this.renderCard(card.rank, card.suit)).join(' ')
    }

    viewHand(player) {
        return this.renderHand(
            this.table.holeCards()[player.seatIndex]
        )
    }

    resolveIndex(seatIndex) {
        return this.players.find(p => p.seatIndex === seatIndex)
    }

    renderActionMessage(player, validActions) {
        return {
            title: `Betting: ${this.capitalize(this.table.roundOfBetting())}`,
            description: `${player.user}, select an action from one of the buttons below.`,
            fields: [
                {
                    name: 'Pot',
                    value: this.table.pots().map(pot => `${pot.size}`).join(', ')
                },
                {
                    name: 'Players in this hand',
                    value: this.table.handPlayers().filter(p => p).map(({
                        totalChips,
                        _stack,
                        betSize
                    }, seatIndex) => `${this.resolveIndex(seatIndex).user} | ${totalChips} total | ${betSize} bet`).join('\n') 
                },
                {
                    name: 'Community Cards',
                    value: ''
                },
            ],
            color: options.colors.info
        }
    }

    renderWinnerMessage(winners) {
        console.log(winners)
        if(winners && winners.length) {
            return winners[0].map(([seatIndex, {}, cards]) => `${this.resolveIndex(seatIndex).user} won with a ${this.renderHand(cards)}!`).join(', ')
        } else {
            return 'No winners this hand!'
        }
    }

    awaitPlayerInput(player, validActions) {
        return new Promise(async (resolve, reject) => { 
            // Add view hand button
            validActions.actions.push('view hand')

            // Find call amount
            const bets = this.table.handPlayers().filter(p => p).map(({ betSize }) => betSize)
            const maxBet = Math.max(...bets)
            const playerBet = this.table.handPlayers()[player.seatIndex]?.betSize || 0
            const callAmount = maxBet - playerBet

            // Create buttons for each valid action
            let actionList = validActions.actions.map(action => 
                new ButtonBuilder()
                    .setCustomId(action)
                    .setLabel(this.capitalize(action) + (action === 'call' ? ` (${callAmount})` : ''))
                    .setStyle(this.getButtonStyle(action))
            )

            // Ask the player which action they would like to take
            const selectActionRow = new ActionRowBuilder()
            .addComponents(
                actionList
            )

            await this.channel.send({
                embeds: [this.renderActionMessage(player, validActions)],
            })

            const actionMessage = await this.channel.send({
                content: this.viewCommunityCards(),
                components: [selectActionRow]
            })

            // Wait for the player to select an action
            const actionFilter = i => this.players.has(i.user.id) && validActions.actions.includes(i.customId) 
            const actionCollector = actionMessage.createMessageComponentCollector({ filter: actionFilter, time: this.options['Timer'] * 1000 })

            actionCollector.on('collect', async i => {
                // Any user can view hand
                if(i.customId === 'view hand') {
                    // Show the player their hand
                    i.reply({ content: this.viewHand(this.players.get(i.user.id)), ephemeral: true })
                } else {
                    // Only the player who selected the action can continue
                    if(i.user.id === player.user.id){
                        actionCollector.stop(i.customId)
                        i.reply({ content: `${player.user} selected ${i.customId}!` })
                    }
                }
            })

            actionCollector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    // If the player didn't select an action in time, fold
                    resolve(['fold', null])
                    return
                }
                const selectedAction = collected.last().customId

                // Wait for the player to select a bet size
                if (selectedAction === 'bet' || selectedAction === 'raise') {
                    const betSize = await this.awaitPlayerBetSize(player, validActions)
                    resolve([selectedAction, betSize])
                } else {
                    // General case
                    resolve([selectedAction, null])
                }
            })

        })
    }

    awaitPlayerBetSize(player, validActions) {
        return new Promise(async (resolve, reject) => {
            await this.channel.send(`${player.user}, select a bet size from ${validActions.chipRange.min} to ${validActions.chipRange.max}`)
            
            const betSizeFilter = m => m.author.id === player.user.id && !isNaN(m.content) && (parseInt(m.content) <= validActions.chipRange.max) && (parseInt(m.content) >= validActions.chipRange.min)
            const betSizeCollector = this.channel.createMessageCollector({ filter: betSizeFilter, time: this.options['Timer'] * 1000 })

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
        })
    }

    async play() {
        const table = this.table
        table.startHand();

        while (table.isHandInProgress()) {
            while (table.isBettingRoundInProgress()) {
                const seatIndex = table.playerToAct();
                
                // Get `action` and possibly `betSize` in some way
                //const [action, betSize] = getPlayerActionSomehow(seatIndex);
                const [action, betSize] = await this.awaitPlayerAction(seatIndex);

                table.actionTaken(action, betSize);
            }
            
            table.endBettingRound()
            
            if (table.areBettingRoundsCompleted()) {
                table.showdown()

                // Show winners
                const winners = table.winners()
                await this.channel.send(this.renderWinnerMessage(winners))

                // Delay for 5 seconds
                await this.sleep(5000)

                // Add and remove players

                // Start a new hand
                table.startHand()
            }
        }


    }
}

export default Poker