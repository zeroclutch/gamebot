import GameCommand from '../../../types/command/GameCommand.js'
export default new GameCommand({
    name: 'game',
    usage: 'game',
    aliases: [],
    description: 'Outputs the game info',
    category: 'info',
    permissions: [],
    args: false,
    run: async function(msg, args, game) {
        msg.channel.send(`There is a game playing in this channel.`)
    }
})