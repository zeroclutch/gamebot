import Game from '../../_Game/main.js'
import options from '../../../config/options.js'
import metadata from '../metadata.js'

import chess from 'chess'
import canvas from 'canvas'
const { createCanvas, loadImage } = canvas
import Discord from '../../../discord_mod.js'
import LichessAPI from './../classes/LichessAPI.js'

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

        this.moves = []

        this.lichessClient = new LichessAPI()
        
        this.over = false
        
    }

    async getShopMapping() {
        const collection = this.msg.client.database.collection('items')
        const boards = await collection.find({ type: "Game Board" }).toArray()
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
        let embed = new Discord.MessageEmbed()
        .attachFiles([{
            attachment: stream,
            name: 'image.png'
        }])
        .setDescription(`You have ${this.options['Timer']} seconds to make a move.`)
        .addField('ℹ️', 'To make a move, enter the bot prefix followed by a valid move in algebraic notation.', true)
        .addField('⏰', `Type ${this.channel.prefix}timer to see the move time remaining.`, true)
        .addField('🏳', `Type ${this.channel.prefix}resign to give up.`, true)
        .setFooter(`Type ${this.channel.prefix}movehelp for help.`)
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

            const filter = m => m.content.startsWith(this.channel.prefix) && this.players.has(m.author.id) && m.author.id == this.getPlayer(side).user.id
            let collector = this.channel.createMessageCollector(filter, { time: parseInt(this.options['Timer']) * 1000 })
            
            collector.on('collect', m => {
                if(this.ending || this.over) return
                let move = m.content.replace(this.channel.prefix, '')
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
        do {
            this.side = sides[move % 2]
            // Display the board
            await this.displayBoard(this.side)
            // Move white
            await this.awaitMove(this.side)
            this.analyzeBoard(this.side)
            move++
        } while(!this.over)
    }

    finish(id) {
        let winner = this.players.find(player => player.id == id)
        this.end(winner, `${winner.user} has won!\nTo play games with the community, [join our server](${options.serverInvite}?ref=gameEnd)!`)
    }
}
