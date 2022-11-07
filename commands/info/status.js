import options from '../../config/options.js'
import logger from 'gamebot/logger'

import BotCommand from '../../types/command/BotCommand.js'
import Discord from '../../discord_mod.js'

import assert from 'assert'

let isInitialized = false

// Globally scope the status fields
let guilds = 0,
    gameCount = 0,
    users = 0,
    usersInDB = { count: 0 },
    message = {},
    statusUpdate = 'None',
    onlineShards = 0,
    totalShards = 0,
    timers = []

export default new BotCommand({
  name: 'status',
    aliases: ['stats'],
  description: 'Provides the current status of Gamebot',
  category: 'info',
  permissions: [],
  dmCommand: true,
  args: [],
  run: async function(msg, args) {

    // Define a function to update the status
    const getStatusFields = async () => {
      const shard = msg.client.shard

      // Count values
      guilds = (await shard.fetchClientValues('guilds.cache.size')).reduce((acc, val) => acc + val, 0)
      users = (await shard.fetchClientValues('users.cache.size')).reduce((acc, val) => acc + val, 0)
      usersInDB = await msg.client.database.collection('users').stats() || { count: 0 }

      // try fetching message
      await shard.broadcastEval(client => client.updateStatus()).catch(logger.error.bind(logger))

      // Get the status message
      message = (await shard.broadcastEval(client => client.latestStatus)).filter(m => m && m.content && m.date)[0]
      statusUpdate = message ? `\`${message.date}\`: ${message.content}\n\n*See more updates in the [support server](${options.serverInvite}?ref=statusCommand).*` : 'No status update available.'
      
      // Get the number of active games and shards
      let games = await shard.broadcastEval(client => client.gameManager.games.size)
      gameCount = games.reduce((acc, val) => acc + val)
      onlineShards = (await shard.broadcastEval(client => client.ws.status)).filter(s => s === Discord.Constants.Status.READY).length
      totalShards = shard.count
    }

    // On the first call, fetch fresh values for status fields. Then, cache and update asynchronously.
    if(timers.length === 0) {
      if(msg instanceof Discord.CommandInteraction) {
        await msg.deferReply()
      } else if(msg instanceof Discord.Message) {
        await msg.channel.send({
          embeds: [{
            description: 'Loading status. This may take a few moments.',
            color: options.colors.info
          }]
        }).catch(logger.error.bind(logger))
      }

      // Fetch fresh values
      try {
        await getStatusFields()

        assert.strictEqual(onlineShards === totalShards, true, 'Not all shards are online.')

        // Update status fields every 5 minutes
        timers.push(setInterval(function () {
          if(timers.length > 1) {
            logger.warn(`${timers.length} timers are running. This can occur when the status command is called multiple times on launch. Clearing...`)
            timers.shift()
            clearInterval(timers[0])
          }
          getStatusFields().catch(logger.error.bind(logger))
        }, 5000))

      } catch (err) {
        logger.error(err)
        await msg.channel.send(
          {
            embeds: [{
              description: 'An error occurred while fetching status. Please try again later.',
              color: options.colors.error
            }]
          }
        ).catch(logger.error.bind(logger))
        return
      }
    }

    // Create the embed
    const payload = {
      content: `<@${msg.author.id}>`,
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
        thumbnail: { url: msg.client.user.avatarURL({ dynamic: true }) }
      }]
    }

    // Send status
    if(msg instanceof Discord.CommandInteraction) {
      // Follow up if deferred
      if(msg.deferred) msg.followUp(payload).catch(logger.error.bind(logger))
      else msg.reply(payload).catch(logger.error.bind(logger))
    } else if (msg instanceof Discord.Message) {
      // For messages, send as usual
      msg.channel.send(payload).catch(logger.error.bind(logger))
    }
   
  }
})