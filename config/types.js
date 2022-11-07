import options from './options.js'

export const CHANNELS = {
    'DM':                   'DM', // - a DM channel
    'GROUP_DM':             'GROUP_DM', // - a group DM channel
    'GUILD_TEXT':           'GUILD_TEXT', // - a guild text channel
    'GUILD_VOICE':          'GUILD_VOICE', // - a guild voice channel
    'GUILD_CATEGORY':       'GUILD_CATEGORY', // - a guild category channel
    'GUILD_NEWS':           'GUILD_NEWS', // - a guild news channel
    'GUILD_STORE':          'GUILD_STORE', // - a guild store channel
    'GUILD_NEWS_THREAD':    'GUILD_NEWS_THREAD', // - a guild news channel's public thread channel
    'GUILD_PUBLIC_THREAD':  'GUILD_PUBLIC_THREAD', // - a guild text channel's public thread channel
    'GUILD_PRIVATE_THREAD': 'GUILD_PRIVATE_THREAD', // - a guild text channel's private thread channel
    'GUILD_STAGE_VOICE':    'GUILD_STAGE_VOICE', // - a guild stage voice channel
    'UNKNOWN':              'UNKNOWN', // - a generic channel of unknown type, could be Channel or GuildChannel
}

export const GAMEBOT_PERMISSIONS = {
    OWNER: 'OWNER',
    MOD: 'MOD',
    GAME_LEADER: 'GAME_LEADER'
}

export const GAME_OPTIONS = {
    FREE: 'free',
    CHECKBOX: 'checkboxes',
    RADIO: 'radio',
    NUMBER: 'number'
}

export const BUTTONS = {
    JOIN: 'game_join',
    START: 'game_start',
    RESET: 'game_reset',
    SELECT: 'card_select',
    VIEW_HAND: 'card_view_hand',
    MORE: 'more',
    LESS: 'less',
}

export const REPLIES = {
    DISALLOWED_ACTION: {
        embeds: [{ description: `You can't click that!`, color: options.colors.error }],
        ephemeral: true
    }
}