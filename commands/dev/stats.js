module.exports = {
  name: 'stats',
  usage: 'stats',
  aliases: [],
  description: 'Provides stats',
  category: 'dev',
  permissions: ['GOD'],
  dmCommand: true,
  args: false,
  run: function(msg, args) {
    msg.client.shard.broadcastEval('this.channels.filter(c => c.game).size').then(games => {
      msg.channel.sendMsgEmbed(`Active Games: ${games.reduce((acc, val) => acc + val)}`)
    })

  }
}