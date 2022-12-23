// create Collection<Game> of all the games
import options from './../../config/options.js'
import { ApplicationCommandOptionType } from 'discord.js'

import { choices } from '../../types/util/games.js'

import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
  name: 'play',
  aliases: ['p'],
  description: 'Starts a new game!',
  category: 'fun',
  permissions: [],
  dmCommand: false,
  args: [{
    name: 'game',
    type: ApplicationCommandOptionType.String,
    required: true,
    description: 'The name of the game',
    choices: await Promise.all(choices),
  }],

  run: async function(msg, args) {
    try {
    await msg.reply('Loading...')
    } catch(err) {
      // TODO: Test this to see if it works
      switch(err.code) {  
        case 10062: // Unknown interaction
          msg.channel.send({
            embeds: [{
              title: 'Error!',
              description: `Sorry, I don't recognize that game. Make sure you type out the full name of the game correctly.`,
              color: options.colors.error
            }]
          })
          break;
        default:
          throw err
      } 
    }

    const selection = args.join(' ').toLowerCase()
    const game = msg.client.games.find((_game, meta) => meta.id == selection || meta.name.toLowerCase() == selection)
    
    const userArgs = args.slice(1).join(' ')

    msg.client.gameManager.start(game, msg, { userArgs })
  }
})