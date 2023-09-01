export default {
  prefix: process.env.DISCORD_BOT_PREFIX,
  token: process.env.DISCORD_BOT_TOKEN,
  ownerID: process.env.OWNER_ID,
  activity: {
    game: process.env.DISCORD_BOT_PREFIX + 'help | gamebot.rocks',
    type: 'PLAYING',
    url: 'https://gamebot.rocks'
  },
  loggingChannel: process.env.LOGGING_CHANNEL,
  statusChannel: '618344167759675413',
  status: {
    updateInterval: 1000 * 60 * 30, // 30 minutes
  },
  serverInvite: 'https://gamebot.rocks/discord',
  links: {
    shop: `https://gamebot.rocks/shop`,
  },
  creditIcon: '<:credit:810656538775650344>',
  goldIcon: '<a:gold:810683680556187668>',
  colors: {
    info: 3789311,
    error: 13632027,
    economy: 5042574,
    warning: 16301340
  }
}