import logger from 'gamebot/logger'
export const eventName = 'beforeExit'

export const handler = code => {
    try {
        logger.fatal(`Process ${process.pid} exiting with code ${code}`)
    } catch(err) {
        console.error('There was an error handling the error.')
        console.error('Logger error', err)
    }
}