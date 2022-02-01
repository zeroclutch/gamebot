import logger from 'gamebot/logger'
export const eventName = 'uncaughtException'

export const handler = (err, origin) => {
    logger.fatal(err)
    logger.fatal(origin)

    process.exit(1)
}