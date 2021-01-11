const Discord = require('../../discord_mod.js') 
const fs = require('fs')

/**
 * Code modified from:
 * https://stackoverflow.com/a/60923170
 * https://github.com/discordjs/discord.js/issues/3576
 * 
 */
module.exports = {
  Discord,
Client: class Client extends Discord.Client {
  constructor() {
    super()
    this.gameList = new Discord.Collection()
    const folder = fs.readdirSync('./games')

    // add game classes to collection
    for(let game of folder) {
      // ignore Game class
      if(game == 'Game.js' || game == '.DS_Store') continue
      let runFile = require(`../games/${game}/main`)
      let metadata = require(`../games/${game}/metadata.json`)
      this.gameList.set(metadata, runFile)
    }
  }

  get games() {
    return this.gameList
  }
},
Guild: class Guild extends Discord.Guild {
  constructor(client) {
    super(client, {
      // you don't need all of these but I just put them in to show you all the properties that Discord.js uses
      id: Discord.SnowflakeUtil.generate(),
      name: '',
      icon: null,
      splash: null,
      owner_id: '',
      region: '',
      afk_channel_id: null,
      afk_timeout: 0,
      verification_level: 0,
      default_message_notifications: 0,
      explicit_content_filter: 0,
      roles: [],
      emojis: [],
      features: [],
      mfa_level: 0,
      application_id: null,
      system_channel_flags: 0,
      system_channel_id: null,
      widget_enabled: false,
      widget_channel_id: null
    })
    this.client.guilds.set(this.id, this)
  }
},
GuildChannel: class GuildChannel extends Discord.GuildChannel{
  constructor(guild) {
    super(guild, {
      name: 'guild-channel',
      position: 1,
      parent_id: Discord.SnowflakeUtil.generate(),
      permission_overwrites: [],
    })
  }
},
TextChannel: class TextChannel extends Discord.TextChannel {
  constructor(guild) {
    super(guild, {
      id: Discord.SnowflakeUtil.generate(),
      topic: 'topic',
      nsfw: false,
      last_message_id: Discord.SnowflakeUtil.generate(),
      lastPinTimestamp: new Date('2019-01-01').getTime(),
      rate_limit_per_user: 0,
    })
    this.client.channels.set(this.id, this)
    this.guild.channels.set(this.id, this)
  }
  // you can modify this for other things like attachments and embeds if you need
  sendMsgEmbed(content) {
    return this.client.actions.MessageCreate.handle({
      id: '123456',
      type: 0,
      channel_id: this.id,
      content,
      author: {
        id: 'bot id',
        username: 'bot username',
        discriminator: '1234',
        bot: true
      },
      pinned: false,
      tts: false,
      nonce: '',
      embeds: [],
      attachments: [],
      timestamp: Date.now(),
      edited_timestamp: null,
      mentions: [],
      mention_roles: [],
      mention_everyone: false
    })
  }
  },
Message: class Message extends Discord.Message {
  constructor(content, channel, author, member) {
    super(channel.client, {
      content,
      author,
      webhook_id: null,
      type: "DEFAULT",
      member,
      pinned: false,
      tts: false,
      nonce: "nonce",
      embeds: [],
      attachments: [],
      edited_timestamp: null,
      reactions: [],
      mentions: [],
      mention_roles: [],
      mention_everyone: [],
      hit: false,
    }, channel)
    this.channel = channel
    this.author = author
    this.member = member
    this.args = content.split(' ').slice(1)
  }

  setup() {}
},
User: class User extends Discord.User {
  constructor(client) {
    super(client, {
      id: Discord.SnowflakeUtil.generate(),
      username: "user username",
      discriminator: "user#0000",
      avatar: "user avatar url",
      bot: false,
    })
  }
},
GuildMember: class GuildMember extends Discord.GuildMember {
  constructor(client, guild, user) {
    super(client, {
      id: Discord.SnowflakeUtil.generate(),
      deaf: false,
      mute: false,
      self_mute: false,
      self_deaf: false,
      session_id: "session-id",
      channel_id: "channel-id",
      nick: "nick",
      joined_at: new Date("2020-01-01").getTime(),
      user,
      roles: [],
    }, guild)
    guild.members.set(this.id, this)
  }
}
}