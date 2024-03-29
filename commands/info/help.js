import Discord from '../../discord_mod.js'
import options from '../../config/options.js'

import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
    name: 'help',
    aliases: ['commands'],
    description: 'Provides help for users',
    category: 'info',
    permissions: [],
    dmCommand: true,
    args: [{
        name: 'command',
        type: Discord.ApplicationCommandOptionType.String,
        description: 'The name of the command you need help with',
        required: false,
    }],
    run: function(msg, args) {
        // find command in question
        const helpCmd = msg.client.commands.find(cmd => cmd.name === args.join(" ")) || msg.client.commands.find(cmd => cmd.aliases.includes(args.join(" ")))
        // find help for a specific command
        if (helpCmd && (helpCmd.category !== 'dev' || msg.author.id == process.env.OWNER_ID) && (helpCmd.category !== 'mod' || msg.client.moderators.includes(msg.author.id))) {
            msg.reply({
                embeds: [{
                    title: `Help: ${helpCmd.name}`,
                    fields: [
                        {
                            name: 'Description',
                            value: helpCmd.description
                        },
                        {
                            name: 'Usage',
                            value: `\`${msg.channel.prefix}${helpCmd.usage}\``,
                            inline: true
                        },
                        {
                            name: 'Aliases',
                            value: helpCmd.aliases.length > 0 ? helpCmd.aliases.join(', ') : 'None',
                            inline: true
                        },
                        {
                            name: 'Permissions',
                            value: helpCmd.permissions.length > 0 ? helpCmd.permissions.join(", ") : 'None',
                            inline: true
                        },
                        {
                            name: 'Options',
                            value: `${
                                (helpCmd.args.map(
                                    arg => `\`${arg.name}\`${arg.required ? '\\*' : ''} - ${arg.description}`
                                ).join('\n') || 'None')
                            }\n\n_\\* = required_`,
                            inline: true
                        }
                    ],
                    color: options.colors.info,
                    footer: { text: `Type ${msg.channel.prefix}help for a list of commands.` }
                }]
            })
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

            let embed = new Discord.EmbedBuilder()
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
                embed.addFields([{
                    name: 'Category: ' + category.toUpperCase(), 
                    value: commandList
                }])
            })
            embed.addFields([{
                name: 'Category: IN-GAME',
                value: '`' + msg.channel.prefix + 'kick <@user>` - Kick a user from the game (game leader only).\n`' +
                msg.channel.prefix + 'add <@user>` - Add a user to the game (game leader only).\n`' +
                msg.channel.prefix + 'join` - Join the game. Only available at the start of each game.\n`' +
                msg.channel.prefix + 'leave` - Leave the game you are playing in that channel.\n'
            }])
            msg.reply({ embeds: [embed] })
        }
        return false
    }
})