module.exports = {
  prefix: process.env.PREFIX,
  token: process.env.DISCORD_BOT_TOKEN,
  ownerID: process.env.OWNER_ID,
  activity: {
    game: 'Cards Against Humanity',
    type: 'PLAYING'
  },
  loggingChannel: process.env.LOGGING_CHANNEL
}