module.exports = {
  prefix: process.env.PREFIX,
  token: process.env.DISCORD_BOT_TOKEN,
  ownerID: process.env.OWNER_ID,
  activity: {
    game: 'Cards Against Humanity',
    type: 'PLAYING'
  },
  loggingChannel: process.env.LOGGING_CHANNEL,
  serverInvite: 'https://discord.gg/7pNEJQC',
  creditIcon: '<:credit:619756127101386762>'
}