import BotCommand from '../../types/command/BotCommand.js'

import Discord from 'discord.js-light'
const { Constants } = Discord

export default new BotCommand({
    name: 'storedinfo',
        aliases: [],
    description: 'Returns a user\'s stored data.',
    category: 'mod',
    permissions: ['MOD'],
    dmCommand: true,
    args: [{
        name: 'user',
        description: 'The user to get stored data for',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.USER,
    }],
    run: function(msg, args) {
        const collection = msg.client.database.collection('users')
        const userID = args[0].replace(/\D/g, '')
        msg.client.users.fetch(userID, false).then(info => {
            collection.findOne({ userID })
          .then(data => msg.channel.sendEmbed('```json\n' + JSON.stringify(data) + '```'))
          .catch(e => msg.channel.sendEmbed(`There was an error with retrieving the data.`))
        })
    }
})