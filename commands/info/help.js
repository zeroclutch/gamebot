import Discord from '../../discord_mod.js'
import options from '../../config/options.js'

import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
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
            let categories = []
            for (let item of msg.client.commands) {
                let key = item[0],
                    value = item[1]
                if (!categories.includes(value.category) && (value.category != 'dev' || msg.author.id == process.env.OWNER_ID) && (value.category !== 'mod' || msg.client.moderators.includes(msg.author.id))) {
                    categories.push(value.category)
                }
            }

            let embed = new Discord.MessageEmbed()
            embed.setTitle('Help - List of Commands for Gamebot')
            embed.setThumbnail(msg.client.user.avatarURL({dynamic: true}))
            embed.setColor(options.colors.economy)
            categories.forEach(category => {
                let commandList = ''
                msg.client.commands.forEach(cmd => {
                    if (cmd.category == category) {
                        commandList += `\`${msg.channel.prefix}${cmd.usage}\` - ${cmd.description}\n`
                    }
                })
                embed.addField('Category: ' + category.toUpperCase(), commandList)
            })
            embed.addField('Category: IN-GAME',
                '`' + msg.channel.prefix + 'kick <@user>` - Kick a user from the game (game leader only).\n`' +
                msg.channel.prefix + 'add <@user>` - Add a user to the game (game leader only).\n`' +
                msg.channel.prefix + 'join` - Join the game. Only available at the start of each game.\n`' +
                msg.channel.prefix + 'leave` - Leave the game you are playing in that channel.\n')
            msg.channel.send(embed)
        }
        return false
    }
})