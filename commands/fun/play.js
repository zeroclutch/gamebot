// create Collection<Game> of all the games
import options from './../../config/options.js'
import Discord from 'discord.js-light'
const { Constants } = Discord

import fs from 'node:fs'
import path from 'node:path'

let __dirname = path.dirname(new URL(import.meta.url).pathname) // Get the directory name of the current file

// Read all the games from the games folder
const games = fs.readdirSync(decodeURIComponent(path.join(__dirname, '..', '..', 'games'))).filter(
  game => (game !== '.DS_Store' && !game.startsWith('_'))
)

// Read metadata from each game
const choices = (() => games.map(async game => {
    const { default: metadata } = await import(`../../games/${game}/metadata.js`)

    return {
      name: metadata.name,
      value: metadata.id,
    }
}))();

import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
  name: 'play',
  usage: 'play <game>',
  aliases: ['p'],
  description: 'Starts a new game!',
  category: 'fun',
  permissions: [],
  dmCommand: false,
  args: [{
    name: 'game',
    type: Constants.ApplicationCommandOptionTypes.STRING,
    required: true,
    description: 'The name of the game',
    choices: await Promise.all(choices),
  }],

  run: function(msg, args) {
    // for testing only
    const selection = args.join(' ').toLowerCase()
    const game = msg.client.games.find((game, meta) => meta.id == selection || meta.name.toLowerCase() == selection)
    
    const gameOptions = args.slice(1).join(' ')

    msg.client.gameManager.start(game, msg, gameOptions)
  }
})