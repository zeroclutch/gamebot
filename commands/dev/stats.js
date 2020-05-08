module.exports = {
  name: 'stats',
  usage: 'stats',
  aliases: [],
  description: 'Provides stats',
  category: 'dev',
  permissions: ['GOD'],
  dmCommand: true,
  args: false,
  run: async function(msg, args) {
    let guilds = await msg.client.shard.fetchClientValues('guilds.size')
    let channels = await msg.client.shard.fetchClientValues('channels.size')
    let users = await msg.client.shard.fetchClientValues('users.size')
    let usersInDB = await msg.client.database.collection('users').stats()
    msg.client.shard.broadcastEval('this.channels.filter(c => c.game).size').then(games => {
      msg.channel.sendMsgEmbed(`**Active Games:** ${games.reduce((acc, val) => acc + val)}\n
      **Total Guilds:** ${guilds.reduce((prev, val) => prev + val, 0)}\n
      **Total Channels:** ${channels.reduce((prev, val) => prev + val, 0)}\n
      **Total Users:** ${channels.reduce((prev, val) => prev + val, 0)}\n
      **Users in DB:** ${usersInDB.count}\n
      `)
    })
    .catch(console.error);


  }
}