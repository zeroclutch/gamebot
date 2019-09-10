// create Collection<Game> of all the games

module.exports = {
  name: 'play',
  usage: 'play <game>',
  aliases: ['p'],
  description: 'Starts a new game!',
  category: 'fun',
  permissions: [],
  dmCommand: false,
  args: true,
  run: function(msg, args) {
    //const selection = args.join(' ').toLowerCase()

    // for testing only
    const selection = args[0]
    const options = args.slice(1).join(' ')

    // check if game is playing in channel
    if(msg.channel.gamePlaying) {
      msg.channel.sendMsgEmbed('A game is already playing in this channel! End that game first by using the `end` command.', 'Uh oh...', 13632027)
      return
    }
    if(!msg.client.games.get(selection)) {
      msg.channel.sendMsgEmbed('Game not found.', 'Error!', 13632027)
      return
    }

    msg.channel.gamePlaying = true
    
    // create new instance of game
    msg.channel.game = new (msg.client.games.get(selection))(msg, options.length > 0 ? options : undefined)
    // run initialization of game
    msg.channel.game.init()
    
  }
}