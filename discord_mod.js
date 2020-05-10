/**
 * Discord Mod. An extension of the discord.js module to streamline usage of this bot.
 */
const Discord = require('discord.js')

/**
 * Checks if a Discord.GuildMember has a role
 * @returns {Boolean} True if the member has that role
 */
Discord.GuildMember.prototype.hasRole = function(roleID) {
    if(this.roles.array().find(role=>role.id === roleID)) return true
    return false
  }
  
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
Discord.DMChannel.prototype.sendMsgEmbed = Discord.TextChannel.prototype.sendMsgEmbed = function(description, title, embedColor) {
  return this.send('', {
    embed: {
      color:  embedColor || 4513714,
      title,
      description
    }
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
    if(!this.client.database || !this.client.database.collection('users')) {
      reject('Error: Database not found.')
      return
    }

    const defaultInfo = {
      userID: this.id,
      balance: 0,
      lastClaim: -1000000000000,
      voteStreak: 0,
      amountDonated: 0.001,
      unlockedGames: [],
      unlockedItems: [],
      created: Date.now()
    }

    this.client.database.collection('users').findOne({ userID: this.id }).then(async user => {
      if(!user) {
        await this.client.database.collection('users').insertOne(defaultInfo)
        resolve(defaultInfo)
      } else {
        resolve(user)
      }
    }).catch(error => console.error)
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
  return new Promise(async (resolve, reject) => {
    if(!this.client.database || !this.client.database.collection('users')) {
      reject('Error: Database not found.')
      return
    }
    await this.createDBInfo()
    await this.client.database.collection('users').findOne({ userID: this.id }).then(resolve)
  })
}

/**
 * Sees if a user has an item in their inventory.
 * @returns {Boolean}
 */
Discord.User.prototype.hasItem = async function (itemID) {
  var isItemUnlocked = false
  await this.fetchDBInfo()
  .then(info => {
    if(info && info.unlockedItems && info.unlockedItems.find(item => item == itemID)) {
      isItemUnlocked = true
    }
  })
  .catch(err => {
    console.error(err)
  })
  return isItemUnlocked
}

module.exports = Discord