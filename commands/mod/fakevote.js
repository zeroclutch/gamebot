import axios from 'axios'
import BotCommand from '../../types/command/BotCommand.js'

import { ApplicationCommandOptionType } from 'discord.js'

export default new BotCommand({
    name: 'fakevote',
        aliases: [],
    description: 'Fakes a top.gg vote for a user if they have trouble claiming',
    category: 'mod',
    permissions: ['MOD'],
    dmCommand: true,
    args: [{
      name: 'user',
      description: 'The user to fake vote for',
      required: true,
      type: ApplicationCommandOptionType.User,
  }],
    run: function(msg, args) {
        const collection = msg.client.database.collection('users')
        const userID = args[0].replace(/\D/g, '')
        axios({
          method: 'POST',
          url: process.env.BASE_URL + '/voted',
          data: {
            user: userID
          }, 
          headers: {
            authorization: process.env.DBL_WEBHOOK_AUTH,
            'content-type': 'application/json'
          }
        })
          .then(e => msg.channel.sendEmbed(`<@${userID}> has voted, and can claim.`))
          .catch(e =>{
            msg.channel.sendEmbed(`There was an error with fake voting.`)
            logger.info(e)
          })
    }
})