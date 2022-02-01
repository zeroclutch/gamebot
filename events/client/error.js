import options from '../../config/options.js'
import logger from 'gamebot/logger'

export const eventName = 'error'

// Replaces error message with a more user-friendly one
const getError = err => {
    const ERROR_MESSAGES = {
        'Missing Permissions': `I'm missing some permissions. Gamebot needs have 'Embed Links' enabled in this channel to work.`,
    }

    return ERROR_MESSAGES[err.message] || `An unknown error occurred. Please report the error with the code in the Gamebot support server: ${options.serverInvite}.`
}

export const handler = (err, client, message, game) => {
    const ERROR_CODE = Buffer.from(`${Math.random()}`).toString('base64').slice(3,12)
    if(message) {
        message.channel.send({
            content: `**Error [Code ${ERROR_CODE}]:** ${getError(err)}`
        }).catch(logger.error)
        // could cause infinite loop if error is with sending
    }

    logger.error(`Client on shard ${client.shard.ids[0]} received error ${ERROR_CODE}`)
    logger.error(err)
    if(game) {
        logger.error(`Game: ${game?.metadata?.id}`)
    }
}

