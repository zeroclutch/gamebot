import GameCommand from '../../../types/command/GameCommand.js'
export default new GameCommand({
    name: 'leave',
    usage: 'leave',
    aliases: [],
    description: 'Leave the current game',
    category: 'player',
    permissions: [],
    args: false,
    run: function(msg, args, game) {
        game.forceStop()
    }
})