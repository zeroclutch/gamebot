import BotCommand from '../../types/command/BotCommand.js'

import Discord from 'discord.js-light'
const { Constants } = Discord

export default new BotCommand({
    name: 'setstreak',
    usage: 'setstreak <@user> <streak>',
    aliases: [],
    description: 'Sets a vote streak for a user',
    category: 'mod',
    permissions: ['MOD'],
    dmCommand: true,
    args: [
      {
        name: 'user',
        description: 'The user to modify the streak for',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.USER,
      },
      {
        name: 'streak',
        description: 'The new streak to set',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.INTEGER,
      },
    ],
    run: function(msg, args) {
        const collection = msg.client.database.collection('users')
        const userID = args[0].replace(/\D/g, '')
        const voteStreak = parseInt(args[1])
        if(isNaN(voteStreak)) {
          msg.channel.send(`There was an error with fake voting.`)
          return
        }
        msg.client.users.fetch(userID, false).then(info => {
            collection.findOneAndUpdate(
            {
              userID
            },
            {
              $set: {
                voteStreak
              }
            })
          })
          .then(e => msg.channel.sendEmbed(`<@${userID}> now has a streak of ${voteStreak}.`))
          .catch(e => msg.channel.sendEmbed(`There was an error with setting the user's streak.`))
    }
})