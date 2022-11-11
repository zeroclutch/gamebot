import BotCommand from '../../types/command/BotCommand.js'

import { ApplicationCommandOptionType } from 'discord.js'

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
        type: ApplicationCommandOptionType.User,
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