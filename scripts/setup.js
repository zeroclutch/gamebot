import Discord from '../discord_mod.js'
import fs from 'fs'
import path from 'path'

const commands = async client => {
    // configuration
    client.commands = new Discord.Collection()
    const commandFiles = fs.readdirSync('./commands')

    // add commands to list
    for (const commandFolder of commandFiles) {
        //search through each folder
        if (!commandFolder.includes('.DS_Store')) {
            const folder = fs.readdirSync(path.join('.', 'commands', commandFolder))
            for (const file of folder) {
                if (file == '.DS_Store') continue
                const { default: command } = await import(path.join('..', 'commands', commandFolder, file)).catch(console.error)
                client.commands.set(command.name, command)
            }
        }
    }
}

const events = async client => {
    const events = fs.readdirSync(path.join('.', 'events', 'client'))

    // add events classes to collection
    for (let event of events) {
        // ignore .DS_Store files
        if (event === '.DS_Store') continue
        const { eventName, handler  } = await import(path.join('..', 'events', 'client', event))
        client.on(eventName, async (...args) => {
            // client is always passed as first event handler argument
            await handler(client, ...args)
        })
    }
}

const games = async client => {
    client.games = new Discord.Collection()
    const folder = fs.readdirSync('./games')

    // add game classes to collection
    for (let game of folder) {
        // ignore Game class
        if (game == 'Game.js' || game == '.DS_Store') continue
        const { default: metadata } = await import(path.join('..', 'games', game, 'metadata.js'))
        const { default: runFile } = await import(path.join('..', 'games', game, 'main.js'))
        client.games.set(metadata, runFile)
    }
}


const moderators = async client => {
    // Add moderators
    const moderators = process.env.MODERATORS
    client.moderators = moderators ? moderators.split(',') : []
}


import DatabaseClient from '../types/DatabaseClient.js'

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
            reject(console.error(err))
            return
            }
            resolve(data.downtimeStart - Date.now())
        })
        })
    }
}

export default {
    commands,
    database,
    events,
    games,
    moderators,
}