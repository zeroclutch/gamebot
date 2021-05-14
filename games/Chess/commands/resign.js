import GameCommand from '../../../types/command/GameCommand.js'

export default new GameCommand({
    name: 'timer',
    usage: 'timer',
    aliases: [],
    description: 'Shows the timer for the current player',
    category: 'info',
    permissions: [],
    args: false,
    run: function(msg, args, game) {
        let winner = game.players.find(player => player.id !== msg.author.id) 
        if(game.moves.length > 2) {
            game.importGameToLichess(winner.side)
        }

        game.displayBoard(winner.side).then(() => {
            game.end(winner)
            game.over = true
        })
    }
})