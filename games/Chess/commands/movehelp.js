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
        .addField('How do I enter my moves?', `Gamebot uses [algebraic notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)) for chess moves. This looks long, but it's really straightforward and common in Chess! It has two main parts:`)
        .addField('First...', `**Choose which piece you want to move.** Each piece is represented by a letter.
        <:white_pawn:756373313126662184> <:black_pawn:756373313265205278> = No letter needed unless promoting or capturing—then use the letter column (aka "file").
        <:white_knight:756373313214873610> <:black_knight:756373313005027340> = N
        <:white_bishop:756373313340833933> <:black_bishop:756373313139245138> = B
        <:white_rook:756373312862683179> <:black_rook:756373313298759741> = R
        <:white_queen:756373313084981409> <:black_queen:756373313324056636> = Q
        <:white_king:756373313231519805> <:black_king:756373312984318033> = K`)
        .addField('Second...', `**Decide where you want to move your piece.** If you look at the chessboard, there are letters across the bottom, and numbers across the sides. Each square is identified by a pair of coordinates, the letter (also known as the "file") and number (aka "rank") combined. For white, the top right square is h8 and the bottom left square is a1. Find the coordinates of your destination square.\n\nIf there's an opponent's piece on it, put "x" before the name of the square to capture their piece.`)
        .addField('Combine them!', `Now just combine these, and make your move! Some examples would be ${msg.channel.prefix}e4, ${msg.channel.prefix}d5, ${msg.channel.prefix}exd5 (pawn on e4 takes pawn on d5), ${msg.channel.prefix}Qxd5 (Queen takes d5)`)
        .addField('A few small exceptions...', `**To castle**, use O-O for king-side castle and O-O-O for queen-side castle.
        
        **To promote a pawn**, use the letter (aka file) of the pawn, then the desired piece you want to promote to. For example, ${msg.channel.prefix}e8Q. If you're going to capture into a promotion, it works similarly, like ${msg.channel.prefix}dxe8Q.
        
        **Sometimes** two of the same piece can make it to the same square. For example, both of your rooks might be able to go to e1 if there's nothing else in their way. In this case, you have to specify which letter column (aka "file") the piece you want to move is in. Just add the letter right after, like ${msg.channel.prefix}Rae1. If both pieces are in the same number row (aka "rank"), use the number instead, like ${msg.channel.prefix}R1e1. In the rare chance that isn't enough (like if you have three queens in a triangle), specify both rank and file, like ${msg.channel.prefix}Ra1e1.`)
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
