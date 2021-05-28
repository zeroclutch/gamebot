import GameCommand from '../../../types/command/GameCommand.js'

export default new GameCommand({
    name: 'resign',
    usage: 'resign',
    aliases: [],
    description: 'Resigns the game.',
    category: 'info',
    permissions: [],
    args: false,
    run: function(msg, args, game) {
        let winner = game.players.find(player => player.id !== msg.author.id) 

        game.end(winner)
        game.over = true
    }
})