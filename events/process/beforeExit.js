import logger from 'gamebot/logger'
export const eventName = 'beforeExit'

export const handler = code => {
    logger.fatal(`Process ${process.pid} exiting with code ${code}`)
}