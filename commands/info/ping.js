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
        msg.channel.send('Pong!').then(m => m.edit(`Pong! \`${m.createdTimestamp - msg.createdTimestamp} ms\``))
    }
  }