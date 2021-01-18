export const eventName = 'guildDelete'

export const handler = (client, guild) => {
    client.logger.log('Left Guild', {
        size: guild.memberCount,
        duration: Date.now() - guild.joinedTimestamp
      })
}