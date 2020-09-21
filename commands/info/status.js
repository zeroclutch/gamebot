const options = require('../../config/options')

module.exports = {
  name: 'status',
  usage: 'status',
  aliases: ['stats'],
  description: 'Provides the current status of Gamebot',
  category: 'info',
  permissions: [],
  dmCommand: true,
  args: false,
  run: async function(msg, args) {
    const guilds = (await msg.client.shard.fetchClientValues('guilds.size')).reduce((prev, val) => prev + val, 0)
    const users = (await msg.client.shard.fetchClientValues('users.size')).reduce((prev, val) => prev + val, 0)
    const usersInDB = await msg.client.database.collection('users').stats()

    msg.client.logger.log('Status checked')

    // try fetching message
    await msg.client.shard.broadcastEval(`this.updateStatus()`)

    const message = (await msg.client.shard.broadcastEval(`this.latestStatus`)).filter(m => m && m.content && m.date)[0]
    const statusUpdate = message ? `\`${message.date}\`: ${message.content}\n\n*See more updates in the [support server](${options.serverInvite}).*` : 'No status update available.'
    
    msg.client.shard.broadcastEval('this.channels.filter(c => c.game).size').then(games => {
      const onlineShards = games.length
      const totalShards = msg.client.shard.count

      msg.channel.send({
        embed: {
          title: 'Gamebot Status', 
          fields: [
            {name: 'Latest Status Update', value: statusUpdate},
            {name: 'Shards Online', value: `\`${onlineShards}/${totalShards}\` ${onlineShards == totalShards ? ':green_circle: All systems operational!' : `:red_circle: An outage has occurred, please visit the [support server](${options.serverInvite}) for more information.`}`},
            {name: 'Current Shard', value: `\`Shard ${msg.client.shard.id}\``, inline: true},
            {name: 'Active Games', value: `${games.reduce((acc, val) => acc + val)} :video_game:`, inline: true},
            {name: 'Guild Count', value: `${guilds} :crossed_swords:`, inline: true},
            {name: 'User Count', value: `${users} :busts_in_silhouette:`, inline: true},
            {name: 'Users in database', value: `${usersInDB.count} :floppy_disk:`, inline: true}
          ],
          color: options.colors.info,
          thumbnail: { url: msg.client.user.avatarURL }
        }
      })
    })
    .catch(console.error)
  }
}