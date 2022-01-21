import axios from 'axios'
import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
    name: 'fakevote',
    usage: 'fakevote <@user>',
    aliases: [],
    description: 'Fakes a top.gg vote for a user if they have trouble claiming',
    category: 'mod',
    permissions: ['MOD'],
    dmCommand: true,
    args: true,
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
            console.log(e)
          })
    }
})