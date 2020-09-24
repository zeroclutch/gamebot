const Discord = require('./../../discord_mod')
const options = require('./../../config/options')

module.exports = {
    name: 'shop',
    usage: 'shop <game (optional)>',
    aliases: [],
    description: 'Shows the available shop items for a game.',
    category: 'economy',
    permissions: [],
    dmCommand: true,
    args: false,
    run: async function(msg, args) {
        const collection = msg.client.database.collection('items')
        const items = await collection.find('*').toArray()
        const userInfo =  await msg.author.fetchDBInfo()

        if(!args || args.length == 0) {
            // place
            var shopCategories = []
            for(var i = 0; i < items.length; i++) {
                var item = items[i]
                if(!shopCategories.includes(item.game)) {
                    shopCategories.push(item.game)
                }
            }

            if(shopCategories.length == 0) {
                msg.channel.sendMsgEmbed(`There are no shop items available.`, 'Error!', options.colors.error)
                return
            }

            // make a new embed 
            var embed = new Discord.RichEmbed()
            embed.setTitle(`Shop Items - ${shopCategories.length} Categor${shopCategories.length == 1 ? 'y' : 'ies'}`)
            embed.setColor(options.colors.economy)
            shopCategories.forEach(async (itemType, index) => {
                let game = msg.client.games.findKey((game, meta) => meta.id == itemType).name
                let count = items.filter(item => item.game == itemType).length
                embed.addField(`Category: ${game || itemType} - ${count} item${count == 1 ? '' : 's'}`, `Type \`${options.prefix}shop ${itemType}\` to view all items.`)
            })
            embed.setFooter(`To see the available items in a category, type ${options.prefix}shop <category name>. To view your balance, type ${options.prefix}balance.`)
            await msg.channel.send({ embed }).catch(console.error)
        } else {
            let selection = args[0].toLowerCase()
            let game = msg.client.games.findKey((game, meta) => meta.id == selection || meta.name == selection)
            if(game) {
               var shopItems = await collection.find({ game: game.id }).toArray()

               // get categories
               var itemTypes = []
               for(var i = 0; i < shopItems.length; i++) {
                   var item = shopItems[i]
                   if(!itemTypes.includes(item.type)) {
                       itemTypes.push(item.type)
                   }
               }
               itemTypes.forEach(async (itemType, index) => {
                    // make a new embed for each itemType
                    var embed = new Discord.RichEmbed()
                    embed.setTitle(`Category: ${itemType}`)
                    embed.setColor(options.colors.economy)
                    var description = ''
                    shopItems.sort((a, b) => {
                        if(a.cost > b.cost) {
                            return 1
                        } else if(b.cost > a.cost) {
                            return -1
                        } else {
                            if(a.friendlyName > b.friendlyName) {
                                return 1
                            } else {
                                return -1
                            }
                        }
                    })
                    shopItems.filter(item => item.type == itemType).forEach(item => {
                        if(userInfo.unlockedItems.includes(item.itemID)) {
                            description += `✅ | **${item.friendlyName}** | **ID:** \`${item.itemID}\`\n`
                        } else {
                            description += `${item.cost}${options.creditIcon} | **${item.friendlyName}** | **ID:** \`${item.itemID}\`\n`
                        }
                    })
                    embed.setDescription(description)
                    embed.setFooter(`To buy an item, use ${options.prefix}item buy <id>. To see more info, use ${options.prefix}item info <id>`)

                    let message
                    if(index == 0) {
                        message = `**${game.name}** Shop - ${shopItems.length} items`
                    } 
                    await msg.channel.send(message, embed)
                })
            } else {
                msg.channel.sendMsgEmbed(`Please enter a valid shop page, for example \`${options.prefix}shop cah\`.`, 'Error!', options.colors.error)
            }
        }
    }
  }