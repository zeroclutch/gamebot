import Discord from './../../discord_mod.js'
import options from './../../config/options.js'

import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
    name: 'shop',
    aliases: [],
    description: 'Shows the link to the shop.',
    category: 'economy',
    permissions: [],
    dmCommand: true,
    args: [],
    run: async function(msg, args) {
        msg.reply({
            embeds: [{
                title: 'Shop',
                description: `See our online shop at [gamebot.rocks/shop](${process.env.BASE_URL}/shop)`,
                color: options.colors.economy,
                fields: [
                    {
                        name: 'Unlockables',
                        value: `Get new Cards Against Humanity packs, board skins for Chess and Othello, and much more!`
                    },
                    {
                        name: 'Rewards',
                        value: `You can gain ${options.creditIcon} credits and ${options.goldIcon} gold for donating!`
                    },
                ],
            }]
        })
    }
  })