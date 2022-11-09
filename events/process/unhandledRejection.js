import logger from 'gamebot/logger'
export const eventName = 'unhandledRejection'

export const handler = (reason, promise) => {
    try {
        logger.error(reason, promise)
        promise.catch(logger.error.bind(logger)).catch(console.error)
    } catch(err2) {
        console.error('There was an error handling the error.')
        console.error('Logger error', err2)
    }
}