import options from '../../../config/options.js'
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
        if(game.lastTurnStartedAt > -1) {
            msg.channel.send({
                embed: {
                    description: `${game.getPlayer(game.side).user} has ${Math.floor((Date.now() - game.lastTurnStartedAt) / 1000)} seconds left.`,
                    color: options.colors.info
                }
            })
        } else {
            msg.channel.send({
                embed: {
                    title: 'Error!',
                    description: 'Please wait for the game to begin before using this command.',
                    color: options.colors.error
                }
            })
        }
    }
})