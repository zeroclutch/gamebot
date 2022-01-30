export const eventName = 'guildCreate'

export const handler = (guild, client) => {
    client.metrics.log('Joined Guild', {
        size: guild.memberCount
    })
}
