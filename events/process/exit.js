import logger from 'gamebot/logger'
export const eventName = 'exit'

export const handler = err => {
    logger.fatal(err)
}