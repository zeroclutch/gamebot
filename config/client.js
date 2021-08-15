import Discord from "../discord_mod.js"
const Intents = Discord.Intents

// remove non-text channels and remove text channels whose last message is older than 1 hour
function channelFilter(channel) {
    return !channel.messages || Discord.SnowflakeUtil.deconstruct(channel.lastMessageId).timestamp < Date.now() - 3600000;
}

export const makeCache = Discord.Options.cacheWithLimits({
    GuildManager: Infinity, // roles require guilds
    RoleManager: Infinity, // cache all roles
    PermissionOverwrites: Infinity, // cache all PermissionOverwrites. It only costs memory if the channel it belongs to is cached
    ChannelManager: {
        maxSize: 0, // prevent automatic caching
        sweepFilter: () => channelFilter, // remove manually cached channels according to the filter
        sweepInterval: 3600
    },
    GuildChannelManager: {
        maxSize: 0, // prevent automatic caching
        sweepFilter: () => channelFilter, // remove manually cached channels according to the filter
        sweepInterval: 3600
    },
    /* other caches */
    ApplicationCommandManager: 0, // guild.commands
    BaseGuildEmojiManager: 0, // guild.emojis
    GuildBanManager: 0, // guild.bans
    GuildInviteManager: 0, // guild.invites
    GuildMemberManager: 0, // guild.members
    GuildStickerManager: 0, // guild.stickers
    MessageManager: 0, // channel.messages
    PermissionOverwriteManager: 0, // channel.permissionOverwrites
    PresenceManager: 0, // guild.presences
    ReactionManager: 0, // message.reactions
    ReactionUserManager: 0, // reaction.users
    StageInstanceManager: 0, // guild.stageInstances
    ThreadManager: 0, // channel.threads
    ThreadMemberManager: 0, // threadchannel.members
    UserManager: 0, // client.users
    VoiceStateManager: 0 // guild.voiceStates
});



export const intents = new Intents([
    // Thread and channel management
    Intents.FLAGS.GUILDS,
    
    // Message management
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MESSAGE_TYPING,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGE_TYPING
])
