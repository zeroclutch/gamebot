import GameCommand from '../../../types/command/GameCommand.js'
import options from '../../../config/options.js'
import Discord from '../../../discord_mod.js'
const { MessageEmbed } = Discord

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
        let embed = new MessageEmbed()
        .addField('Important Note:', `Remember to start all moves with the Gamebot's prefix, ${msg.channel.prefix}.`)
        .addField('First...', `**Find the location of the piece you want to move.** On the edge of the chessboard, there are letters a-h ("files") and numbers 1-8 ("ranks"). Each square is identified by the file letter and rank number combined. For example, the white rooks start on **a1** and **h1** and the black rooks start on **a8** and **h8**. Find your piece's square, and type it in the message box.`)
        .addField('Second...', `**Decide where you want to move your piece.** We can use the same method to find the destination square. Find the file and rank of the square you want to move your piece to, and type it in the message box.`)
        .addField('Combine them!', `Now just combine these, and make your move! An example would be ${msg.channel.prefix}e2e4. To castle, move the king left or right two spaces in either direction.`)
        .addField(`What if I'm already a pro?`, `Gamebot supports [algebraic notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)), and you can make your moves using that instead.`)
        .setFooter(`Refer back to this anytime!`)
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
