import logger from 'gamebot/logger'
export const eventName = 'unhandledRejection'

export const handler = (reason, promise) => {
    try {
        logger.error(reason)
        promise.catch(err => {
            logger.error(err)
        })
    } catch(err2) {
        console.error('There was an error handling the error.')
        console.error('Initial error', err)
        console.error('Logger error', err2)
    }

}