import options from './../../config/options.js'
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'

import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
    name: 'downtime',
        aliases: [],
    description: 'Notify users when downtimes will occur.',
    category: 'dev',
    permissions: [GAMEBOT_PERMISSIONS.OWNER],
    dmCommand: true,
    args: [],
    run: function(msg, args) {
        const collection = msg.client.database.collection('status')
        const length =  Math.round(parseFloat(args[0]) * 60000)
        const startTime = Date.now() + length
        if(!args[0] || isNaN(args[0])) {
            msg.client.getTimeToDowntime().then(timeToDowntime => {
                let downtime = Math.ceil(timeToDowntime / 60000)
                msg.channel.sendEmbed(`Downtime currently set for ${downtime} minute(s). Would you like to disable the current downtime message? Enter \`yes\` or \`no\`.`)
                msg.channel.awaitMessages({ max: 1, time: 30000, filter: m => (m.content.toLowerCase() == 'yes' || m.content.toLowerCase() == 'no') && m.author.id == msg.author.id }).then(collected => {
                    const message = collected.first().content.toLowerCase()
                    if(message == 'yes') {
                        collection.findOneAndUpdate(
                            { type: 'downtime' },
                            { $set: { downtimeStart: -1 } }
                        )
                        msg.channel.sendEmbed('Downtime cancelled.')
                    } else {
                        msg.channel.sendEmbed('Downtime not cancelled.')
                    }
                })
            })
        } else if(!isNaN(length)) {
            collection.findOneAndUpdate(
                { type: 'downtime' },
                { $set: { downtimeStart: startTime } }
            )
            setTimeout(() => {
                msg.client.emit('downtimeStart')
            }, length);
            msg.channel.sendEmbed(`Downtime enabled for ${args[0]} minute(s).`)

            // Update players currently in game about the oncoming downtime.
            msg.client.shard.broadcastEval(function(client, context) {
                const [args, options] = context
                client.gameManager.games
                .forEach(game => 
                    game.channel.sendEmbed("Gamebot is going to be temporarily offline for maintenance in " + args[0] + " minute" + (args[0] == 1 ? "" : "s") + ". Any active games will be automatically ended. For more information, [see our support server.](" + options.serverInvite + ")", `Warning!`, options.colors.warning).catch(logger.error)
                )
            }, { context: [ args, options ] })
        } else {
            msg.channel.sendEmbed(`Invalid time, set time as a floating point value in minutes.`, 'Error!', options.colors.error)
        }
    }
  })