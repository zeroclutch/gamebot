module.exports = {
    name: 'ping',
    usage: 'ping',
    aliases: [],
    description: 'Pings the server.',
    category: 'info',
    permissions: [],
    dmCommand: true,
    args: false,
    run: function(msg, args) {
        const time = Date.now()
        const response = time - msg.createdTimestamp
        const resMessage = `Pong!\nServer latency: \`${response}ms\``
        msg.channel.send(resMessage).then(m => m.edit(resMessage + `\nAPI latency: \`${m.createdTimestamp - time} ms\``))
    }
  }