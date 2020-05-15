module.exports = {
  prefix: process.env.DISCORD_BOT_PREFIX,
  token: process.env.DISCORD_BOT_TOKEN,
  ownerID: process.env.OWNER_ID,
  activity: {
    game: 'Type ' + process.env.DISCORD_BOT_PREFIX + 'help',
    type: 'PLAYING'
  },
  loggingChannel: process.env.LOGGING_CHANNEL,
  serverInvite: 'https://discord.gg/7pNEJQC',
  creditIcon: '<:credit:619756127101386762>',
  colors: {
    info: 4513714,
    error: 13632027,
    economy: 3510190,
    warning: 16301340
  }
}