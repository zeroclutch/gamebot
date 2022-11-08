import GameCommand from '../../../types/command/GameCommand.js'
import options from '../../../config/options.js'
import Discord from '../../../discord_mod.js'
const { EmbedBuilder } = Discord

export default new GameCommand({
    name: 'movehelp',
    usage: 'movehelp',
    aliases: [],
    description: 'Displays information about how to move',
    category: 'info',
    permissions: [],
    args: false,
    run: async function(msg, args, game) {
        let stream
        try {
            stream = await game.renderBoard(game.side)
        } catch (err) {
            // Game hasn't fully initialized
            msg.channel.send({
                embeds: [{
                    title: 'Error!',
                    description: 'Please wait for the game to begin before using this command.',
                    color: options.colors.error
                }]
            })
            return
        }

        const columns = 'hgfedcba'
        const rows = '12345678'

        let placeableSquares = game.board.getPlaceableSquares(game.side.toUpperCase()).map(s => '`' + msg.channel.prefix + columns[s._colIndex] + rows[s._rowIndex] + '`')

        let embed = new EmbedBuilder()
        .addFields([{
            name: 'Important Note:',
            value: `Remember to start all moves with the Gamebot's prefix, ${msg.channel.prefix}.`
        }, {
            name: 'How do I enter my moves?',
            value: `Find the square you want to place your tile in. Look for its column letter, and look for its row number. For example, the top left square is h1, and the bottom right one is a8. Then, type ${msg.channel.prefix}<letter><number>, and replace <letter> and <number> with your tile's letter and number.`
        }, {
            name: 'What if I want to place a tile on a square that is already occupied?',
            value: `You can't! You can only place a tile on a square that is not occupied.`
        }, {
            name: 'Possible moves', 
            value: `The possible moves right now are: ${placeableSquares.join(',')}`
        }])
        .setFooter({ text: `Refer back to this anytime!`})
        .setColor(options.colors.info)

        if(stream) embed.setImage(`attachment://image.png`)
        
        msg.channel.send({
            embeds: [embed],
            files: [{
                attachment: stream,
                name: 'image.png'
            }]
        })
    }
})
