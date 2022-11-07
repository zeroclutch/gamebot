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
  serverInvite: 'https://gamebot.rocks/discord',
  links: {
    shop: `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.BASE_URL + '/authenticate')}&response_type=token&scope=identify%20guilds`,
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