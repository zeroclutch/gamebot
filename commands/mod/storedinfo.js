module.exports = {
    name: 'storedinfo',
    usage: 'storedinfo <@user>',
    aliases: [],
    description: 'Returns a user\'s stored data.',
    category: 'mod',
    permissions: ['MOD'],
    dmCommand: true,
    args: true,
    run: function(msg, args) {
        const collection = msg.client.database.collection('users')
        const userID = args[0].replace(/\D/g, '')
        msg.client.fetchUser(userID, false).then(info => {
            collection.findOne({ userID })
          .then(data => msg.channel.sendMsgEmbed('```json\n' + JSON.stringify(data) + '```'))
          .catch(e => msg.channel.sendMsgEmbed(`There was an error with retrieving the data.`))
        })
    }
}