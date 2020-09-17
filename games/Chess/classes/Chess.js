const Game = require(`../../Game`)
const options = require('../../../config/options')
const metadata = require('../metadata.json')

const chess = require('chess')
const { createCanvas, registerFont, loadImage } = require('canvas')

/**
 * The base class for Chess games.
 */
module.exports = class ConnectFour extends Game {
    constructor(msg, settings) {
        super(msg, settings)
        
        this.metadata = metadata

        this.gameOptions = [
            {
                friendlyName: 'Side',
                type: 'radio',
                choices: ['Random', 'Black', 'White'],
                default: 'Random',
                note: `The side that the game leader will play on.`
            },
            {
                friendlyName: 'Piece Style',
                type: 'radio',
                choices: ['Basic'],
                default: 'Basic',
                filter: m => !isNaN(m.content) && (parseInt(m.content) <= 15) && (parseInt(m.content) >= 3),
                note: `Unlock more piece styles in the shop!`
            },
            {
                friendlyName: 'Board Style',
                type: 'radio',
                choices: ['Basic'],
                default: 'Basic',
                note: `Unlock more board styles in the shop!`
            },
            {
                friendlyName: 'Timer',
                type: 'free',
                default: 60,
                filter: m => !isNaN(parseInt(m.content)) && (parseInt(m.content) <= 600) && (parseInt(m.content) >= 5),
                note: 'Enter a value in seconds for the move timer, between 5 and 600 seconds.'
            },
        ]

        this.defaultPlayer = {
            side: 'String'
        }
        
        this.status, this.over = false
        
    }

    /**
     * Initialize the game with its specific settings.
     */
    async gameInit() {
        this.gameClient = chess.create({ PGN: true })
    }

    configureOptions() {
        // Check unlocked styles
        // Update this.gameOptions with player's unlocked content
    }

    setSides() {
        // Use preset side for leader
        let side = this.options['Side']
        let opponent = this.players.find(p => p.user.id !== this.leader.user.id)
        if(side == 'Random') {
            this.leader.side = Math.random() >= 0.5 ? 'Black' : 'White'
        } else {
            this.leader.side = side
        }

        // Set opponent to inverse
        opponent.side = this.leader.side == 'White' ?  'Black' : 'White'
    }

    renderBoard() {
        
    }

    displayBoard() {
        this.status.board.squares.forEach(square => {
            console.log(square)
        })
    }

    analyzeBoard(lastMove) {
        let board = this.status.board
        if(board.isStalemate) this.end(undefined, `The game is a draw.\nTo play games with the community, [join our server](${options.serverInvite})!`)
        if(board.isCheckmate) {
            let winner = this.players.find(player => player.side == lastMove)
            this.end(winner)
        }
        console.log(this.status)
    }

    async play() {
        this.setSides()
        do {
            this.status = this.gameClient.getStatus()
            // Display the board
            await this.displayBoard()
            // Move white

            this.analyzeBoard('White')
            await this.displayBoard()
            // Move black

            this.analyzeBoard('Black')
        }
    }

    finish(id) {
        let winner = this.players.find(player => player.id == id)
        this.end(winner, `${winner.user} has won! ${this.renderBoard()}\nTo play games with the community, [join our server](${options.serverInvite})!`)
    }
    

}
