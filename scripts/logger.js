import pino from 'pino';

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

// Logger configurations
const CONFIGURATIONS = {
    development: {
        transport: {
            target: 'pino-pretty',    
            options: {
                colorize: true
            },
            level: 'trace',
        }
    },
    staging: {
        transport: {
            target: 'pino-datadog-transport',
            options: {
                ddClientConf: {
                    authMethods: {
                        apiKeyAuth: process.env.DATADOG_API_KEY_AUTH
                    }
                },
                ddtags: 'service:bot.staging',
            },
            onError: (err, logs) => {
                console.error(err)
                console.log(logs)
            }
        },
    },
    production: {
        transport: {
            target: 'pino-datadog-transport',
            service: 'Gamebot Development',
            options: {
                ddClientConf: {
                    authMethods: {
                        apiKeyAuth: process.env.DATADOG_API_KEY_AUTH
                    }
                },
                ddtags: 'service:bot.staging',
            },
            onError: (err, logs) => {
                console.error(err)
                console.log(logs)
            }
        },
    },
};

// Select logger configuration based on environment
const logger = pino(CONFIGURATIONS[process.env.NODE_ENV]);

export const attachChildLogger = (client) => {
    if(client?.shard?.ids) {
        const childLogger = logger.child({ shard: client?.shard?.ids[0] });
        client.logger = childLogger;
        return true
    }
    return false
}

export const getMessageData = (m) => {
    if(!m) return {}

    return {
        id: m.id,
        shard: m?.client?.shard?.ids[0],
        guild: m?.guild?.id,
        channel: m?.channel.id,
        game: m?.client?.gameManager.games.get(m.guild.id)?.name,
    }
}

// let logger = {
//     trace(...args) { try { client?.shard.send({ type: 'log', data: ['trace', ...args] }) } catch (err) { console.error(err) } },
//     debug(...args) { try { client?.shard.send({ type: 'log', data: ['debug', ...args] }) } catch (err) { console.error(err) } },
//     info (...args) { try { client?.shard.send({ type: 'log', data: ['info' , ...args] }) } catch (err) { console.error(err) } },
//     warn (...args) { try { client?.shard.send({ type: 'log', data: ['warn' , ...args] }) } catch (err) { console.error(err) } },
//     error(...args) { try { client?.shard.send({ type: 'log', data: ['error', ...args] }) } catch (err) { console.error(err) } },
//     fatal(...args) { try { client?.shard.send({ type: 'log', data: ['fatal', ...args] }) } catch (err) { console.error(err) } },
// }

export default logger