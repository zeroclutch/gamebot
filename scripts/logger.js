// import client from '../bot.js'

let client = null

export const ready = (c) => {
    client = c
}

/**
 * Creates logger at various priorities -- 60 highest
 * 
 * Messages will go through serialization, complex data may not be referenced accurately.
 * Use util.inspect() for complex object stringification.
 * { '10': 'trace',
     '20': 'debug',
     '30': 'info',
     '40': 'warn',
     '50': 'error',
     '60': 'fatal' },
 */
export default {
    trace(...args) { client?.shard.send({ type: 'log', data: ['trace', ...args] })},
    debug(...args) { client?.shard.send({ type: 'log', data: ['debug', ...args] })},
    info (...args) { client?.shard.send({ type: 'log', data: ['info' , ...args] })},
    warn (...args) { client?.shard.send({ type: 'log', data: ['warn' , ...args] })},
    error(...args) { client?.shard.send({ type: 'log', data: ['error', ...args] })},
    fatal(...args) { client?.shard.send({ type: 'log', data: ['fatal', ...args] })},
}