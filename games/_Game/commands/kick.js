import GameCommand from '../../../types/command/GameCommand.js'

import Discord from 'discord.js-light'
const { Constants } = Discord

export default new GameCommand({
    name: 'kick',
    usage: 'kick @user',
    aliases: [],
    description: 'Kick a player from the current game',
    category: 'leader',
    permissions: ['GAME_LEADER'],
    args: [{
        name: 'user',
        description: 'The user to kick from the game',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.USER,
    }],
    run: async function(msg, args, game) {
        let member = args[0].replace(/\D/g, '')
        if(game.settings.updatePlayersAnytime) {
            await game.removePlayer(member, null)
            game.updatePlayers()
        } else {
            await game.removePlayer(member)
        }
    }
})