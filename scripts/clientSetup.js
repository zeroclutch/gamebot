import Discord from '../discord_mod.js'
import fs from 'fs'
import path from 'path'

export default async client => {
    // configuration
    client.commands = new Discord.Collection()
    const commandFiles = fs.readdirSync('./commands')

    // add commands to list
    for (const commandFolder of commandFiles) {
        //search through each folder
        if (!commandFolder.includes('.DS_Store')) {
            const folder = fs.readdirSync(`./commands/${commandFolder}`)
            for (const file of folder) {
                if (file == '.DS_Store') continue
                const { default: command } = await import(`../commands/${commandFolder}/${file}`).catch(console.error)
                client.commands.set(command.name, command)
            }
        }
    }


    client.games = new Discord.Collection()
    const folder = fs.readdirSync('./games')

    // add game classes to collection
    for (let game of folder) {
        // ignore Game class
        if (game == 'Game.js' || game == '.DS_Store') continue
        const { default: metadata } = await import(path.join('..', 'games', game, 'metadata.js'))
        const { default: runFile } = await import(path.join('..', 'games', game, 'main.js'))
        client.games.set(metadata, runFile)
    }

    // Add moderators
    const moderators = process.env.MODERATORS
    client.moderators = moderators ? moderators.split(',') : []

    // provide help
    client.help = (msg, command) => {
        const prefix = options.prefix
        // find command in question
        const helpCmd = client.commands.find(cmd => cmd.name === command.args.join(" ")) || client.commands.find(cmd => cmd.aliases.includes(command.args.join(" ")))
        // find help for a specific command
        if (helpCmd && (helpCmd.category !== 'dev' || msg.author.id == process.env.OWNER_ID) && (helpCmd.category !== 'mod' || client.moderators.includes(msg.author.id))) {
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
            for (var item of client.commands) {
                var key = item[0],
                    value = item[1]
                if (!categories.includes(value.category) && (value.category != 'dev' || msg.author.id == process.env.OWNER_ID) && (value.category !== 'mod' || client.moderators.includes(msg.author.id))) {
                    categories.push(value.category)
                }
            }

            var embed = new Discord.RichEmbed()
            embed.setTitle('Help - List of Commands for Gamebot')
            embed.setThumbnail(client.user.avatarURL)
            embed.setColor(options.colors.economy)
            categories.forEach(category => {
                var commandList = ''
                client.commands.forEach(cmd => {
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