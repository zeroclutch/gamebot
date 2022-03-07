import Discord from './discord_mod.js'
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
    console.log('Loading tests...')
    const {default: test} = await import('./test/index.test.js')
    test(client)
  }
}


process.on('message', async message => {
  if(message.testMode) {
    // Check if we are testing
    console.log('Activated testing mode...')
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
import Logger from './types/log/Logger.js'
client.logger = new Logger()

// configure logging
import { config, stdout } from './scripts/console.js'
config(client)

client.setMaxListeners(40)

// initialization
client.login(process.env.DISCORD_BOT_TOKEN)

import setup from './scripts/setup.js'

client.on('ready', async () => {
  // Logged in!
  console.log(`Logged in as ${client.user.tag} on shard ${client.shard.ids[0]}!`)

  // Setup bot
  await setup.database(client)
  await setup.games(client)
  await setup.commands(client)
  await setup.events(client)
  await setup.moderators(client)

  // Refresh user activity
  client.user.setActivity(options.activity.game, { type: options.activity.type })

  // Update bot system status
  client.updateStatus()

  runTests()
});
