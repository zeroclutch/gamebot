/**
 * Discord Mod
 * An extension of the discord.js module to streamline usage of this bot
 */

const Discord = require('discord.js')

// returns true if a user has a role
Discord.GuildMember.prototype.hasRole = function(roleID) {
    if(this.roles.array().find(role=>role.id === roleID)) return true
    return false
  }
  
// asynchronous TextChannel.startTyping()
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

// easily send a message as an embed
Discord.TextChannel.prototype.sendMsgEmbed = function(description, title, embedColor) {
  return this.send('', {
    embed: {
      color:  embedColor || 4513714,
      title,
      description
    }
  })
}

Discord.User.prototype.createDBInfo = function() {
  return new Promise((resolve, reject) => {
    if(!this.client.database || !this.client.database.collection('users')) {
      reject('Error: Database not found.')
      return
    }

    const defaultInfo = {
      userID: this.id,
      balance: 0,
      dailyClaimed: false,
      lastVote: -1,
      voteStreak: 0,
      amountDonated: 0,
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
    })
  })
}

Discord.User.prototype.fetchDBInfo = function() {
  return new Promise((resolve, reject) => {
    if(!this.client.database || !this.client.database.collection('users')) {
      reject('Error: Database not found.')
      return
    }
    
    this.client.database.collection('users').findOne({ userID: this.id }).then(resolve)
  })
}

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

// 
/**
 * MessageOptions or Attachment or RichEmbed or StringResolvable message
 * GuildMember or User member
 * TextChannel channel
 * Integer timeout
 * Awaits a response from a single member
 */
/*Discord.TextChannel.prototype.ask = function (message, member, timeout) {
  // send message to channel
  this.send(message)
  
  const endAskingSession = msg => {
    if(!msg) {
      // time's up
      return
    }

    // delete listener after message has been found
    if(msg.member.id == member.id) {
      this.send('end run')
      this.client.removeListener('message', arguments.callee)
      return new Promise((resolve, reject) => { resolve(msg) })
    }
  }

  // begin countdown
  setTimeout(endAskingSession, timeout)
  
  this.client.on('message', endAskingSession)
}*/

module.exports = Discord