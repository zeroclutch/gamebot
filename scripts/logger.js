import util from 'util'
import { Worker } from 'worker_threads'
import pino from 'pino'
import path from 'path'

/**
 * Creates logger at various priorities -- 60 highest
 * { '10': 'trace',
     '20': 'debug',
     '30': 'info',
     '40': 'warn',
     '50': 'error',
     '60': 'fatal' },
 */

const transport = pino.transport({
    targets: [
        {
            level: 'trace',
            target: 'pino-pretty',
            // options: { destination: path.join('..', 'logs', 'gamebot.log' ) },
        },
        {
            level: 'info',
            target: './webhooks/discord.js',
        }
    ]
})

const logger = pino(transport)

logger.seed = Math.random()
console.log('instantiated ', logger.seed)

export default logger