import BotCommand from '../../types/command/BotCommand.js'
import logger from 'gamebot/logger'
import options from '../../config/options.js'
import Discord from 'discord.js-light'

export default new BotCommand({
    name: 'ping',
    usage: 'ping',
    aliases: ['latency', 'test'],
    description: 'Pings the server.',
    category: 'info',
    permissions: [],
    dmCommand: true,
    args: [],
    run: function(msg, args) {
        // Create a new message with the content 'Pinging...' and save the message object to a variable
        msg.reply('Pinging...').then((m) => {
            // Calculate the latency
            const latency = Date.now() - msg.createdTimestamp
            const apiLatency = Math.round(msg.client.ws.ping) // Round to the nearest integer
            // Edit the message with the content 'Pong!' and the latency
            const content = `Pong!\nServer latency \`${latency}ms\`.\nAPI Latency \`${apiLatency}ms\`.`
            if(msg instanceof Discord.Message)
                m.edit(content)
            else if(msg instanceof Discord.CommandInteraction)
                msg.editReply(content) 
        }).catch(err => {
            logger.error(err)
            msg.channel.send({
                embeds: [{
                    description: 'An error occurred.',
                    color: options.colors.error,
                }]
            })
        })

        
    }
})