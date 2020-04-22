// create Collection<Game> of all the games
//const Discord = require('../../discord_mod')
module.exports = {
  name: 'end',
  usage: 'end',
  aliases: [],
  description: 'Ends the current game (game leader only).',
  category: 'fun',
  permissions: [],
  dmCommand: false,
  args: false,
  run: async function(msg, args) {
    if(msg.channel.game && msg.author.id == msg.channel.game.leader.id) {
        await msg.channel.game.forceStop()
        // allow object to be garbage collected to prevent memory leaks
        delete msg.channel.game
    }  else if (msg.channel.game && msg.author.id != msg.channel.game.leader.id) {
      msg.channel.sendMsgEmbed('Only the game leader may end the game.', 'Error!', 13632027)
    } else {
        msg.channel.sendMsgEmbed('There is no game currently playing in this channel.', 'Error!', 13632027)
    }
  }
}