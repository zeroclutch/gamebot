// create Collection<Game> of all the games
const Discord = require('../../discord_mod')
const options = require('../../config/options')

module.exports = {
    name: 'info',
    usage: 'info <game>',
    aliases: [],
    description: 'Get the information and rules for a game.',
    category: 'fun',
    permissions: [],
    dmCommand: true,
    args: true,
    run: function(msg, args) {
        // require() selected game and get their exported info
        const selection = args.join(' ').toLowerCase()
        const game = msg.client.games.findKey((game, meta) => meta.id == selection || meta.name.toLowerCase() == selection)
        if(!game) {
            msg.channel.sendMsgEmbed('Game not found.', 'Error!', 13632027)
            return
        } else {
            msg.channel.send({
                embed: {
                    title: `${game.name} [${game.id}]`,
                    description: game.about,
                    color: 4886754,
                    thumbnail: {
                        url: msg.client.user.avatarURL
                    },
                    fields: [
                        {
                            name: 'Rules',
                            value: game.rules
                        },
                        {
                            name: 'Genre',
                            value: game.genre
                        }
                    ],
                    footer: {
                        text: `Type ${options.prefix}play ${game.id} to start a new game!`
                    }
                }
            })
        }
    }
  }