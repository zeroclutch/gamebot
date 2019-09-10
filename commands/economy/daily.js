const options = require('./../../config/options')
module.exports = {
    name: 'daily',
    usage: 'daily',
    aliases: ['claim', 'vote'],
    description: ['Claim today\'s credits for voting on the bot.'],
    category: 'economy',
    permissions: [],
    dmCommand: true,
    args: false,
    run: function(msg, args) {
        const collection = msg.client.database.collection('users')
        // check if daily hasn't been claimed and check if lastVoted was in last 24 hours
        // if true, credit rewards, and set dailyClaimed to true / display vote streak
        // if false, tell them to vote on discordbots.org and vote, then type daily. Have brief explanation of vote streak.
        msg.channel.sendMsgEmbed('This command will be available once this bot is approved on [DiscordBots](https://discordbots.org).')
    }
  }