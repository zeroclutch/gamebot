import BotCommand from '../../types/command/BotCommand.js'

import Discord from 'discord.js-light'
const { Constants } = Discord

export default new BotCommand({
    name: 'matchup',
    aliases: [],
    description: 'Creates a channel for users',
    category: 'mod',
    permissions: ['MOD'],
    dmCommand: true,
    args: [{
      name: 'user1',
      description: 'Player 1',
      required: true,
      type: Constants.ApplicationCommandOptionTypes.USER,
    }, {
      name: 'user2',
      description: 'Player 2',
      required: true,
      type: Constants.ApplicationCommandOptionTypes.USER,
    }],
    run: async function(msg, args) {
      const user1 = args[0].replace(/\D/g, '')
      const user2 = args[1].replace(/\D/g, '')
      let member1 = await msg.guild.members.fetch(user1)
      let member2 = await msg.guild.members.fetch(user2)
      if(!member1 || !member2) {
        msg.channel.send('Invalid user!')
        return
      }
      let channel = await msg.guild.channels.create(`${member1.user.tag.slice(0,10)}-vs-${member2.user.tag.slice(0,10)}`,
      {
        type: 'text',
        parent: await msg.guild.channels.fetch('802681366659334144'),
        permissionOverwrites: [
          {
            id: member1.id,
            allow: ['SEND_MESSAGES']
          },{
              id: member2.id,
              allow: ['SEND_MESSAGES']
          },{
              id: msg.client.user.id,
              allow: ['SEND_MESSAGES']
          },{
              id: member2.id,
              allow: ['SEND_MESSAGES']
          },
          {
              id: msg.guild.roles.everyone,
              deny: ['SEND_MESSAGES']
          },
          {
              id: '843282828837912616',
              allow: ['SEND_MESSAGES']
          },
          {
              id: '620704249365659669',
              allow: ['SEND_MESSAGES']
          }
        ]
      })
      
      const organizerRole = '<@&843282828837912616>'

      msg.channel.send(`Setting up the matchup channel now at ${channel}!`)

      channel.send(`__Matchup: **${member1.user} vs ${member2.user}**__
      
Hello ${member1.user} and ${member2.user}! This is the room for your match. The format is **best of three** (first to two games wins). The player who will start the first game is ${member1.user}.
      
Use the default settings to play. Rotate between who starts games. Once you're finished, ping the role ${organizerRole}. If your opponent doesn't show up in the first 5 minutes, they forfeit the match.
      
Start your game with \`&play c4\`, and good luck!`)

      setTimeout(() => {
        channel.send(`5 minutes have passed ${organizerRole}!`)
      }, 5 * 60 * 1000)
  }
})