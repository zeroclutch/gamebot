// create Collection<Game> of all the games
import Discord from '../../discord_mod.js'
import options from '../../config/options.js'


import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
    name: 'gamelist',
    usage: 'gamelist',
    aliases: ['list', 'gl', 'games'],
    description: 'Get the list of currently available games.',
    category: 'fun',
    permissions: [],
    dmCommand: true,
    args: false,
    run: function(msg, args) {
        let games = []
        msg.client.games.keyArray().forEach((metadata, index) => {
            games.push({
                name: `${index + 1}. ${metadata.name} | ID: \`${metadata.id}\``,
                value: metadata.about
            })
        })

        msg.channel.send({
            embed: {
                title: 'List of available games',
                description: `Type \`${msg.channel.prefix}play <game id>\` to start a new game.`,
                color: options.colors.economy,
                thumbnail: {
                    url: msg.client.user.avatarURL({dynamic: true})
                },
                fields: games,
                footer: {
                    text: `Type ${msg.channel.prefix}info <game id> to see how to play.`
                }
            }
        })
    }
  })