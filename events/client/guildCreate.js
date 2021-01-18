export const eventName = 'guildCreate'

export const handler = (client, guild) => {
    client.logger.log('Joined Guild', {
        size: guild.memberCount
    })
}
