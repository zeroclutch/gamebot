// create Collection<Game> of all the games
const Discord = require('../../discord_mod')
const options = require('../../config/options')
const fs = require('fs')


var games = []
const folder = fs.readdirSync('./games');

// add game classes to collection
var index = 1
for(const file of folder) {
  // ignore game
  if(file == 'Game.js') continue
  let game = require(`../../games/${file}`);
  games.push({
      name: `${index}. ${game.gameName} | ID: \`${game.id}\``,
      value: game.about
  })
  index++
}

module.exports = {
    name: 'gamelist',
    usage: 'gamelist',
    aliases: ['list', 'gl'],
    description: 'Get the list of currently available games.',
    category: 'fun',
    permissions: [],
    dmCommand: true,
    args: false,
    run: function(msg, args) {
        // require() all games in ./games except Game.js and get their exported info

        msg.channel.send({
            embed: {
                title: 'List of available games',
                description: `Type \`${options.prefix}play <game id>\` to start a new game.`,
                color: 4886754,
                thumbnail: {
                    url: msg.client.user.avatarURL
                },
                fields: games,
                footer: {
                    text: `Type ${options.prefix}info <game id> to see how to play.`
                }
            }
        })
    }
  }