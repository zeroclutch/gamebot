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
        let attachment
        try {
            attachment = await game.renderBoard(game.side)
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
        let embed = new EmbedBuilder()
        .addFields([{
            name: 'Important Note:',
            value: `Remember to start all moves with the Gamebot's prefix, ${msg.channel.prefix}.`
        }, {
            name: 'First...',
            value: `**Find the location of the piece you want to move.** On the edge of the chessboard, there are letters a-h ("files") and numbers 1-8 ("ranks"). Each square is identified by the file letter and rank number combined. For example, the white rooks start on **a1** and **h1** and the black rooks start on **a8** and **h8**. Find your piece's square, and type it in the message box.`
        }, {
            name: 'Second...',
            value: `**Decide where you want to move your piece.** We can use the same method to find the destination square. Find the file and rank of the square you want to move your piece to, and type it in the message box.`
        }, {
            name: 'Combine them!',
            value: `Now just combine these, and make your move! An example would be ${msg.channel.prefix}e2e4. To castle, move the king left or right two spaces in either direction.`
        }, {
            name: 'Special Moves',
            value: `There are a few special moves in chess. To promote a pawn, type ${msg.channel.prefix}e8Q, where Q is the piece you want to promote to. To castle, type ${msg.channel.prefix}e1g1 or ${msg.channel.prefix}e1c1. To en passant, type ${msg.channel.prefix}e5d6 to take the pawn on d5.`
        }, {
            name: `What if I'm already a pro?`,
            value: `Gamebot supports [algebraic notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)), and you can make your moves using that instead.`
        }])
        .setFooter({ text: `Refer back to this anytime!`})
        .setColor(options.colors.info)
    
        if(attachment) embed.setImage(`attachment://image.png`)
        
        msg.channel.send({
            embeds: [embed],
            files: [ attachment ]
        })
    }
})
