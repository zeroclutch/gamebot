import { Collection } from '../discord_mod.js'
import fs from 'fs'
import path from 'path'
import logger from 'gamebot/logger'

import options from '../config/options.js'

// import GameManager from '../types/games/GameManager.js'
import CommandHandler from '../types/command/CommandHandler.js'
import TournamentManager from '../types/games/TournamentManager.js'


const commands = async client => {
    // configuration
    client.commands = new Collection()
    const commandFiles = fs.readdirSync(path.join('.', 'commands'))

    // add commands to list
    for (const commandFolder of commandFiles) {
        //search through each folder
        if (!commandFolder.includes('.DS_Store')) {
            const folder = fs.readdirSync(path.join('.', 'commands', commandFolder))
            for (const file of folder) {
                if (file === '.DS_Store') continue
                const { default: command } = await import(`../commands/${commandFolder}/${file}`).catch(logger.error.bind(logger))
                client.commands.set(command.name, command)
            }
        }
    }

    // configure CommandHandler
    client.commandHandler = new CommandHandler(client)
    client.commandHandler.init()
}

const events = async client => {
    const events = fs.readdirSync(path.join('.', 'events', 'client'))

    // add events classes to collection
    for (let event of events) {
        // ignore .DS_Store files
        if (event === '.DS_Store') continue
        const { eventName, handler  } = await import(`../events/client/${event}`)
        client.on(eventName, async (...args) => {
            // client is always passed as last event handler argument
            await handler(...args, client)
        })
    }


    const restEvents = fs.readdirSync(path.join('.', 'events', 'rest'))

    // add events classes to collection
    for (let event of restEvents) {
        // ignore .DS_Store files
        if (event === '.DS_Store') continue
        const { eventName, handler  } = await import(`../events/rest/${event}`)
        client.rest.on(eventName, async (...args) => {
            // client is always passed as last event handler argument
            await handler(...args, client)
        })
    }
}

const games = async client => {
    client.games = new Collection()
    const folder = fs.readdirSync(path.join('.','games'))

    // add game classes to collection
    for (let game of folder) {
        if(game === '.DS_Store') continue
        // ignore Game class
        if (!game.startsWith('_')) {
            const { default: metadata } = await import(`../games/${game}/metadata.js`)
            const { default: gameFile } =  await import(`../games/${game}/main.js`)
            
            // import game-specific commands
            gameFile.commands = new Collection()
            const commandsPath = path.join('.','games', game, 'commands')
            if(fs.existsSync(commandsPath)) {
                const commands = fs.readdirSync(commandsPath)
                for (let command of commands) {
                    if (command.startsWith('_') || command === '.DS_Store') continue
                    const { default: gameCmd } = await import(`../games/${game}/commands/${command}`)
                    gameFile.commands.set(gameCmd.name, gameCmd)
                }
            }

            // import general Game commands
            const gameCommandsPath = path.join('.', 'games', '_Game', 'commands')
            const commands = fs.readdirSync(gameCommandsPath)
            for (let command of commands) {
                if (command.startsWith('_') || command === '.DS_Store') continue
                const { default: cmd } = await import(`../games/_Game/commands/${command}`)
                gameFile.commands.set(cmd.name, cmd)
            }

            client.games.set(metadata, gameFile)
        }
    }

}

const tournaments = async client => {
    client.tournaments = new TournamentManager(client)
    await client.tournaments.setup()
}

const moderators = async client => {
    // Add moderators
    const moderators = process.env.MODERATORS
    client.moderators = moderators ? moderators.split(',') : []
}


import DatabaseClient from '../types/database/DatabaseClient.js'

const database = async client => {
    const dbClient = new DatabaseClient('shard ' + client.shard.ids[0])
    await dbClient.initialize()
    Object.defineProperty(client, 'dbClient', {
        value: dbClient,
        writable: false,
        enumerable: true
    })

    Object.defineProperty(client, 'database', {
        value: dbClient.database,
        writable: false,
        enumerable: true
    })
    
    // configure downtime notifications
    client.getTimeToDowntime = () => {
        return new Promise((resolve, reject) => {
            client.database.collection('status').findOne( { type: 'downtime' }).then((data, err) => {
                if(err || !data) {
                    reject(logger.error(err))
                    return
                }
                // We have predictably scheduled downtime every Saturday at 5:30 PM UTC
                // Use deploy-production.yml for scheduling
                const day = 6 // Saturday
                const hour = 17 // 5PM
                const minute = 30 // 30 past

                const now = new Date(Date.now())
                const nextScheduledDowntime = new Date()
                nextScheduledDowntime.setUTCDate(now.getUTCDate() + (7 + day - now.getDay()) % 7)
                nextScheduledDowntime.setUTCHours(hour)
                nextScheduledDowntime.setUTCMinutes(minute)
                nextScheduledDowntime.setUTCSeconds(0)
                nextScheduledDowntime.setUTCMilliseconds(0)

                const downtimes = [
                    data.downtimeStart - Date.now(),
                    nextScheduledDowntime.getTime() - Date.now()
                ].filter(d => d > 0)

                resolve(
                    Math.min(
                        downtimes
                    )
                )
            })
        })
    }

    // configure end phrases
    Object.defineProperty(client, 'getEndPhrase', {
        value: async () => {
            const DEFAULT_END_PHRASE = `To play games with the community, [join our server](${options.serverInvite}?ref=gameEnd)!`

            const data = await client.database.collection('status').findOne({ type: 'phrases' })
            let phrase = DEFAULT_END_PHRASE

            if(data?.phrases) phrase = data.phrases[Math.floor(Math.random() * data.phrases.length)]
            if(data?.broadcastPhrase && data.broadcastPhrase.length > 0) phrase = data.broadcastPhrase
            
            return phrase
        },
        writable: false,
        enumerable: true
    })
    
}

export default {
    commands,
    database,
    events,
    games,
    tournaments,
    moderators,
}