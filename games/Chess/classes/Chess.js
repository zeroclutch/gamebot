const Game = require(`../../Game`)
import options from '../../../config/options'
import metadata from '../metadata.json'

import chess from 'chess'
const { createCanvas, loadImage } = require('canvas')
import Discord from '../../../discord_mod'
import LichessAPI from './../classes/LichessAPI'

/**
 * The base class for Chess games.
 */
export default class Chess extends Game {
    constructor(msg, settings) {
        super(msg, settings)
        
        this.metadata = metadata

        // Generated in this.generateOptions()
        this.gameOptions = []

        this.side = 'White'
        this.lastTurnStartedAt = -1

        this.defaultPlayer = {
            side: 'String'
        }

        this.messageListener = msg => {
            // Only listen to messages sent in the game channel
            if(msg.channel.id !== this.channel.id) return

            this.onMessage(msg)
            this.giveChessHelp(msg)
            this.getTimer(msg)
            this.getResignation(msg)
        }

        this.moves = []

        this.lichessClient = new LichessAPI()
        
        this.over = false
        
    }

    async getShopMapping() {
        const collection = this.msg.client.database.collection('items')
        const boards = await collection.find({ type: "Chess Board" }).toArray()
        const pieces = await collection.find({ type: "Chess Piece Set" }).toArray()
        return { boards, pieces }
    }

    async generateStyleLists () {
        const map = await this.getShopMapping()
        let pieces = ['Basic']
        let boards = ['Basic']

        await this.gameMaster.fetchDBInfo().then(info => {
            // get unlocked items
            info.unlockedItems.forEach(id => {
                if(id.endsWith('_piece')) {
                    pieces.push(map.pieces.find(item => item.itemID === id).friendlyName)
                } else if(id.endsWith('_board')) {
                    boards.push(map.boards.find(item => item.itemID === id).friendlyName)
                }
            })
        }).catch(console.error)
        return { pieces, boards }
    }

    async generateOptions() {
        let styles = await this.generateStyleLists()
        // Check unlocked styles
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
                choices: styles.pieces,
                default: 'Basic',
                note: `Unlock more piece styles in the shop!`
            },
            {
                friendlyName: 'Board Style',
                type: 'radio',
                choices: styles.boards,
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
                stream = await this.renderBoard(this.side)
            } catch (err) {
                // Game hasn't fully initialized
                msg.channel.send({
                    embed: {
                        title: 'Error!',
                        description: 'Please wait for the game to begin before using this command.',
                        color: options.colors.error
                    }
                })
                return
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


    getTimer(msg) {
        if(msg.content.toLowerCase().startsWith(`${options.prefix}timer`)) {
            if(this.lastTurnStartedAt > -1) {
                msg.channel.send({
                    embed: {
                        description: `${this.getPlayer(this.side).user} has ${Math.floor((Date.now() - this.lastTurnStartedAt) / 1000)} seconds left.`,
                        color: options.colors.info
                    }
                })
            } else {
                msg.channel.send({
                    embed: {
                        title: 'Error!',
                        description: 'Please wait for the game to begin before using this command.',
                        color: options.colors.error
                    }
                })
            }
        }
    }


    getResignation(msg) {
        if(msg.content.toLowerCase().startsWith(`${options.prefix}resign`) && this.players.has(msg.author.id)) {
            let winner = this.players.find(player => player.id !== msg.author.id) 
            if(this.moves.length > 2) {
                this.importGameToLichess(winner.side)
            }

            this.displayBoard(winner.side).then(() => {
                this.end(winner)
                this.over = true
            })
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
            const canvas = createCanvas(288, 288)
            const ctx = canvas.getContext('2d')

            // Draw border
            let border = await loadImage(`./games/Chess/assets/border/${side}-border.jpg`)
            ctx.drawImage(border, 0, 0, canvas.width, canvas.height)

            // Draw everything at half scale to reduce image size
            ctx.scale(0.5, 0.5)

            // Draw board
            let board = await loadImage(`./games/Chess/assets/boards/${this.options['Board Style']}.jpg`)
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

                    let piece = await loadImage(`./games/Chess/assets/pieces/${this.options['Piece Style'].toLowerCase()}/${square.piece.side.name}_${square.piece.type}.png`)
                    ctx.drawImage(piece, x, y, 64, 64)
                }
            }
            resolve(canvas.createJPEGStream({
                quality: 1,
                chromaSubsampling: false,
                progressive: true
              }))
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
        .addField('ℹ️', 'To make a move, enter the bot prefix followed by a valid move in algebraic notation.', true)
        .addField('⏰', `Type ${options.prefix}timer to see the move time remaining.`, true)
        .addField('🏳', `Type ${options.prefix}resign to give up.`, true)
        .setFooter(`Type ${options.prefix}movehelp for help.`)
        .setImage(`attachment://image.png`)
        .setColor({ 'White': '#fffffe', 'Black': '#000001' }[side])

        this.client.logger.log('Generated image', {
            game: this.metadata.id,
        })

        await this.channel.send(`${this.getPlayer(side).user}, it's your turn to move as ${side.toLowerCase()}!`, embed).catch(console.error)
    }

