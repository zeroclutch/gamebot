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
let logger = {
    trace(...args) { try { client?.shard.send({ type: 'log', data: ['trace', ...args] }) } catch (err) { console.error(err) } },
    debug(...args) { try { client?.shard.send({ type: 'log', data: ['debug', ...args] }) } catch (err) { console.error(err) } },
    info (...args) { try { client?.shard.send({ type: 'log', data: ['info' , ...args] }) } catch (err) { console.error(err) } },
    warn (...args) { try { client?.shard.send({ type: 'log', data: ['warn' , ...args] }) } catch (err) { console.error(err) } },
    error(...args) { try { client?.shard.send({ type: 'log', data: ['error', ...args] }) } catch (err) { console.error(err) } },
    fatal(...args) { try { client?.shard.send({ type: 'log', data: ['fatal', ...args] }) } catch (err) { console.error(err) } },
}

export default {
    trace: console.log,
    debug: console.log,
    info: console.log,
    warn: console.log,
    error: console.error,
    fatal: console.error,
}