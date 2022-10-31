import options from '../../config/options.js'
import logger from 'gamebot/logger'

import BotCommand from '../../types/command/BotCommand.js'


let isInitialized = false
let guilds, gameCount, users, usersInDB, message, statusUpdate, onlineShards, totalShards

export default new BotCommand({
  name: 'status',
  usage: 'status',
  aliases: ['stats'],
  description: 'Provides the current status of Gamebot',
  category: 'info',
  permissions: [],
  dmCommand: true,
  args: [],
  run: async function(msg, args) {
    const getStatusFields = async () => {
      guilds = (await msg.client.shard.fetchClientValues('guilds.cache.size')).reduce((acc, val) => acc + val, 0)
      users = (await msg.client.shard.fetchClientValues('users.cache.size')).reduce((acc, val) => acc + val, 0)
      usersInDB = await msg.client.database.collection('users').stats()

      // try fetching message
      await msg.client.shard.broadcastEval(client => client.updateStatus()).catch(logger.error)

      message = (await msg.client.shard.broadcastEval(client => client.latestStatus)).filter(m => m && m.content && m.date)[0]
      statusUpdate = message ? `\`${message.date}\`: ${message.content}\n\n*See more updates in the [support server](${options.serverInvite}?ref=statusCommand).*` : 'No status update available.'
      
      let games = await msg.client.shard.broadcastEval(client => client.gameManager.games.size)
      gameCount = games.reduce((acc, val) => acc + val)
      onlineShards = games.length
      totalShards = msg.client.shard.count
    }

    // On the first call, fetch fresh values for status fields. Then, cache and update asynchronously.
    if(!isInitialized) {
      await msg.channel.send({
        embeds: [{
          description: 'Loading status. This may take a few moments.',
          color: options.colors.info
        }]
      }).catch(logger.error)
      await getStatusFields().catch(logger.error)
      setInterval(() => {
        getStatusFields().catch(logger.error)
      }, 60000)
      isInitialized = true
    }

    msg.channel.send({
      embeds: [{
        title: 'Gamebot Status', 
        fields: [
          {name: 'Latest Status Update', value: statusUpdate},
          {name: 'Shards Online', value: `\`${onlineShards}/${totalShards}\` ${onlineShards == totalShards ? ':green_circle: All systems operational!' : `:red_circle: An outage has occurred, please visit the [support server](${options.serverInvite}) for more information.`}`},
          {name: 'Current Shard', value: `\`Shard ${msg.client.shard.ids[0]}\``, inline: true},
          {name: 'Active Games', value: `\`${gameCount}\` :video_game:`, inline: true},
          {name: 'Guild Count', value: `\`${guilds}\` :crossed_swords:`, inline: true},
          {name: 'Users in database', value: `\`${usersInDB.count}\` :floppy_disk:`, inline: true}
        ],
        color: options.colors.info,
        thumbnail: { url: msg.client.user.avatarURL({dynamic: true}) }
      }]
    })
    .catch(logger.error)
  }
})