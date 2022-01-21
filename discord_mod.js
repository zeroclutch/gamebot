/**
 * Discord Mod. An extension of the discord.js module to streamline usage of this bot.
 */
import Discord from 'discord.js-light'
import options from './config/options.js'
import Game from './games/_Game/classes/Game.js'
  
/**
 * Accesses and sets the prefix for a specific channel, regardless of channel caching
 */
Object.defineProperty(Discord.TextChannel.prototype, 'prefix', {
  get() {
    return this.client.commandHandler.getPrefix(this)
  },
  set(prefix) {
    if(this.guild)
      this.client.commandHandler.prefixes.set(this.guild.id, prefix) 
  },
  enumerable: true
})

/**
 * Accesses the game for the current channel
 */
Object.defineProperty(Discord.TextChannel.prototype, 'game', {
  get() {
    return this.client.gameManager.games.get(this.id)
  },
  set(value) {
    if(value == null) {
      return this.client.gameManager.games.delete(this.id)
    } else if (value instanceof Game) {
      return this.client.gameManager.games.set(this.id, value)
    }
  },
  enumerable: true
})

/**
 * Asynchronous version of {@link https://discord.js.org/#/docs/main/11.5.1/class/TextChannel?scrollTo=startTyping|Discord.TextChannel.startTyping()}
 * @returns {Promise<Boolean>} Always resolves to true.
 */
Discord.TextChannel.prototype.startTypingAsync = function (channelResolvable) {
  return new Promise((resolve, reject) => { 
    try {
      channelResolvable.startTyping()
      resolve(true)
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Easily send a message to a TextChannel or DMChannel as an embed.
 * @param {String} description The description field of the embed.
 * @param {String} title The title of the embed.
 * @param {Discord.ColorResolvable} color The color of the embed.
 * @see {@link https://discord.js.org/#/docs/main/11.5.1/typedef/ColorResolvable|Discord.ColorResolvable}
 * @returns {Promise<Discord.Message>}
 */
Discord.DMChannel.prototype.sendEmbed = Discord.TextChannel.prototype.sendEmbed = function(description, title, embedColor) {
  return this.send({
    embeds: [{
      color:  embedColor || 3789311,
      title,
      description
    }]
  })
}

/**
 * Creates a new user object in the database.
 * @returns {Promise<Object>} The data the user was initialized with.
 * @example
 * user.createDBInfo()
 * .then(info => console.log(`User was created with ${info.balance} credits`))
 * .catch(console.error)
 */
Discord.User.prototype.createDBInfo = function() {
  return new Promise((resolve, reject) => {
    this.client.dbClient.createDBInfo(this.id).then(resolve).catch(reject)
  })
}

/**
 * @typedef UserData
 * @type {Object}
 * @property {String} userID The user's ID
 * @property {Array.<String>} unlockedItems The list of unlocked items, categorized by ID
 */

/**
 * Fetches a user's database information.
 * @returns {Promise<UserData>}
 */
Discord.User.prototype.fetchDBInfo = function() {
  return new Promise((resolve, reject) => {
    this.client.dbClient.fetchDBInfo(this.id).then(resolve).catch(reject)
  })
}

/**
 * Sees if a user has an item in their inventory.
 * @returns {Boolean}
 */
Discord.User.prototype.hasItem = function (itemID) {
  return new Promise((resolve, reject) => {
    this.client.dbClient.hasItem(this.id, itemID).then(resolve).catch(reject)
  })
}

/**
 * Updates the current status message.
 */
Discord.Client.prototype.updateStatus = async function(itemID) {
  // try fetching message
  let statusChannel = await this.channels.fetch(options.statusChannel)
  if(statusChannel) {
    let message = (await statusChannel.messages.fetch({ limit: 1 }).catch(console.error)).first()
    this.latestStatus = { content: message.content, date: message.createdAt.toLocaleDateString() }
    return this.latestStatus
  }
  return null
}

const Collection = Discord.Collection
export { Collection } 
export default Discord