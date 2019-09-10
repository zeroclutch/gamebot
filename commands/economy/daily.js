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
        // check if 24 hours have passed since last voting
        // if no, check if daily has already been claimed
        // 
        msg.channel.sendMsgEmbed('This command will be available once this bot is approved on [DiscordBots](https://discordbots.org).')
    }
  }