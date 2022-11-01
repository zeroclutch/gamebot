import BotCommand from '../../types/command/BotCommand.js'
import logger from 'gamebot/logger'
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
        // Create a ping command that sends a message, then edits it to show the latency.
        // The latency is calculated by subtracting the message creation timestamp from the current time.
        // The latency is then converted to milliseconds by using the Math.max() function.

        const time = Date.now()
        const response = time - msg.createdTimestamp
        const resMessage = `Pong!\nServer latency: \`${Math.max(response, 1)}ms\``
        msg.reply(resMessage).then(m => m.edit(resMessage + `\nAPI latency: \`${Date.now() - m.createdTimestamp}ms\``)).catch(logger.error)
        
    }
})