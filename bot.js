import Discord from 'gamebot/discord'
import logger, { ready } from 'gamebot/logger'

import { makeCache, intents } from './config/client.js'

const client = new Discord.Client({
  makeCache,
  intents,

  // Prevent @everyone under all circumstances
  allowedMentions: {
    parse: ['users', 'roles'],
    repliedUser: true
  }
})

import options from './config/options.js'

const runTests = async () => {
  // Run tests
  if(client.isTestingMode && client.readyAt && await client.channels.fetch(process.env.TEST_CHANNEL)) {
    logger.info('Loading tests...')
    const {default: test} = await import('./test/index.test.js')
    test(client)
  }
}


process.on('message', async message => {
  if(message.testMode) {
    // Check if we are testing
    logger.info('Activated testing mode...')
    client.isTestingMode = true
    runTests()
  }
})

// Configure GameManager
import GameManager from './types/games/GameManager.js'
client.gameManager = new GameManager(client)

// configure WebUIClient
import WebUIClient from './types/webui/WebUIClient.js'
client.webUIClient = new WebUIClient(client)

// Configure analytics
import Metrics from './types/log/Metrics.js'
client.metrics = new Metrics()

client.setMaxListeners(40)

// initialization
client.login(process.env.DISCORD_BOT_TOKEN)

import clientSetup  from './scripts/clientSetup.js'
import processSetup from './scripts/processSetup.js'

// Setup process
;(async () => {
  await processSetup.events()
})()

client.once('ready', async () => {
  ready(client)

  // Setup bot
  await clientSetup.database(client)
  await clientSetup.games(client)
  await clientSetup.commands(client)
  await clientSetup.events(client)
  await clientSetup.moderators(client)

  // Refresh user activity
  client.user.setActivity(options.activity.game, { type: options.activity.type })

  // Update bot system status
  client.updateStatus()

  // Logged in!
  logger.info(`Logged in as ${client.user.tag} on shard ${client.shard.ids[0]}!`)

  runTests()
});


export default client