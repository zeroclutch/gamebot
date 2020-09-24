module.exports = {
  prefix: process.env.DISCORD_BOT_PREFIX,
  token: process.env.DISCORD_BOT_TOKEN,
  ownerID: process.env.OWNER_ID,
  activity: {
    game: 'Type ' + process.env.DISCORD_BOT_PREFIX + 'help',
    type: 'PLAYING'
  },
  loggingChannel: process.env.LOGGING_CHANNEL,
  statusChannel: '618344167759675413',
  serverInvite: 'https://gamebot.rocks/discord',
  creditIcon: '<:credit:619756127101386762>',
  colors: {
    info: 3789311,
    error: 13632027,
    economy: 5042574,
    warning: 16301340
  }
}