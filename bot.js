import Discord from "./discord_mod.js"
const client = new Discord.Client({
  messageCacheLifetime: 120,
  messageSweepInterval: 10,
  messageCacheMaxSize: 50,
  disabledEvents: ['TYPING_START','MESSAGE_UPDATE', 'PRESENCE_UPDATE', 'GUILD_MEMBER_ADD', 'GUILD_MEMBER_REMOVE']
})

import options from './config/options.js'

// Discord Bot List dependencies
import DBL from 'dblapi.js';

import DatabaseClient from './types/DatabaseClient.js'
const dbClient = new DatabaseClient('shard ' + client.shard.id)
dbClient.initialize()
.then(() => {
  Object.defineProperty(client, 'dbClient', {
    value: dbClient,
    writable: false,
    enumerable: true
  })

  Object.defineProperty(client, 'database', {
    value: dbClient.database,
    writable: false,
    enumerable: true
  })
  
  // configure downtime notifications
  client.getTimeToDowntime = () => {
    return new Promise((resolve, reject) => {
      client.database.collection('status').findOne( { type: 'downtime' }).then((data, err) => {
        if(err || !data) {
          reject(console.error(err))
          return
        }
        resolve(data.downtimeStart - Date.now())
      })
    })
  }
})

// configure WebUIClient
import WebUIClient from './types/WebUIClient.js'
client.webUIClient = new WebUIClient(client)

import Logger from './types/Logger.js'
client.logger = new Logger()

client.setMaxListeners(40)

// configure Discord logging
const oldConsole = {
  error: console.error,
  log: console.log
}

console.log = (message) => {
  oldConsole.log(message)
  if(!client.readyAt) return
  const loggingChannel = client.channels.get(options.loggingChannel)
  if(loggingChannel) loggingChannel.sendMsgEmbed(JSON.stringify(message))
}

console.error = (message) => {
  oldConsole.error(message)
  if(!client.readyAt) return
  const loggingChannel = client.channels.get(options.loggingChannel)
  if(loggingChannel) loggingChannel.sendMsgEmbed(JSON.stringify(message), 'Error', options.colors.error)
}


// configure DBL 
var dbl
if(process.env.DBL_TOKEN)
  dbl = new DBL(process.env.DBL_TOKEN)
client.dbl = dbl

// initialization
client.login(process.env.DISCORD_BOT_TOKEN)

import setup from './properties/setup.js'

client.on('ready', async () => {
  // Logged in!
  console.log(`Logged in as ${client.user.tag} on shard ${client.shard.id}!`)

  // Setup bot
  await setup.events(client)
  await setup.commands(client)
  await setup.moderators(client)
  await setup.games(client)

  // Refresh user activity
  client.user.setActivity(options.activity.game, { type: options.activity.type })
  .catch(console.error);

  // Update bot system status
  client.updateStatus()

  // Check if we are testing
  if(process.execArgv.includes('--title=test') && client.channels.has(process.env.TEST_CHANNEL)) {
    const {default: test} = await import('./test/index.test.js')
    test(client)
  }

  // Post DBL stats every 30 minutes
  setInterval(() => {
    if(dbl)
      dbl.postStats(client.guilds.size, client.shard.id, client.shard.count);
  }, 1800000);
});
