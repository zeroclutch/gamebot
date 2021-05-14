import options from './../../config/options.js'

import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
    name: 'downtime',
    usage: 'downtime <time (minutes)>',
    aliases: [],
    description: 'Notify users when downtimes will occur.',
    category: 'dev',
    permissions: ['GOD'],
    dmCommand: true,
    args: false,
    run: function(msg, args) {
        const collection = msg.client.database.collection('status')
        const length =  Math.round(parseFloat(args[0]) * 60000)
        const startTime = Date.now() + length
        if(!args[0]) {
            msg.client.getTimeToDowntime().then(timeToDowntime => {
                let downtime = Math.ceil(timeToDowntime / 60000)
                msg.channel.sendMsgEmbed(`Downtime currently set for ${downtime} minute(s). Would you like to disable the current downtime message? Enter \`yes\` or \`no\`.`)
                msg.channel.awaitMessages(m => (m.content.toLowerCase() == 'yes' || m.content.toLowerCase() == 'no') && m.author.id == msg.author.id, {max: 1, time: 30000 }).then(collected => {
                    const message = collected.first().content.toLowerCase()
                    if(message == 'yes') {
                        collection.findOneAndUpdate(
                            { type: 'downtime' },
                            { $set: { downtimeStart: -1 } }
                        )
                        msg.channel.sendMsgEmbed('Downtime cancelled.')
                    } else {
                        msg.channel.sendMsgEmbed('Downtime not cancelled.')
                    }
                })
            })
        } else if(!isNaN(length)) {
            collection.findOneAndUpdate(
                { type: 'downtime' },
                { $set: { downtimeStart: startTime } }
            )
            msg.client.setTimeout(() => {
                msg.client.emit('downtimeStart')
            }, length);
            msg.channel.sendMsgEmbed(`Downtime enabled for ${args[0]} minute(s).`)

            // Update players currently in game about the oncoming downtime.
            msg.client.shard.broadcastEval("this.channels.filter(c => c.game).forEach(c => c.sendMsgEmbed(`Gamebot is going to be temporarily offline for maintenance in " + args[0] + " minute" + (args[0] == 1 ? "" : "s") + ". Any active games will be automatically ended. For more information, [see our support server.](" + options.serverInvite + ")`, `Warning!`, " + options.colors.warning + "))")

        } else {
            msg.channel.sendMsgEmbed(`Invalid time, set time as a floating point value in minutes.`, 'Error!', options.colors.error)
        }
    }
  })