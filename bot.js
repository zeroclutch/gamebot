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

import DatabaseClient from './util/DatabaseClient.js'
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
import WebUIClient from './util/WebUIClient.js'
client.webUIClient = new WebUIClient(client)

import Logger from './util/Logger.js'
client.logger = new Logger()

client.setMaxListeners(40)

// configure Discord logging
const oldConsole = {
  error: console.error,
  log: console.log
}

console.log = (message) => {
  client.emit('consoleLog', message)
  oldConsole.log(message)
}

console.error = (message) => {
  client.emit('consoleError', message)
  oldConsole.error(message)
}


// configure DBL 
var dbl
if(process.env.DBL_TOKEN)
  dbl = new DBL(process.env.DBL_TOKEN)
client.dbl = dbl

// initialization
client.login(process.env.DISCORD_BOT_TOKEN)

import clientSetup from './scripts/clientSetup.js'

client.on('ready', async () => {
  // Logged in!
  console.log(`Logged in as ${client.user.tag} on shard ${client.shard.id}!`)

  await clientSetup(client)

  // Refresh user activity
  client.user.setActivity(options.activity.game, { type: options.activity.type })
  .catch(console.error);

  // Update bot system status
  client.updateStatus()

  // Check if we are testing
  if(process.execArgv.includes('--title=test') && client.channels.has(process.env.TEST_CHANNEL)) {
    require('./test/index.test.js')(client)
  }

  // Post DBL stats every 30 minutes
  setInterval(() => {
    if(dbl)
      dbl.postStats(client.guilds.size, client.shard.id, client.shard.count);
  }, 1800000);
});

// handle commands
client.on('message', async function(msg) {
  var prefix = options.prefix
  if (msg.content.startsWith(`<@!${client.user.id}>`)) msg.content = msg.content.replace(`<@!${client.user.id}> `, prefix).replace(`<@!${client.user.id}>`, prefix)
  if (msg.content.startsWith(`<@${client.user.id}>`)) msg.content = msg.content.replace(`<@${client.user.id}> `, prefix).replace(`<@${client.user.id}>`, prefix)
  if (!msg.content.startsWith(prefix) || msg.author.bot) return

  let message = msg.content.substring(prefix.length, msg.content.length).split(' ')
  
  let command = { 
    name: message[0],
    args: message.splice(1)
  }

  console.log(client.commands.size)

  const cmd = client.commands.find(cmd => cmd.name === command.name) || client.commands.find(cmd => cmd.aliases ? cmd.aliases.includes(command.name) : false)

  // if the message is just a tag, reveal prefix
  if((!command.name || command.name.length == 0) && command.args.length == 0) {
    msg.channel.sendMsgEmbed(`The prefix for this bot is \`${options.prefix}\`. You can also use ${client.user} as a prefix.`)
    return
  }

  // check database if user is stored
  if(cmd && cmd.category && (cmd.category == 'economy' /*|| cmd.category == 'dev'*/)) {
    await msg.author.createDBInfo().catch(err => {
      console.error(err)
    })
  }

  // provide help
  if(command.name === 'help') {
    client.help(msg, command);
  }
  
  client.logger.log('Command used', {
    name: command.name,
  })
  
  if(cmd) {
    // test for permissions
    if(cmd.permissions && cmd.permissions.length > 0){
      // Fetch member
      let member = await msg.guild.fetchMember(msg.author)
      if(
        ((msg.author.id !== process.env.OWNER_ID && cmd.permissions.includes('GOD')) ||
        (!client.moderators.includes(msg.author.id) && cmd.permissions.includes('MOD')))
        ||
        (msg.channel.type == 'text' && !cmd.permissions.filter(permission => permission !== 'GOD' && permission !== 'MOD').every(permission => msg.channel.permissionsFor(member || msg.author).has(permission)))
        ) {
          msg.channel.sendMsgEmbed(`Sorry, you don't have the necessary permissions for this command.\n\nRequired permissions: \`${cmd.permissions.join(', ')}\``)
        return
      }
    }

    // start typing if message requires load time
    if(cmd.loader) {
      await msg.channel.startTypingAsync(msg.channel)
    }
    //try running command
    if(msg.channel.type == 'dm' && !cmd.dmCommand) {
      msg.channel.send('This command is not available in a DM channel. Please try this again in a server.')
    } else if(cmd.args && command.args.join('') === '') {
        msg.channel.sendMsgEmbed(`Incorrect usage of this command. Usage: \`${options.prefix}${cmd.usage}\`.`)
    } else {
      await new Promise((resolve, reject) => {
        try {
          cmd.run(msg, command.args)
        } catch (err) {
          reject(err)
        } 
        resolve(cmd)
      })
      .catch((err) => {
        console.error(err)
        if(err.message == 'The game was force stopped.') return
        msg.channel.sendMsgEmbed('There was an error performing this command.')
      })
    }
    return
  }
})

client.on('error', err => {
  console.error('Client on shard ' + client.shard.id + ' encountered an error:', err)
})

client.on('shardError', err => {
  console.error('A websocket connection encountered an error:', err)
})

process.on('unhandledRejection', err => {
  console.error(err.stack, 'error')
})

client.on('guildCreate', guild => {
  client.logger.log('Joined Guild', {
    size: guild.memberCount
  })
})

client.on('guildDelete', guild => {
  client.logger.log('Left Guild', {
    size: guild.memberCount,
    duration: Date.now() - guild.joinedTimestamp
  })
})

client.on('consoleLog', async message => {
  if(!client.readyAt) return
  const loggingChannel = client.channels.get(options.loggingChannel)
  if(loggingChannel) loggingChannel.sendMsgEmbed(JSON.stringify(message))
})

client.on('consoleError', async message => {
  if(!client.readyAt) return
  const loggingChannel = client.channels.get(options.loggingChannel)
  if(loggingChannel) loggingChannel.sendMsgEmbed(JSON.stringify(message), 'Error', 13632027)
})
