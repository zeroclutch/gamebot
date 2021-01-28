export const eventName = 'guildDelete'

export const handler = (guild, client) => {
    client.logger.log('Left Guild', {
        size: guild.memberCount,
        duration: Date.now() - guild.joinedTimestamp
      })
}