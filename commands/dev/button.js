import BotCommand from '../../types/command/BotCommand.js'
import Discord from '../../discord_mod.js';
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'

export default new BotCommand({
  name: 'button',
    aliases: [],
  description: 'Button test',
  category: 'dev',
  permissions: [GAMEBOT_PERMISSIONS.OWNER],
  dmCommand: true,
  args: [],
  run: async function(msg, args) {
    const row = new Discord.MessageActionRow()
    .addComponents(
      new Discord.MessageButton()
        .setCustomId('primary')
        .setLabel('Primary')
        .setStyle('PRIMARY'),
    );

		let messageWithButton = await msg.reply({ content: 'Pong!', components: [row] });

    const filter = i => i.customId === 'primary'
    const collector = messageWithButton.channel.createMessageComponentCollector({ filter, time: 10 * 60 * 1000 });

    collector.once('collect', async i => {
        await i.update({ content: 'A button was clicked!', components: [] })
    })

    collector.once('end', collected => messageWithButton.edit({ content: `${collected.size} click(s) collected!`, components: [] }))
  
  }
})