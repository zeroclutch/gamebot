import Discord from './../../discord_mod.js'
import options from './../../config/options.js'

import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
    name: 'inventory',
    usage: 'inventory <item type>',
    aliases: ['inv'],
    description: 'Display the items that you have purchased.',
    category: 'economy',
    permissions: [],
    dmCommand: true,
    args: false,
    run: async function(msg, args) {
        const collection = msg.client.database.collection('items')
        const itemType = args.join(' ')
        let items = []
        msg.author.fetchDBInfo().then(async info => {
            // check if user has items
            if(info.unlockedItems.length == 0) {
                msg.channel.sendEmbed(`View available items in the shop by typing \`${msg.channel.prefix}shop\`.`, 'You do not have any items in your inventory!', 13632027)
                return
            }

            // get user's items
            const filter = await info.unlockedItems.map((value, index, array) => {
                return { itemID: value }
            })

            const inventoryItems = await collection.find({
                $or: filter
            }).toArray()

            // get categories
            if(!itemType) {
                let itemTypes = []
                for(let i = 0; i < inventoryItems.length; i++) {
                    let item = inventoryItems[i]
                    if(!itemTypes.includes(item.type)) {
                        itemTypes.push(item.type)
                    }
                }

                // make a new embed 
                let embed = new Discord.MessageEmbed()
                embed.setTitle(`${msg.author.tag}'s Items - ${itemTypes.length} Categor${itemTypes.length == 1 ? 'y' : 'ies'}`)
                embed.setColor(options.colors.economy)

                itemTypes.forEach(async (itemType, index) => {
                    const count = inventoryItems.filter(item => item.type == itemType).length
                    embed.addField(`${itemType} - ${count} item${count == 1 ? '' : 's'}`, inventoryItems.filter(item => item.type == itemType).map(item => { return item.friendlyName }).join(', '))
                })
                embed.setFooter({text: `To see a list of your items for a category, type ${msg.channel.prefix}inventory <category name>`})
                await msg.channel.send({ embeds: [embed] })
            } else {
                const categoryItems = inventoryItems.filter(item => item.type.toLowerCase() == itemType.toLowerCase())
                if(categoryItems.length == 0) {
                    msg.channel.sendEmbed(`View available items in the shop by typing \`${msg.channel.prefix}shop\`. Make sure you are spelling the category correctly.`, 'You do not have any items in this category!', 13632027)
                    return
                }
                // make a new embed 
                let embed = new Discord.MessageEmbed()
                embed.setTitle(`${msg.author.tag}'s items - Category: ${categoryItems[0].type}`)
                embed.setColor(options.colors.economy)
                let description = ''
                categoryItems.forEach(item => {
                    let cost = ''
                    if(item.goldCost > 0)
                        cost += `${item.goldCost}${options.goldIcon} `
                    else cost += cost += `${item.cost}${options.creditIcon} `
                    description += `${cost}| **${item.friendlyName}** | **ID:** \`${item.itemID}\`\n`
                })
                embed.setDescription(description)

                let message
                await msg.channel.send({ embeds: [embed] })
            }
        })
    }
  })