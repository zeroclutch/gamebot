import { Collection } from '../../discord_mod.js'
import options from '../../config/options.js'
import logger, { getMessageData } from 'gamebot/logger'

export default class GameManager {
    constructor(client) {
        // A list of active games, keyed by channel id
        this.games = new Collection()
        this.client = client

        this.sweeperOptions = {
          interval: 1000 * 60 * 15, // 15 minutes
          maxGameLength: 1000 * 60 * 60 * 6 // 6 hours
        }

        this.sweeper = setInterval(() => {
          for(let [_channelId, game] of this.games) {
            if(Date.now() - game.startTime > this.sweeperOptions.maxInactiveTime) {
              this.stop(game.channel)
            }
          }
        })
    }

    /**
     * Starts a new game
     * @param {Game} game The game to play
     * @param {Discord.Message} msg The Discord message that initiated this game
     * @param {object} options The options for the game
     * @returns {Game} the game instance
     */
    start(game, msg, { userArgs, skipInit }) {
      let channel = msg.channel

      // check if game is playing in channel
      if(this.games.has(channel.id)) {
        channel.sendEmbed(`A game is already playing in this channel! End that game first by using the \`${options.prefix}end\` command.`, 'Uh oh...', 13632027)
        return
      }
      if(!game) {
        channel.sendEmbed(`Game not found. Make sure you typed the game ID correctly. You can see the game IDs by typing \`${options.prefix}gamelist\``, 'Error!', 13632027)
        return
      }
      
      // create new instance of game
      const instance = new (game)(msg, userArgs)
      this.games.set(channel.id, instance)

      // attach deletion listener to game, it's ok if we "remove" it twice
      instance.on('end', () => {
        this.games.delete(channel.id)
      })
      
      // run initialization of game
      try {
        if(!skipInit) instance.init()
      } catch(err){
        this.client.emit('error', err, this.client, msg)

        // End game on error to prevent channel freezing
        this.stop(channel)
      }

      return instance
    }

    /**
     * Stop a game from playing in a given channel.
     * @param {Discord.TextChannel} channel Channel that has a game playing
     */
    stop(channel) {
      let game = this.games.get(channel.id)
      if(game) game.end()
      this.games.delete(channel.id)
    }
}