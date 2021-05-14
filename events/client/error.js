import options from '../../config/options.js'

export const eventName = 'error'

// Replaces error message with a more user-friendly one
const getError = err => {
    const ERROR_MESSAGES = {
        'Missing Permissions': `I'm missing some permissions. Gamebot needs have 'Embed Links' enabled in this channel to work.`,
    }

    return ERROR_MESSAGES[err.message] || 'An unknown error occurred.'
}

export const handler = (err, client, message) => {
    const ERROR_CODE = Buffer.from(`${Math.random()}`).toString('base64').slice(3,12)
    if(message) {
        //message.channel.send(getError(error))
        // could cause infinite loop if error is with sending
    }
    console.error(`Client on shard ${client.shard.ids[0]} received error ${ERROR_CODE}`)
    console.error(err)
}

