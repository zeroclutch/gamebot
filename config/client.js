import Discord, { GatewayIntentBits } from "discord.js"


// remove non-text channels and remove text channels whose last message is older than 1 hour
function channelFilter(channel) {
    return !channel.messages || Discord.SnowflakeUtil.deconstruct(channel.lastMessageId).timestamp < Date.now() - 3600000;
}

export const makeCache = Discord.Options.cacheWithLimits({
    GuildManager: Infinity, // roles require guilds
    RoleManager: Infinity, // cache all roles
    PermissionOverwrites: Infinity, // cache all PermissionOverwrites. It only costs memory if the channel it belongs to is cached

    /* other caches */
    ApplicationCommandManager: 0, // guild.commands
    BaseGuildEmojiManager: 0, // guild.emojis
    GuildBanManager: 0, // guild.bans
    GuildInviteManager: 0, // guild.invites
    GuildMemberManager: 0, // guild.members
    GuildStickerManager: 0, // guild.stickers
    MessageManager: 0, // channel.messages
    PresenceManager: 0, // guild.presences
    ReactionManager: 0, // message.reactions
    ReactionUserManager: 0, // reaction.users
    StageInstanceManager: 0, // guild.stageInstances
    ThreadManager: 0, // channel.threads
    ThreadMemberManager: 0, // threadchannel.members
    UserManager: 0, // client.users
    VoiceStateManager: 0 // guild.voiceStates
});



export const intents = [
    // Thread and channel management
    GatewayIntentBits.Guilds,
    
    // Message management
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,

    GatewayIntentBits.MessageContent
]
