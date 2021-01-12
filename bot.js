require('dotenv').config()
import Discord from "./discord_mod.js"
const client = new Discord.Client({
  messageCacheLifetime: 120,
  messageSweepInterval: 10,
  messageCacheMaxSize: 50,
  disabledEvents: ['TYPING_START','MESSAGE_UPDATE', 'PRESENCE_UPDATE', 'GUILD_MEMBER_ADD', 'GUILD_MEMBER_REMOVE']
})
import fs from 'fs'
import options from './config/options'

// Discord Bot List dependencies
import DBL from 'dblapi.js';

import DatabaseClient from './util/DatabaseClient'
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
import WebUIClient from './util/WebUIClient'
client.webUIClient = new WebUIClient(client)

import Logger from './util/Logger'
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

client.on('ready', () => {
  // Logged in!
  console.log(`Logged in as ${client.user.tag} on shard ${client.shard.id}!`)

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

// configuration
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands');

// add commands to list
for (const commandFolder of commandFiles) {
  //search through each folder
  if(!commandFolder.includes('.DS_Store')) {
    const folder = fs.readdirSync(`./commands/${commandFolder}`)
    for(const file of folder) {
      if(file == '.DS_Store') continue
      const command = require(`./commands/${commandFolder}/${file}`)
      client.commands.set(command.name, command);
    }
  }
}


client.games = new Discord.Collection()
const folder = fs.readdirSync('./games')

// add game classes to collection
for(let game of folder) {
  // ignore Game class
  if(game == 'Game.js' || game == '.DS_Store') continue
  let runFile = require(`./games/${game}/main`)
  let metadata = require(`./games/${game}/metadata.json`)
  client.games.set(metadata, runFile)
}

// Add moderators
const moderators = process.env.MODERATORS
client.moderators = moderators ? moderators.split(',') : []



// provide help
client.help = function(msg, command) {
  const prefix = options.prefix
  // find command in question
  const helpCmd = client.commands.find(cmd => cmd.name === command.args.join(" ")) ||  client.commands.find(cmd => cmd.aliases.includes(command.args.join(" ")))
  // find help for a specific command
  if(helpCmd && (helpCmd.category !== 'dev' || msg.author.id == process.env.OWNER_ID)  && (helpCmd.category !== 'mod' || client.moderators.includes(msg.author.id))) {
    msg.channel.sendMsgEmbed(`**__HELP:__**
                    \nCommand: \`${prefix}${helpCmd.name}\`
                    \nDescription: ${helpCmd.description}
                    \nUsage: \`${prefix}${helpCmd.usage}\`
                    \nAliases: \`${(helpCmd.aliases.join(", ")||'None')}\``)
    // find list of commands
  } else {
      // sort each command by category
      // get category list
      var categories = []
      for(var item of client.commands) {
        var key = item[0],
            value = item[1]
        if(!categories.includes(value.category) && (value.category != 'dev' || msg.author.id == process.env.OWNER_ID) && (value.category !== 'mod' || client.moderators.includes(msg.author.id))) {
          categories.push(value.category)
        }
      }

      var embed = new Discord.RichEmbed()
      embed.setTitle('Help - List of Commands for Gamebot')
      embed.setThumbnail(client.user.avatarURL)
      embed.setColor(options.colors.economy)
      categories.forEach(category => {
        var commandList = ''
        client.commands.forEach(cmd => {
          if(cmd.category == category) {
            commandList += `\`${options.prefix}${cmd.usage}\` - ${cmd.description}\n`
          }
        })
        embed.addField('Category: ' + category.toUpperCase(), commandList)
      })
      embed.addField('Category: IN-GAME',
      '`' + options.prefix + 'kick <@user>` - Kick a user from the game (game leader only).\n`' +
      options.prefix + 'add <@user>` - Add a user to the game (game leader only).\n`' +
      options.prefix + 'join` - Join the game. Only available at the start of each game.\n`' +
      options.prefix + 'leave` - Leave the game you are playing in that channel.\n')
      msg.channel.send(embed)
  }
  return false
}

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
  const cmd = client.commands.find(cmd => cmd.name === command.name) || client.commands.find(cmd => cmd.aliases.includes(command.name))

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
