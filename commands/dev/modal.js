import BotCommand from '../../types/command/BotCommand.js'
import Discord from '../../discord_mod.js';
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'
import { ButtonStyle } from 'discord-api-types/v10';

import {
    TextInputStyle, TextInputBuilder, ModalBuilder, ActionRowBuilder, ButtonBuilder, 
} from 'discord.js'

export default new BotCommand({
  name: 'modal',
  aliases: [],
  description: 'Runs a test for modals',
  category: 'dev',
  permissions: [GAMEBOT_PERMISSIONS.OWNER],
  dmCommand: true,
  args: [],
  run: async function(msg, args) {
    // Create a button
    const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('primary')
        .setLabel('Open a modal!')
        .setStyle(ButtonStyle.Primary),
    );

	let messageWithButton = await msg.reply({ content: 'Wow!', components: [row] });

    const buttonFilter = i => i.customId === 'primary'
    const buttonCollector = messageWithButton.channel.createMessageComponentCollector({ buttonFilter, time: 10 * 60 * 1000 });

    // Create the modal
    const modal = new ModalBuilder()
    .setCustomId('myModal')
    .setTitle('Wow, a cool modal!');

    // Add components to modal

    // Create the text input components
    const favoriteColorInput = new TextInputBuilder()
        .setCustomId('favoriteColorInput')
        // The label is the prompt the user sees for this input
        .setLabel("What's your favorite color?")
        // Short means only a single line of text
        .setStyle(TextInputStyle.Short);

    const hobbiesInput = new TextInputBuilder()
        .setCustomId('hobbiesInput')
        .setLabel("What's some of your favorite hobbies?")
        // Paragraph means multiple lines of text.
        .setStyle(TextInputStyle.Paragraph);

    // An action row only holds one text input,
    // so you need one action row per text input.
    const firstActionRow = new ActionRowBuilder().addComponents(favoriteColorInput);
    const secondActionRow = new ActionRowBuilder().addComponents(hobbiesInput);

    // Add inputs to the modal
    modal.addComponents(firstActionRow, secondActionRow);

    buttonCollector.once('collect', async i => {
        try {
            // Show the modal to the user
            await i.showModal(modal);
            let modalData = await i.awaitModalSubmit({
                time: 10 * 60 * 1000,
                filter: (modalInteraction) => modalInteraction.customId === 'myModal',
            })

            if(modalData) {
                modalData.reply(`Thanks! We got your information and threw it away!`)
            }
        } catch (error) {
            msg.client.emit('error', error);
        }
    })  
  }
})