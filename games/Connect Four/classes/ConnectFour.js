import Game from '../../_Game/main.js'
import options from '../../../config/options.js'
import metadata from '../metadata.js'

const ICONS = ['⚪️','🔴','🔵', '💚', '💛', '💜', '🖤']
const FOOTER = ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟']

/**
 * The base class for Connect 4 games.
 */
export default class ConnectFour extends Game {
    constructor(msg, settings) {
        super(msg, settings)
        
        this.metadata = metadata

        this.gameOptions = [
            {
                friendlyName: 'Board Height',
                type: 'free',
                default: 6,
                filter: m => !isNaN(m.content) && (parseInt(m.content) <= 15) && (parseInt(m.content) >= 3),
                note: `Enter how tall the board's height should be, from 5 to 15. Larger boards are recommended for more players.`
            },
            {
                friendlyName: 'Board Width',
                type: 'free',
                default: 7,
                filter: m => !isNaN(m.content) && (parseInt(m.content) <= 10) && (parseInt(m.content) >= 3),
                note: `Enter how tall the board's height should be, from 7 to 10. Larger boards are recommended for more players.`
            },
            {
                friendlyName: 'Connect More?',
                type: 'free',
                default: 4,
                filter: m => !isNaN(m.content) && (parseInt(m.content) <= 5) && (parseInt(m.content) >= 3),
                note: `Enter how many pieces a player has to connect in order to win, from 3 to 5. Four is recommended!`
            },
        ]

        this.defaultPlayer = {
            id: -1
        }

        this.timeLimit = 60000

        this.board = [
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
        ]

        
        this.settings.defaultUpdatePlayerMessage = null
    }

    /**
     * Initialize the game with its specific settings.
     */
    async gameInit() {
        // Give players their IDs
        let index = 0
        this.players.forEach(player => {
            index++
            player.id = index
        })

        let board = []
        let width = parseInt(this.options['Board Width'])
        let height = parseInt(this.options['Board Height'])

        for(let y = 0; y < height; y++) {
            board.push([])
            for(let x = 0; x < width; x++) {
                board[y].push(0)
            }
        }
        this.board = board
    }

    /**
     * Check if a column is full
     * @param {Number} column The column to consider.
     * @returns {Boolean} true if the column has no more blank spaces.
     */
    columnIsFull(column) {
        if(!this.board[0][column]) return false
        this.msg.channel.sendMsgEmbed('That column is full!', 'Error', options.colors.error).catch(console.error)
        return true
    }

    /**
     * @returns {String} the game board, stringified
     */
    renderBoard () {
        let arr = this.board
        let board = ''
        let footer = ''

        for(let y = 0; y < arr.length; y++) {
            footer = ''
            for(let x = 0; x < arr[y].length; x++) {
                board += `${ICONS[arr[y][x]]} `
                footer += FOOTER[x + 1] + ' '
            }
            board += '\n'
        }

        return `\`\`\`${board}${footer}\`\`\``
    }

    /**
     * Allows a player to select a column.
     * @param {Object} player The player object
     */
    async allowSelection(player) {
        const filter = m => {
            if(m.author.id != player.user.id || isNaN(m.content)) return false
            let number = parseInt(m.content)
            return number <= this.board[0].length && number >= 1
        }

        let collected = await this.channel.awaitMessages(filter, { max: 1, time: this.timeLimit, errors: ['time'] })
        .catch(err => {
            if(this.ending) return
            this.channel.sendMsgEmbed('You ran out of time!', 'Uh oh...', options.colors.error)
            this.forceStop()
        })
        if(this.ending) return
        let column = parseInt(collected.first().content) - 1
        return column
    }

    /**
     * Drops a tile in a given column
     * @param {Number} value The corresponding player's ID 
     * @param {Number} column The column to drop it in
     * @returns true if the tile was able to be dropped into the table
     */
    dropTile(value, column) {
        let size = this.board.length - 1
        for(let i = size; i > -1; i--) {
            let tile = this.board[i][column]
            if(!tile) {
                this.board[i][column] = value
                break
            }
        }
    }

     /**
     * Checks to see if there is a winner
     * @returns The winning value, or 0 if there is no winner
     */
    getWinner () {
        const MIN_LENGTH = parseInt(this.options['Connect More?'])
        let total = ''
        let flipped = ''
        let diagonalsLeft = new Array(25).fill('')
        let diagonalsRight = new Array(25).fill('')
    
        this.board.map((col,x) => {
            col.map((tile,y) => {
                total += tile;
                diagonalsRight[8 + x - y] += tile
                diagonalsLeft[x + y] += tile
            })
            total += ' '
        })

        let size = Math.max(this.board.length, this.board[0].length)

        // get flipped
        for(let y = 0; y < size; y++) {
            for(let x = 0; x < size; x++) {
                if(this.board[x] === undefined || this.board[x][y] === undefined) continue
                flipped += this.board[x][y]
            }
            flipped += ' '
        }

        let regex = []
        for(let i = 1; i <= this.players.size; i++) {
            regex.push(`${i}{${MIN_LENGTH}}`)
        }
        regex = regex.join('|')
    
        let result = `${total} ${flipped} ${diagonalsRight.join(' ')}  ${diagonalsLeft.join(' ')}`.match(new RegExp(regex))
        return result ? result[0][0] : false
    }

    async play() {
        let players = this.players.array()
        let index = -1
        do {
            index++
            let player = players[index % players.length]
            if(index == this.board.height * this.board.width) {
                this.forceStop()
            }

            // Allow a player to view the board and place a tile
            let column = -1
            do {
                if(this.ending) return
                await this.channel.sendMsgEmbed(`First to ${this.options['Connect More?']} in a row wins!\n${this.renderBoard()}\n\n${player.user} ${ICONS[player.id]}, select a column between 1-${this.board[0].length} in ${Math.floor(this.timeLimit/1000)} seconds!`).catch(console.error)
                column = await this.allowSelection(player).catch(console.error)
            } while(this.columnIsFull(column))
            this.dropTile(player.id, column)
        } while(!this.getWinner())
        this.finish(this.getWinner())
    }

    finish(id) {
        let winner = this.players.find(player => player.id == id)
        this.end(winner, `${winner.user} has won! ${this.renderBoard()}\nTo play games with the community, [join our server](${options.serverInvite}?ref=gameEnd)!`)
    }
    

}
