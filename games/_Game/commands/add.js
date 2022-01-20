import GameCommand from '../../../types/command/GameCommand.js'
export default new GameCommand({
    name: 'add',
    usage: 'add',
    aliases: [],
    description: 'Adds a player to the current game',
    category: 'leader',
    permissions: ['GAME_LEADER'],
    args: false,
    run: async function(msg, args, game) {
        let member = args[0].replace(/\D/g, '')
        if(game.settings.updatePlayersAnytime) {
            await game.addPlayer(member, null)
            game.updatePlayers()
        } else {
            await game.addPlayer(member)
        }
    }
})