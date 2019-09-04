require('dotenv').config();
const Discord = require("./discord_mod.js");
const client = new Discord.Client();
const app = require("express")();
const http = require("http");
const fs = require('fs');
const options = require('./config/options')

// configure message sending
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

// initialization
client.login(options.token); 

client.data = {};

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

// provide help
client.help = function(msg, command) {
  const prefix = msg.prefix
  // find command in question
  const helpCmd = client.commands.find(cmd => cmd.name === command.args.join(" ")) ||  client.commands.find(cmd => cmd.aliases.includes(command.args.join(" ")))
  // find help for a specific command
  if(helpCmd && helpCmd.category !== 'dev') {
    msg.channel.sendMsgEmbed(`**__HELP:__**
                    \nCommand: \`${prefix}${helpCmd.name}\`
                    \nDescription: ${helpCmd.description}
                    \nUsage: \`${prefix}${helpCmd.usage}\`
                    \nAliases: \`${(helpCmd.aliases.join(", ")||'None')}\``)
    // find list of commands
  } else {
    const commandList = (function() {
      var list = {},
          response = '**Commands**\n'
      // sort each command by category
      client.commands.forEach(cmd => {
        if(cmd.category !== 'dev') {
          response += `\`${options.prefix}${cmd.usage}\` - ${cmd.description}\n`
        }
      })
      response += '\n**In-game Commands**\n`' +
      options.prefix + 'kick <@user>` - Kick a user from the game (game leader only).\n`' +
      options.prefix + 'add <@user>` - Add a user to the game (game leader only).\n`' +
      options.prefix + 'join` - Join the game. Only available at the start of each game.\n`' +
      options.prefix + 'leave` - Leave the game you are playing in that channel.\n'
      return response
    })();
    msg.channel.sendMsgEmbed(commandList, 'HELP')
  }
  return false
}

// handle commands
client.on('message', async function(msg) {
  var prefix = msg.prefix = options.prefix
  if (msg.content.startsWith(`<@!${client.user.id}>`)) msg.content = msg.content.replace(`<@!${client.user.id}>`, prefix).replace(`<@!${client.user.id}> `, prefix)
  if (msg.content.startsWith(`<@${client.user.id}>`)) msg.content = msg.content.replace(`<@${client.user.id}>`, prefix).replace(`<@!${client.user.id}> `, prefix)
  if (!msg.content.startsWith(prefix) || msg.author.bot) return

  const message = msg.content.substring(prefix.length, msg.content.length).split(" ")
  
  const command = { 
    name: message[0],
    args: message.splice(1)
  }
  const cmd = client.commands.find(cmd => cmd.name === command.name) || client.commands.find(cmd => cmd.aliases.includes(command.name))
  var initialData = client.data

  // if the message is just a tag, reveal prefix
  if((!command.name || command.name.length == 0) && command.args.length == 0) {
    msg.channel.sendMsgEmbed(`The prefix for this bot is \`${options.prefix}\`. You can also use ${client.user} as a prefix.`)
  }

  // provide help
  if(command.name === 'help') {
    client.help(msg, command);
  }
  
  if(cmd) {
    // test for permissions
    if(cmd.permissions && msg.author.id !== process.env.OWNER_ID) {
      if(!msg.member.hasPermission(cmd.permissions) || cmd.permissions.includes('GOD')) {
        msg.channel.sendMsgEmbed('Sorry, you don\'t have the necessary permissions for this command.')
        return
      }
    }

    // start typing if message requires load time
    if(cmd.loader) {
      await msg.channel.startTypingAsync(msg.channel)
    }
    //try running command
    if(msg.channel.type == 'dm' && !cmd.dmChannel) {
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
  if(loggingChannel) loggingChannel.sendMsgEmbed(message)
})

client.on('consoleError', async message => {
  if(!client.readyAt) return
  const loggingChannel = client.channels.get(options.loggingChannel)
  if(loggingChannel) loggingChannel.sendMsgEmbed(message, 'Error', 13632027)
})

// Handle all GET requests
app.get('/', function (request, response) {
    response.sendFile(__dirname + '/index.html');
})

// Listen on port 3000
app.listen(3000, function (error) {
  if (error) throw error
  console.log('Server is running on port 3000')
})

setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);