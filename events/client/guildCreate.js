export const eventName = 'guildCreate'

export const handler = (guild, client) => {
    client.logger.log('Joined Guild', {
        size: guild.memberCount
    })
}
