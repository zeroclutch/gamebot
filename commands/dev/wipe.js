module.exports = {
    name: 'wipe',
    usage: 'wipe <@user>',
    aliases: [],
    description: 'Wipes a user\'s stored information.',
    category: 'dev',
    permissions: ['GOD'],
    dmCommand: true,
    args: true,
    run: function(msg, args) {
        const collection = msg.client.database.collection('users')
        const userID = args[0].replace(/\D/g, '')
        collection.findOneAndDelete({ userID })
        .then(() => msg.channel.sendMsgEmbed(`<@${userID}> was wiped from the database.`))
        .catch(err => {
            console.error(err)
            msg.channel.sendMsgEmbed(`<@${userID}> could not be wiped from the database.`, 'Error!')
        })
    }
  }