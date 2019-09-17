require('dotenv').config()
const Discord = require("./discord_mod.js")
const client = new Discord.Client()
const express = require("express")
const app = express()
const fs = require('fs')
const options = require('./config/options')

// database dependencies
const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGO_DB_URI;
const dbClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

// Discord Bot List dependencies
const DBL = require('dblapi.js');

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

// configure database
client.dbClient = dbClient
dbClient.connect(err => {
  if(err) {
    console.error(err)
    return
  }
  console.log('Connected to server');
  const database = dbClient.db(process.env.MONGO_DB_NAME)
  Object.defineProperty(client, 'database', {
    value: database,
    writable: false,
    enumerable: true
  });
});


// configure DBL 
var dbl
if(process.env.DBL_TOKEN)
  dbl = new DBL(process.env.DBL_TOKEN, client)
client.dbl = dbl

// initialization
client.login(options.token); 

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`); 
  client.user.setActivity(options.activity.game, { type: options.activity.type }) 
  .catch(console.error);
});

// configuration
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands');

// add commands to list
for (const commandFolder of commandFiles) {
  //search through each folder
  if(!commandFolder.includes('.DS_Store')) {
    const folder = fs.readdirSync(`./commands/${commandFolder}`);
    for(const file of folder) {
      if(file == '.DS_Store') continue
      const command = require(`./commands/${commandFolder}/${file}`);
      client.commands.set(command.name, command);
    }
  }
}


client.games = new Discord.Collection()
const folder = fs.readdirSync('./games');

// add game classes to collection
for(const file of folder) {
  // ignore Game class
  if(file == 'Game.js') continue
  let game = require(`./games/${file}`);
  client.games.set(game.id.toLowerCase(), game);
}

// provide help
client.help = function(msg, command) {
  const prefix = msg.prefix
  // find command in question
  const helpCmd = client.commands.find(cmd => cmd.name === command.args.join(" ")) ||  client.commands.find(cmd => cmd.aliases.includes(command.args.join(" ")))
  // find help for a specific command
  if(helpCmd && (helpCmd.category !== 'dev' || msg.author.id == process.env.OWNER_ID)) {
    msg.channel.sendMsgEmbed(`**__HELP:__**
                    \nCommand: \`${prefix}${helpCmd.name}\`
                    \nDescription: ${helpCmd.description}
                    \nUsage: \`${prefix}${helpCmd.usage}\`
                    \nAliases: \`${(helpCmd.aliases.join(", ")||'None')}\``)
    // find list of commands
  } else {
      var list = {},
          response = '**Commands**\n'
      // sort each command by category
      // get category list
      var categories = []
      for(var item of client.commands) {
        var key = item[0],
            value = item[1]
        if(!categories.includes(value.category) && value.category != 'dev') {
          categories.push(value.category)
        }
      }

      var embed = new Discord.RichEmbed()
      embed.setTitle('Help - List of Commands for Gamebot')
      embed.setThumbnail(client.user.avatarURL)
      embed.setColor(3510190)
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
  var prefix = msg.prefix = options.prefix
  if (msg.content.startsWith(`<@!${client.user.id}>`)) msg.content = msg.content.replace(`<@!${client.user.id}> `, prefix).replace(`<@!${client.user.id}>`, prefix)
  if (msg.content.startsWith(`<@${client.user.id}>`)) msg.content = msg.content.replace(`<@${client.user.id}> `, prefix).replace(`<@${client.user.id}>`, prefix)
  if (!msg.content.startsWith(prefix) || msg.author.bot) return

  const message = msg.content.substring(prefix.length, msg.content.length).split(" ")
  
  const command = { 
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
  
  if(cmd) {
    // test for permissions
    if(cmd.permissions && msg.author.id !== process.env.OWNER_ID && (cmd.permissions.includes('GOD') || !msg.member.hasPermission(cmd.permissions))) {
      msg.channel.sendMsgEmbed('Sorry, you don\'t have the necessary permissions for this command.')
      return
    }

    // start typing if message requires load time
    if(cmd.loader) {
      await msg.channel.startTypingAsync(msg.channel)
    }
    //try running command
    if(msg.channel.type == 'dm' && cmd.dmChannel) {
      msg.channel.send('This command is not available in a DM channel. Please try this again in a server.')
    } else if(cmd.args && command.args.join('') === '') {
        msg.channel.sendMsgEmbed(`Incorrect usage of this command. Usage: \`${msg.prefix}${cmd.usage}\`.`)
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

// Handle all GET requests
app.use(express.static(__dirname + '/public'))

app.get('/thanks', (request, response) => {
  response.sendFile(__dirname + '/public/thanks.html');
})

app.get('*', (request, response) => {
    response.sendFile(__dirname + '/public/index.html');
})


// Handle all POST requests
app.use(express.json())

app.post('/voted', (req, res) => {
  console.log(req.headers.authorization)
  console.log(req.body)
  res.status(200);
  res.send();
})

// Listen on port 5000
app.listen(process.env.PORT || 5000, (err) => {
  if (err) throw err
  console.log('Server is running on port ' + (process.env.PORT || 5000))
})


app.post('/donations', (req, res) => {
  console.log(req.body)
})
