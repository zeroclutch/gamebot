import Discord from "./discord_mod.js"
const client = new Discord.Client({
  messageCacheLifetime: 120,
  messageSweepInterval: 10,
  messageCacheMaxSize: 50,
  disabledEvents: ['TYPING_START','MESSAGE_UPDATE', 'PRESENCE_UPDATE', 'GUILD_MEMBER_ADD', 'GUILD_MEMBER_REMOVE'],
  cacheGuilds: true,
  cacheChannels: false,
  cacheOverwrites: false,
  cacheRoles: false,
  cacheEmojis: false,
  cachePresences: false
})

import options from './config/options.js'

import { parentPort } from 'worker_threads'
parentPort.on('message', async message => {
  if(message.testMode) {
    // Check if we are testing
    if(client.readyAt && await client.channels.fetch(process.env.TEST_CHANNEL)) {
      client.isTestingMode = true
      const {default: test} = await import('./test/index.test.js')
      test(client)
    }
  }
})

// Discord Bot List dependencies
import DBL from 'dblapi.js';

// configure WebUIClient
import WebUIClient from './types/WebUIClient.js'
client.webUIClient = new WebUIClient(client)

// Configure analytics
import Logger from './types/Logger.js'
client.logger = new Logger()

// configure logging
import { config, stdout } from './scripts/console.js'
config(client)

client.setMaxListeners(40)

// configure DBL 
let dbl
if(process.env.DBL_TOKEN)
  dbl = new DBL(process.env.DBL_TOKEN)
client.dbl = dbl

// initialization
client.login(process.env.DISCORD_BOT_TOKEN)

import setup from './scripts/setup.js'

client.on('ready', async () => {
  // Logged in!
  console.log(`Logged in as ${client.user.tag} on shard ${client.shard.ids[0]}!`)

  // Setup bot
  await setup.database(client)
  await setup.events(client)
  await setup.commands(client)
  await setup.moderators(client)
  await setup.games(client)

  // Refresh user activity
  client.user.setActivity(options.activity.game, { type: options.activity.type })
  .catch(console.error);

  // Update bot system status
  client.updateStatus()

  // Post DBL stats every 30 minutes
  setInterval(() => {
    if(dbl)
      dbl.postStats(client.guilds.size, client.shard.ids[0], client.shard.count);
  }, 1800000);
});
