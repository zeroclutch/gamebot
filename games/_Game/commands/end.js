import GameCommand from '../../../types/command/GameCommand.js'
export default new GameCommand({
    name: 'end',
    usage: 'end',
    aliases: [],
    description: 'Ends the current game',
    category: 'leader',
    permissions: ['GAME_LEADER'],
    args: false,
    run: function(msg, args, game) {
        msg.client.gameManager.stop(msg.channel)
    }
})