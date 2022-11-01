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
    args: [],
    run: function(msg, args) {
        let games = []
        let index = 0
        msg.client.games.forEach((value, metadata) => {
            games.push({
                name: `${index + 1}. ${metadata.name} | ID: \`${metadata.id}\``,
                value: metadata.about
            })
            index++
        })

        msg.reply({
            embeds: [{
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
            }]
        })
    }
  })