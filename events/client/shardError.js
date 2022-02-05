export const eventName = 'shardError'

export const handler = (client, err) => {
    try {
        logger.error('A websocket connection encountered an error:')
        logger.error(err)
    } catch(err2) {
        console.error('There was an error handling the error.')
        console.error('Initial error', err)
        console.error('Logger error', err2)
    }
}