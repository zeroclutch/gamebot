import BotCommand from '../../types/command/BotCommand.js'
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'
import { ApplicationCommandOptionType } from 'discord.js'
import logger from 'gamebot/logger'

export default new BotCommand({
  name: 'forcestop',
  aliases: ['forceend'],
  description: 'Description',
  category: 'mod',
  permissions: [GAMEBOT_PERMISSIONS.MOD],
  dmCommand: false,
  args: [{
    key: 'channel',
    description: 'The channel ID to force stop the game in. If not provided, the game in the current channel will be stopped.',
    required: false,
    type: ApplicationCommandOptionType.Channel
  }],
  run: async function(msg, args) {
    const id = args[0]
    if(msg.channel.game) {
      msg.channel.game.end()
    } else if(id) {
      try {
        let isEnded = await msg.client.shard.broadcastEval((c, context) => c.gameManager.games.has(context.id) ? (c.gameManager.games.get(context.id).end() || true) : null,  { context: { id } })
        if(isEnded) {
          msg.channel.send(`Game ended successfully in channel <#${id}>.`)
        }
      } catch(e) {
        logger.error(e)
        msg.channel.send(`Failed to end game in channel <#${id}>.`)
      }
    } else {
      msg.channel.send('There is no game running in this channel.')
    }
  }
})