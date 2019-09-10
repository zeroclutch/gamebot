const Discord = require('./../../discord_mod')
const options = require('./../../config/options')

module.exports = {
    name: 'inventory',
    usage: 'inventory <item type>',
    aliases: [],
    description: 'Display the items that you have purchased.',
    category: 'economy',
    permissions: [],
    dmCommand: true,
    args: false,
    run: async function(msg, args) {
        const collection = msg.client.database.collection('items')
        const itemType = args.join(' ')
        var items = []
        msg.author.fetchDBInfo().then(async info => {
            // get user's items
            const filter = await info.unlockedItems.map((value, index, array) => {
                return { itemID: value }
            })
            const inventoryItems = await collection.find({
                $or: filter
            }).toArray()

            // get categories
            if(!itemType) {
                var itemTypes = []
                for(var i = 0; i < inventoryItems.length; i++) {
                    var item = inventoryItems[i]
                    if(!itemTypes.includes(item.type)) {
                        itemTypes.push(item.type)
                    }
                }

                if(itemTypes.length == 0) {
                    msg.channel.sendMsgEmbed(`You do not have any items in your inventory. View available items in the shop by typing \`${options.prefix}shop\`.`, 'You do not have any items in your inventory!', 13632027)
                    return
                }

                // make a new embed 
                var embed = new Discord.RichEmbed()
                embed.setTitle(`${msg.author.tag}'s Items - ${itemTypes.length} Categor${itemTypes.length == 1 ? 'y' : 'ies'}`)
                embed.setColor(3510190)

                itemTypes.forEach(async (itemType, index) => {
                    const count = inventoryItems.filter(item => item.type == itemType).length
                    embed.addField(`${itemType} - ${count} item${count == 1 ? '' : 's'}`, inventoryItems.filter(item => item.type == itemType).map(item => { return item.friendlyName }).join(', '))
                })
                embed.setFooter(`To see a list of your items for a category, type ${options.prefix}inventory <category name>`)
                await msg.channel.send({ embed })
            } else {
                const categoryItems = inventoryItems.filter(item => item.type.toLowerCase() == itemType.toLowerCase())
                if(categoryItems.length == 0) {
                    msg.channel.sendMsgEmbed(`View available items in the shop by typing \`${options.prefix}shop\`. Make sure you are spelling the category correctly.`, 'You do not have any items in this category!', 13632027)
                    return
                }
                // make a new embed 
                var embed = new Discord.RichEmbed()
                embed.setTitle(`${msg.author.tag}'s items - Category: ${categoryItems[0].type}`)
                embed.setColor(3510190)
                var description = ''
                categoryItems.forEach(item => {
                    description += `${item.cost}${options.creditIcon} | **${item.friendlyName}** | **ID:** \`${item.itemID}\`\n`
                })
                embed.setDescription(description)
                embed.setFooter(`To see more info about an item, use ${options.prefix}item info <id>.`)

                let message
                await msg.channel.send({ embed })
            }
        })
    }
  }