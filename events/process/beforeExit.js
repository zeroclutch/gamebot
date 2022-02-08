import logger from 'gamebot/logger'
export const eventName = 'beforeExit'

export const handler = code => {
    try {
        logger.fatal(`Process ${process.pid} exiting with code ${code}`)
    } catch(err2) {
        console.error('There was an error handling the error.')
        console.error('Initial error', err)
        console.error('Logger error', err2)
    }
}