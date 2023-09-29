// create Collection<Game> of all the games
import options from './../../config/options.js'
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'

import BotCommand from '../../types/command/BotCommand.js'
import Game from '../../games/_Game/main.js'
export default new BotCommand({
  name: 'debug',
    aliases: ['db'],
  description: 'Starts a new game with no minimum player count.',
  category: 'dev',
  permissions: [GAMEBOT_PERMISSIONS.OWNER],
  dmCommand: false,
  args: [],
  run: function(msg, args) {

    // for testing only
    const selection = args.join(' ').toLowerCase()
    const game = msg.client.games.find((game, meta) => meta.id == selection || meta.name.toLowerCase() == selection)
    
    const gameOptions = args.slice(1).join(' ')

    // check if game is playing in channel
    if(msg.channel.gamePlaying) {
      msg.channel.sendEmbed(`A game is already playing in this channel! End that game first by using the \`${msg.channel.prefix}end\` command.`, 'Uh oh...', 13632027)
      return
    }
    if(!game) {
      msg.channel.sendEmbed(`Game not found. Make sure you typed the game ID correctly. You can see the game IDs by typing \`${msg.channel.prefix}gamelist\``, 'Error!', 13632027)
      return
    }

    msg.channel.gamePlaying = true
    
    // create new instance of game
    msg.channel.game = new (game)(msg, gameOptions)

    // configure dev options
    // Setting player count to 0 will adjust the actual metadata of the game.

    // run initialization of game
    msg.channel.game.init()
    
  }
})