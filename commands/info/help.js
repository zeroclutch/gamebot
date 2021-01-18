import Discord from '../../discord_mod.js'
import options from '../../config/options.js'

export default {
    name: 'help',
    usage: 'help',
    aliases: ['commands'],
    description: 'Provides help for users',
    category: 'info',
    permissions: [],
    dmCommand: true,
    args: false,
    run: function(msg, args) {
        // find command in question
        const helpCmd = msg.client.commands.find(cmd => cmd.name === args.join(" ")) || msg.client.commands.find(cmd => cmd.aliases.includes(args.join(" ")))
        // find help for a specific command
        if (helpCmd && (helpCmd.category !== 'dev' || msg.author.id == process.env.OWNER_ID) && (helpCmd.category !== 'mod' || msg.client.moderators.includes(msg.author.id))) {
            msg.channel.sendMsgEmbed(`**__HELP:__**
                    \nCommand: \`${prefix}${helpCmd.name}\`
                    \nDescription: ${helpCmd.description}
                    \nUsage: \`${prefix}${helpCmd.usage}\`
                    \nAliases: \`${(helpCmd.aliases.join(", ")||'None')}\``)
            // find list of commands
        } else {
            // sort each command by category
            // get category list
            var categories = []
            for (var item of msg.client.commands) {
                var key = item[0],
                    value = item[1]
                if (!categories.includes(value.category) && (value.category != 'dev' || msg.author.id == process.env.OWNER_ID) && (value.category !== 'mod' || msg.client.moderators.includes(msg.author.id))) {
                    categories.push(value.category)
                }
            }

            var embed = new Discord.MessageEmbed()
            embed.setTitle('Help - List of Commands for Gamebot')
            embed.setThumbnail(msg.client.user.avatarURL({dynamic: true}))
            embed.setColor(options.colors.economy)
            categories.forEach(category => {
                var commandList = ''
                msg.client.commands.forEach(cmd => {
                    if (cmd.category == category) {
                        commandList += `\`${options.prefix}${cmd.usage}\` - ${cmd.description}\n`
                    }
                })
                embed.addField('Category: ' + category.toUpperCase(), commandList)
            })
            embed.addField('Category: IN-GAME',
                '`' + options.prefix + 'kick <@user>` - Kick a user from the game (game leader only).\n`' +
                options.prefix + 'add <@user>` - Add a user to the game (game leader only).\n`' +
                options.prefix + 'join` - Join the game. Only available at the start of each game.\n`' +
                options.prefix + 'leave` - Leave the game you are playing in that channel.\n')
            msg.channel.send(embed)
        }
        return false
    }
}