    awaitMove(side) {
        return new Promise((resolve, reject) => {
            this.lastTurnStartedAt = Date.now() + parseInt(this.options['Timer']) * 1000

            const filter = m => m.content.startsWith(options.prefix) && this.players.has(m.author.id) && m.author.id == this.getPlayer(side).user.id
            let collector = this.channel.createMessageCollector(filter, { time: parseInt(this.options['Timer']) * 1000 })
            
            collector.on('collect', m => {
                if(this.ending || this.over) return
                let move = m.content.replace(options.prefix, '')
                if(this.status.notatedMoves[move]) {
                    this.gameClient.move(move)
                    this.moves.push(move)
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
                if(this.ending || this.over) return
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

    getPGN(winner) {
        if(winner) winner = winner.toLowerCase()
        if(winner === 'white')      winner = '1-0'
        else if(winner === 'black') winner = '0-1'
        else winner = '1/2-1/2'
        let today = new Date(Date.now())

        // Formats a date to have a leading 0
        const _f = val => {
            val = `${val}`
            return (val.length == 1 ? '0' : '') + val
        }
        let pgn = `pgn=[Event "Gamebot Online Match"]
        [Site "Discord"]
        [Date "${_f(today.getUTCFullYear())}.${_f(today.getUTCMonth() + 1)}.${_f(today.getUTCDate())}"]
        [Result "${winner}"]
        [White "${this.getPlayer('White').user.tag}"]
        [Black "${this.getPlayer('Black').user.tag}"]\n\n`
        for(let i = 0; i < this.moves.length; i+=1) {
            if(i % 2 === 0) {
                pgn += (i / 2 + 1) + '. '
            }
            pgn += this.moves[i] + ' '
        }
        pgn += winner
        console.log(pgn)
        return pgn
    }

    importGameToLichess(winner) {
        this.lichessClient.importGame(this.getPGN(winner)).then(res => this.channel.send({
            embed: {
                title: 'View the computer analysis and game recap.',
                description: `The moves and computer analysis are available at ${res.data.url}.`,
                color: options.colors.info
            }
        }))
    }

    analyzeBoard(side) {
        if(this.status.isStalemate || this.status.isRepetition) {
            this.importGameToLichess('draw')
            this.end(undefined, `The game is a draw.\nTo play games with the community, [join our server](${options.serverInvite}?ref=gameEnd)!`)
            this.over = true
        }

        if(this.status.isCheckmate) {
            let winner = this.players.find(player => player.side == side)
            this.importGameToLichess(side)
            this.displayBoard(side).then(() => {
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
        let sides = ['White', 'Black']
        while(!this.over) {
            this.side = sides[move % 2]
            // Display the board
            await this.displayBoard(this.side)
            // Move white
            await this.awaitMove(this.side)
            this.analyzeBoard(this.side)
            move++
        } 
    }

    finish(id) {
        let winner = this.players.find(player => player.id == id)
        this.end(winner, `${winner.user} has won!\nTo play games with the community, [join our server](${options.serverInvite}?ref=gameEnd)!`)
    }
}
