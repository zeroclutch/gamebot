import options from './../../config/options.js'
import logger from 'gamebot/logger'

import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
  name: 'draw',
  usage: 'draw',
  aliases: [],
  description: 'Lets you send a drawing in chat!',
  category: 'fun',
  // permissions: ['ATTACH_FILES'],
  dmCommand: false,
  args: false,
  run: function (msg, args) {
    // Check permissions
    msg.client.webUIClient.createWebUI(msg.member || msg.author, data => msg.channel.send({
      embeds: [{
        color: 5301186,
        author: {
          name: `${msg.author.tag}'s drawing`,
          icon_url: msg.author.avatarURL({dynamic: true})
        },
        image: {
          url: 'attachment://file.png'
        }
      }],
      files: [{
        name: 'file.png',
        attachment: Buffer.from(data, 'base64')
      }]
    }), {
      type: 'drawing',
      duration: 1800
    }).then(url => {
      msg.author.createDM()
      .then(channel => {
        channel.send({
          embeds: [{
            description: `[**Click here** for your drawing page](${url}), ${msg.author}! It will be sent in ${msg.channel}.`,
            color: 5301186
          }]
        }).then(m => {
          msg.channel.sendEmbed(`${msg.author}, [click here to go to your DMs directly.](${m.url}) Your drawing link is in your DMs!`)
        }).catch(err =>
          msg.channel.send({
            embeds: [{
              title: 'There was an error sending you a DM!',
              description: `Make sure you have DMs from server members enabled in your Privacy settings.`,
              color: options.colors.error
            }]
        }))
      })
    }).catch(err => {
      msg.channel.send({
        embeds: [{
          title: 'Error!',
          description: `There was an error loading the drawing page.`,
          color: 5301186
        }]
      })
      logger.error(err)
    })
  }
})