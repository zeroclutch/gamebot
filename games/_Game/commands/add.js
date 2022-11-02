import GameCommand from '../../../types/command/GameCommand.js'

import Discord from 'discord.js-light'
const { Constants } = Discord

export default new GameCommand({
    name: 'add',
    usage: 'add @user',
    aliases: [],
    description: 'Adds a player to the current game',
    category: 'leader',
    permissions: ['GAME_LEADER'],
    args: [{
        name: 'user',
        description: 'The user to add to the game',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.USER,
    }],
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