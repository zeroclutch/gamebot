// create Collection<Game> of all the games
import options from './../../config/options.js'
import { CommandInteraction, ApplicationCommandOptionType } from 'discord.js'

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
    await msg.reply('Loading...')

    const selection = args.join(' ').toLowerCase()
    const game = msg.client.games.find((_game, meta) => meta.id == selection || meta.name.toLowerCase() == selection)
    
    const gameOptions = args.slice(1).join(' ')

    msg.client.gameManager.start(game, msg, gameOptions)
  }
})