import options from "../../config/options.js"
import { Collection } from '../../discord_mod.js'
import BotCommand from './BotCommand.js'
import GameCommand from './GameCommand.js'

export default class CommandHandler {
    constructor(client) {
        this.client = client
        this.games = client.games // get game-specific commands
        
        // Collection<String, Command>
        this.commands = new Collection()

        // cache for prefixes
        this.prefixes = new Collection()
    }

    get tagPrefix() { return new RegExp(`^<@(!?)(${this.client.user.id})>( *)`) }

    async init () {
        // construct fast command index
        this.commands = new Collection()
        this.client.commands.forEach(command => this.commands.set(command.name, command))
        this.client.games.forEach(game => game.commands ? game.commands.forEach(command => this.commands.set(command.name, command)) : null)
        // cache all guild prefixes available for this shard 
        await this.updatePrefixes()
    }

    // Force prefix cache update
    async updatePrefixes() {
        /*
        let collection = this.client.database.collection('guilds')
        if(collection) {
            let guilds = await collection.find('*')
            guilds.forEach(guild => {
                // NOTE: GUILD.ID MAY NOT BE ACCURATE
                this.prefixes.set(guild.id, guild.prefix)
            })
        }*/
    }

    async hasPermissions(message, permissions, game) {

        // Fetch member
        let member
        let userPermissions = []
        
        if(message.guild) {
            member = await message.guild.members.fetch(message.author.id)
            let channel = await this.client.channels.fetch(message.channel.id, false)
            userPermissions = (channel.permissionsFor(member) || new Collection()).toArray()
        }

        // Substitute custom permissions
        if(message.author.id === process.env.OWNER_ID) {
            userPermissions.push('GOD')
        }

        if(this.client.moderators.includes(message.author.id)) {
            userPermissions.push('MOD')
        }

        if(game && game.leader.id === message.author.id) {
            userPermissions.push('GAME_LEADER') 
        }

        return permissions.every(permission => userPermissions.includes(permission))
    }
    
    /**
     * Converts a string to 'Title Case'
     * @param {string} string String to convert
     * @returns string
     */
    titleCase(string) {
        return string.toLowerCase().replace(/^_*(.)|_+(.)/g, (s, c, d) => c ? c.toUpperCase() : ' ' + d.toUpperCase())
    }

    /**
     * Returns a prefix
     * @param {Channel} channel The channel that the message was sent in
     * @returns {string}
     */
    getPrefix(channel) {
        let prefix = options.prefix
        if(channel.guild) {
            prefix = this.prefixes.get(channel.guild.id) || options.prefix
        }
        return prefix
    }

    getMessageData(message) {
        let content = message.content
        let prefix,
            parts,
            name,
            args

        // Check if message starts with tag
        if(content.match(this.tagPrefix)) {
            prefix = this.tagPrefix
            content = content.replace(this.tagPrefix, '')
        } else if(content.startsWith(this.getPrefix(message.channel))) {
            prefix = this.getPrefix(message.channel)
            content = content.replace(prefix, '')
        } else {
            return false
        }
        // Split after removing prefix in case prefix has spaces
        parts = content.split(' ')
        name = parts[0].toLowerCase()
        args = parts.slice(1)
        return { prefix, content, name, args }
        
    }

    async handle(message) {
        // Ignore bots
        if(message.author.bot && !message.client.isTestingMode) {
            return false
        }

        // Find command 
        let messageData = this.getMessageData(message)

        // Check command exists
        if(!messageData) return false

        let prefix = this.getPrefix(message.channel)

        // Check for empty tag
        if(messageData.prefix === this.client.user.tag && !messageData.name) {
            message.channel.sendMsgEmbed(`The prefix for this bot is \`${prefix}\`. You can also use ${this.client.user.tag} as a prefix.`)
            return false
        }

        // Get command
        let command = this.commands.get(messageData.name) || this.commands.find(command => command.aliases.includes(messageData.name))
        if(!command) return false

        // Validate command type
        let game = this.client.gameManager.games.get(message.channel.id)
        if (command instanceof BotCommand) {} 
        else if (command instanceof GameCommand) {
            if(!game) {
                message.channel.sendMsgEmbed(`Please start a game before using this command.`, 'Error!', options.colors.error)
                return false
            }
            if(!game.players.has(message.author.id)) {
                message.channel.sendMsgEmbed(`Only players may use in-game commands.`, 'Error!', options.colors.error)
                return false
            }
        } else {
            throw new TypeError('Improperly constructed command, all commands must be of type BotCommand or GameCommand')
        }


        // Check for dmChannel
        if (message.channel.type === 'dm' && !command.dmCommand) {
            message.channel.send('This command is not available in a DM channel. Please try this again in a server.')
            return false
        } 
        
        if(!(await this.hasPermissions(message, command.permissions, game))) {
            let permissions = command.permissions.map(permission => this.titleCase(permission)).join(', ')
            message.channel.sendMsgEmbed(`Sorry, you don't have the necessary permissions for this command.\n\nRequired permissions: \`${permissions}\``, 'Error!', options.colors.error)
            return false
        }

        if (messageData.args.join() === '' && command.args) {
            message.channel.sendMsgEmbed(`Incorrect usage of this command. Usage: \`${prefix}${command.usage}\`.`)
            return
        }

        try {
            if (['dev', 'economy'].includes(command.category)) {
                await this.client.dbClient.createDBInfo(message.author.id)
            }
            command.run(message, messageData.args, game)
        } catch (err) {
            this.client.emit('error', err, this.client, message)
        }
    
    }
}