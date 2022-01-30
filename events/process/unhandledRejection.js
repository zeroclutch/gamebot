import logger from 'gamebot/logger'
export const eventName = 'unhandledRejection'

export const handler = (reason, promise) => {
    logger.error(reason)
    promise.catch(err => {
        logger.error(err)
    })
}