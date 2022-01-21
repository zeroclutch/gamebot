import GameCommand from '../../../types/command/GameCommand.js'
import options from '../../../config/options.js'

export default new GameCommand({
    name: 'leader',
    usage: 'leader',
    aliases: [],
    description: 'Displays the current game leader',
    category: 'info',
    permissions: [],
    args: false,
    run: function(msg, args, game) {
        msg.channel.sendEmbed(`The game leader is ${game.leader}. They can add players by typing \`${msg.channel.prefix}add @user\`, kick players by typing \`${msg.channel.prefix}kick @user\`, and end the game using \`${msg.channel.prefix}end\`.`)
    }
})