import GameCommand from '../../../types/command/GameCommand.js'
export default new GameCommand({
    name: 'leave',
    usage: 'leave',
    aliases: [],
    description: 'Leave the current game',
    category: 'player',
    permissions: [],
    args: false,
    run: async function(msg, args, game) {
        let member = msg.member || msg.author.id
        if(game.settings.updatePlayersAnytime) {
            await game.removePlayer(member, null)
            game.updatePlayers()
        } else {
            await game.removePlayer(member)
        }
    }
})