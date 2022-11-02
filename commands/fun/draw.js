import options from './../../config/options.js'
import logger from 'gamebot/logger'

import BotCommand from '../../types/command/BotCommand.js'

import Discord from 'discord.js-light'
const { Constants } = Discord

export default new BotCommand({
  name: 'draw',
  aliases: [],
  description: 'Lets you send a drawing in chat!',
  category: 'fun',
  permissions: [],
  dmCommand: false,
  args: [],
  run: function (msg, args) {
    // Callback function for when the user sends a message
    const sendMessage = data => msg.channel.send({
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
    })

    const row = new Discord.MessageActionRow()
    .addComponents(
      new Discord.MessageButton()
        .setCustomId('drawlink_button')
        .setLabel('View link')
        .setStyle('PRIMARY'),
    );

    // Check permissions
    msg.client.webUIClient.createWebUI(msg.member || msg.author, sendMessage, {
      type: 'drawing',
      duration: 1800,
    }).then(async url => {
      // The message with the drawing URL
      const drawingPayload = {
        embeds: [{
          description: `[**Click here** for your drawing page](${url}), <@${msg.author.id}>! Your drawing will be sent in ${msg.channel}!`,
          color: options.colors.info,
        }],
        ephemeral: true
      }

      if(msg instanceof Discord.Message) {
        let interactionMessage = await msg.reply({
          content: `Click the button below to receive your drawing link!`,
          components: [ row ]
        })

        const filter = i => i.customId === 'drawlink_button' && i.user.id === msg.author.id
        const collector = msg.channel.createMessageComponentCollector({ filter, time: 10 * 60 * 1000, max: 1 });

        collector.once('collect', i => {
            i.reply(drawingPayload)
            .catch(logger.error)
        })

        collector.once('end', collected => {
          let response = 'The button was not clicked in time.'
          if(collected.size > 0) {
            response = `${msg.author.tag} is drawing...`
          }

          interactionMessage.edit({
            content: response, components: []
          })
        })
      } else if (msg instanceof Discord.CommandInteraction) {
        msg.reply(drawingPayload)
      }
    }).catch(err => {
      msg.reply({
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