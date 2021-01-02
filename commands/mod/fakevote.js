module.exports = {
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
        msg.client.fetchUser(userID, false).then(info => {
            collection.findOneAndUpdate(
            {
              userID
            },
            {
              $set: {
                dailyClaimed: false,
                lastClaim: Date.now()
              }
            })
          })
          .then(e => msg.channel.sendMsgEmbed(`<@${userID}> has voted, and can claim.`))
          .catch(e => msg.channel.sendMsgEmbed(`There was an error with fake voting.`))
    }
}