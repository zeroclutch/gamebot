export const eventName = 'rateLimited'
import logger from 'gamebot/logger'

export const handler = (info) => {
    logger.warn(info, 'Rate limited.')
}
