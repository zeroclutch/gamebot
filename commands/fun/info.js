// create Collection<Game> of all the games
import Discord from '../../discord_mod.js'
import options from '../../config/options.js'

import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
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
            msg.channel.sendMsgEmbed('Game not found.', 'Error!', options.colors.error)
            return
        } else {
            const message = {
                embed: {
                    title: `${game.name} [${game.id}]`,
                    description: game.about,
                    color: 4886754,
                    thumbnail: {
                        url: msg.client.user.avatarURL({dynamic: true})
                    },
                    fields: [
                        {
                            name: 'Rules',
                            value: game.rules
                        },
                        {
                            name: 'Genre',
                            value: game.genre
                        },
                        {
                            name: 'Player Count',
                            value: `${game.playerCount.min}${game.playerCount.max !== game.playerCount.min ? ` - ${game.playerCount.max}`: ''} players`
                        }
                    ],
                    footer: {
                        text: `Type ${msg.channel.prefix}play ${game.id} to start a new game!`
                    }
                }
            }

            if(game.unlockables) {
                message.embed.fields.push({
                    name: 'Unlockable Content',
                    value: `This game has extra content you can unlock! Type \`${msg.channel.prefix}shop ${game.id}\` to see what's available.`
                })
            }
            
            msg.channel.send(message)
        }
    }
  })