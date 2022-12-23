import  { whiteCards, blackCards } from '../assets/cards.js'
import BlackCard from './BlackCard.js'

export default class CAHDeck {
    constructor(sets) {
        // adds all appropriate sets to the collection of cards
        this.sets = sets.length == 0 ? ['Base Set'] : sets
        this.whiteCards = []
        this.blackCards = []
        this.discards = {
            white: [],
            black: []
        }
        this.blackCard = new BlackCard('')
        this.sets.forEach(set => {
            whiteCards.find((cards, metadata) => metadata.name == set).forEach(card => this.whiteCards.push(card))
            blackCards.find((cards, metadata) => metadata.name == set).forEach(card => this.blackCards.push(card))
        })
    }

    // shuffles an array
    static shuffleArray(array) {
        array.sort(() => Math.random() - 0.5)
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
        let drawCards = deck.slice(0, count)
        deck.splice(0, count)
        return drawCards
    }

    // discards a card
    discard (deck, cards) {
        if(deck == 'white') this.discards.white.concat(cards)
        if(deck == 'black') this.discards.black.concat(cards)
    }
}

export let sets = []