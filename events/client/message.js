import options from '../../config/options.js'

export const eventName = 'message'

export const handler = async (client, msg) => {
    const prefix = msg.guild.prefix || options.prefix
    if (!msg.content.startsWith(prefix) || msg.author.bot) return
    if (msg.content.startsWith(`<@!${client.user.id}>`)) msg.content = msg.content.replace(`<@!${client.user.id}> `, prefix).replace(`<@!${client.user.id}>`, prefix)
    if (msg.content.startsWith(`<@${client.user.id}>`)) msg.content = msg.content.replace(`<@${client.user.id}> `, prefix).replace(`<@${client.user.id}>`, prefix)

    let message = msg.content.substring(prefix.length, msg.content.length).split(' ')

    let command = {
        name: message[0],
        args: message.splice(1)
    }

    const cmd = client.commands.find(cmd => cmd.name === command.name) || client.commands.find(cmd => cmd.aliases ? cmd.aliases.includes(command.name) : false)

    // if the message is just a tag, reveal prefix
    if ((!command.name || command.name.length == 0) && command.args.length == 0) {
        msg.channel.sendMsgEmbed(`The prefix for this bot is \`${options.prefix}\`. You can also use ${client.user} as a prefix.`)
        return
    }

    // check database if user is stored
    if (cmd && cmd.category && (cmd.category == 'economy')) {
        await msg.author.createDBInfo().catch(err => {
            console.error(err)
        })
    }

    client.logger.log('Command used', {
        name: command.name,
    })

    if (cmd) {
        // test for permissions
        if (cmd.permissions && cmd.permissions.length > 0) {
            // Fetch member
            let member = await msg.guild.fetchMember(msg.author)
            if (
                ((msg.author.id !== process.env.OWNER_ID && cmd.permissions.includes('GOD')) ||
                    (!client.moderators.includes(msg.author.id) && cmd.permissions.includes('MOD'))) ||
                (msg.channel.type == 'text' && !cmd.permissions.filter(permission => permission !== 'GOD' && permission !== 'MOD').every(permission => msg.channel.permissionsFor(member || msg.author).has(permission)))
            ) {
                msg.channel.sendMsgEmbed(`Sorry, you don't have the necessary permissions for this command.\n\nRequired permissions: \`${cmd.permissions.join(', ')}\``)
                return
            }
        }

        // start typing if message requires load time
        if (cmd.loader) {
            await msg.channel.startTypingAsync(msg.channel)
        }
        //try running command
        if (msg.channel.type == 'dm' && !cmd.dmCommand) {
            msg.channel.send('This command is not available in a DM channel. Please try this again in a server.')
        } else if (cmd.args && command.args.join('') === '') {
            msg.channel.sendMsgEmbed(`Incorrect usage of this command. Usage: \`${options.prefix}${cmd.usage}\`.`)
        } else {
            await new Promise((resolve, reject) => {
                    try {
                        cmd.run(msg, command.args)
                    } catch (err) {
                        reject(err)
                    }
                    resolve(cmd)
                })
                .catch((err) => {
                    console.error(err)
                    if (err.message == 'The game was force stopped.') return
                    msg.channel.sendMsgEmbed('There was an error performing this command.')
                })
        }
        return
    }
}