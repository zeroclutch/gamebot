import logger from 'gamebot/logger'
export const eventName = 'uncaughtException'

export const handler = (err, origin) => {
    try {
        logger.fatal(err)
        logger.fatal(origin)
    } catch(err2) {
        console.error('There was an error handling the error.')
        console.error('Initial error', err)
        console.error('Logger error', err2)
    }

    process.exit(1)
}