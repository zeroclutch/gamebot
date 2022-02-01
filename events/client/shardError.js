export const eventName = 'shardError'

export const handler = (client, err) => {
    logger.error('A websocket connection encountered an error:')
    logger.error(err)
}