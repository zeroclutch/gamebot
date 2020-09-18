const Game = require(`../../Game`)
const options = require('../../../config/options')
const metadata = require('../metadata.json')

const chess = require('chess')
const { createCanvas, loadImage } = require('canvas')
const Discord = require('../../../discord_mod')

/**
 * The base class for Chess games.
 */
module.exports = class Chess extends Game {
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
                default: 300,
                filter: m => !isNaN(parseInt(m.content)) && (parseInt(m.content) <= 1800) && (parseInt(m.content) >= 5),
                note: 'Enter a value in seconds for the move timer, between 5 and 1800 seconds.'
            },
        ]

        this.defaultPlayer = {
            side: 'String'
        }

        this.messageListener = msg => {
            this.onMessage(msg)
            this.giveChessHelp(msg)
        }
        
        this.over = false
        
    }

    generateOptions() {
        // Check unlocked styles
        // Update this.gameOptions with player's unlocked content
    }

    /**
     * Initialize the game with its specific settings.
     */
    async gameInit() {
        this.gameClient = chess.create({ PGN: true })
    }

    async giveChessHelp(msg) {
        if(msg.content.toLowerCase().startsWith(`${options.prefix}movehelp`)) {
            let stream
            try {
                stream = await this.renderBoard('White')
            } catch (err) {
                // Game hasn't fully initialized
            }
            let embed = new Discord.RichEmbed()
            .attachFile({
                attachment: stream,
                name: 'image.png'
            })
            .addField('Important Note:', `Remember to start all moves with the Gamebot's prefix, ${options.prefix}.`)
            .addField('How do I enter my moves?', `Gamebot uses [algebraic notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)) for chess moves. This looks long, but it's really straightforward and common in Chess! It has two main parts:`)
            .addField('First...', `**Choose which piece you want to move.** Each piece is represented by a letter.
            <:white_pawn:756373313126662184> <:black_pawn:756373313265205278> = No letter needed unless promoting or capturing—then use the letter column (aka "file").
            <:white_knight:756373313214873610> <:black_knight:756373313005027340> = N
            <:white_bishop:756373313340833933> <:black_bishop:756373313139245138> = B
            <:white_rook:756373312862683179> <:black_rook:756373313298759741> = R
            <:white_queen:756373313084981409> <:black_queen:756373313324056636> = Q
            <:white_king:756373313231519805> <:black_king:756373312984318033> = K`)
            .addField('Second...', `**Decide where you want to move your piece.** If you look at the chessboard, there are letters across the bottom, and numbers across the sides. Each square is identified by a pair of coordinates, the letter (also known as the "file") and number (aka "rank") combined. For white, the top right square is h8 and the bottom left square is a1. Find the coordinates of your destination square.\n\nIf there's an opponent's piece on it, put "x" before the name of the square to capture their piece.`)
            .addField('Combine them!', `Now just combine these, and make your move! Some examples would be ${options.prefix}e4, ${options.prefix}d5, ${options.prefix}exd5 (pawn on e4 takes pawn on d5), ${options.prefix}Qxd5 (Queen takes d5)`)
            .addField('A few small exceptions...', `**To castle**, use O-O for king-side castle and O-O-O for queen-side castle.
            
            **To promote a pawn**, use the letter (aka file) of the pawn, then the desired piece you want to promote to. For example, ${options.prefix}e8Q. If you're going to capture into a promotion, it works similarly, like ${options.prefix}dxe8Q.
            
            **Sometimes** two of the same piece can make it to the same square. For example, both of your rooks might be able to go to e1 if there's nothing else in their way. In this case, you have to specify which letter column (aka "file") the piece you want to move is in. Just add the letter right after, like ${options.prefix}Rae1. If both pieces are in the same number row (aka "rank"), use the number instead, like ${options.prefix}R1e1. In the rare chance that isn't enough (like if you have three queens in a triangle), specify both rank and file, like ${options.prefix}Ra1e1.`)
            .setFooter(`Refer back to this anytime!`)
            .setColor(options.colors.info)

            if(stream) embed.setImage(`attachment://image.png`)
            
            msg.channel.send(embed)
        }
    }

    setSides() {
        // Use preset side for leader
        let side = this.options['Side']
        let leader = this.players.find(p => p.user.id === this.leader.id)
        let opponent = this.players.find(p => p.user.id !== this.leader.id)
        if(side == 'Random') {
            leader.side = Math.random() >= 0.5 ? 'Black' : 'White'
        } else {
            leader.side = side
        }

        // Set opponent to inverse
        opponent.side = leader.side == 'White' ?  'Black' : 'White'
    }

    renderBoard(side) {
        side = side.toLowerCase()
        // Render board using canvas
        return new Promise(async (resolve, reject) => {
            const canvas = createCanvas(576, 576)
            const ctx = canvas.getContext('2d')

            // Draw border
            let border = await loadImage(`./games/Chess/assets/border/${side}-border.jpg`)
            ctx.drawImage(border, 0, 0, canvas.width, canvas.height)

            // Draw board
            let board = await loadImage(`./games/Chess/assets/board/${this.options['Board Style']}.jpg`)
            ctx.drawImage(board, 32, 32, 512, 512)

            // Draw pieces
            const files = side == 'white' ? 'abcdefgh' : 'hgfedcba'
            const ranks = side == 'white' ? '87654321' : '12345678'
            for(let i = 0; i < this.status.board.squares.length; i++) {
                let square = this.status.board.squares[i]
                if(square.piece) {
                    let x = files.indexOf(square.file) * 64 + 32
                    let y = ranks.indexOf(`${square.rank}`) * 64 + 32

                    if(square.piece.type == 'king' && square.piece.side.name == side && (this.status.isCheck || this.status.isCheckmate)) {
                        let check = await loadImage(`./games/Chess/assets/pieces/check.png`)
                        ctx.drawImage(check, x, y, 64, 64)
                    }

                    let piece = await loadImage(`./games/Chess/assets/pieces/${this.options['Piece Style']}/${square.piece.side.name}_${square.piece.type}.png`)
                    ctx.drawImage(piece, x, y, 64, 64)
                }
            }
            resolve(canvas.createPNGStream())
        })

    }

    getPlayer(side) {
        return this.players.find(player => player.side.toLowerCase() === side.toLowerCase())
    }

    async displayBoard(side) {
        let stream = await this.renderBoard(side)
        let embed = new Discord.RichEmbed()
        .attachFile({
            attachment: stream,
            name: 'image.png'
        })
        .setDescription(`You have ${this.options['Timer']} seconds to make a move.`)
        .setFooter(`To make a move, enter the bot prefix, followed by a valid move in algebraic notation. Type ${options.prefix}movehelp for help.`)
        .setImage(`attachment://image.png`)
        .setColor({ 'White': '#fffffe', 'Black': '#000001' }[side])

        await this.channel.send(`${this.getPlayer(side).user}, it's your turn to move as ${side.toLowerCase()}!`, embed).catch(console.error)
    }

    awaitMove(side) {
        return new Promise((resolve, reject) => {
            const filter = m => m.content.startsWith(options.prefix) && this.players.has(m.author.id) && m.author.id == this.getPlayer(side).user.id
            let collector = this.channel.createMessageCollector(filter, { time: parseInt(this.options['Timer']) * 1000 })
            collector.on('collect', m => {
                let move = m.content.replace(options.prefix, '')
                if(this.status.notatedMoves[move]) {
                    this.gameClient.move(move)
                    collector.stop('submitted')
                    resolve(true)
                } else {
                    this.channel.send({
                        embed: {
                            title: 'Invalid move!',
                            description: 'Be sure to enter your move in algebraic notation.',
                            color: options.colors.error
                        }
                    })
                }
            })
            collector.on('end', (collected, reason) => {
                // Handle time
                if(reason == 'submitted') {
                    // Player made their move
                } else {
                    // Player loses on time
                    this.channel.send({
                        embed: {
                            title: 'Time ran out!',
                            description: `${this.getPlayer(side).user} ran out of time and lost.`,
                            color: options.colors.error
                        }
                    })
                    this.end(this.getPlayer(side == 'White' ? 'Black' : 'White'))
                }
            })
        })
    }

    analyzeBoard(side) {
        if(this.status.isStalemate || this.status.isRepetition) this.end(undefined, `The game is a draw.\nTo play games with the community, [join our server](${options.serverInvite})!`)
        if(this.status.isCheckmate) {
            this.displayBoard(side).then(() => {
                let winner = this.players.find(player => player.side == side)
                this.end(winner)
                this.over = true
            })
        }
    }

    get status() {
        return this.gameClient.getStatus()
    }

    async play() {
        this.setSides()
        let move = 0;
        let teams = ['White', 'Black']
        do {
            let team = teams[move % 2]
            // Display the board
            await this.displayBoard(team)
            // Move white
            await this.awaitMove(team)
            this.analyzeBoard(team)
            move++
            
        } while(!this.over)
    }

    finish(id) {
        let winner = this.players.find(player => player.id == id)
        this.end(winner, `${winner.user} has won!\nTo play games with the community, [join our server](${options.serverInvite})!`)
    }
    

}
