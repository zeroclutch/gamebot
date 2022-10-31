import options from '../../config/options.js'
import { GAMEBOT_PERMISSIONS, CHANNELS } from '../../config/types.js'
import { Collection } from '../../discord_mod.js'
import BotCommand from './BotCommand.js'
import GameCommand from './GameCommand.js'

export default class CommandHandler {
    constructor(client) {
        this.client = client
        
        // Collection<String, Command>
        this.commands = new Collection()
        this.games = new Collection()

        // cache for prefixes
        this.prefixes = new Collection()
    }

    get tagPrefix() { return new RegExp(`^<@(!?)(${this.client.user.id})>( *)`) }

    async init () {
        // construct fast command index
        this.commands = new Collection()
        this.games = new Collection()
        this.client.commands.forEach(command => this.commands.set(command.name, command))
        this.client.games.forEach(game => this.games.set((game.metadata || {id: '_Game'}).id, game.commands))
        
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
            userPermissions.push(GAMEBOT_PERMISSIONS.GOD)
        }

        if(this.client.moderators.includes(message.author.id)) {
            userPermissions.push(GAMEBOT_PERMISSIONS.MOD)
        }

        if(game && game.leader.id === message.author.id) {
            userPermissions.push(GAMEBOT_PERMISSIONS.GAME_LEADER) 
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

    getCommand(commandData, game) {
        let command

        // Get default commands and aliases
        command = this.commands.get(commandData.name)
            || this.commands.find(command => command.aliases.includes(commandData.name))

        // Get in-game commands
        if(game && this.client.games.has(game.metadata)) {
            command = command || this.client.games.get(game.metadata).commands.get(commandData.name)
        }

        return command
    }

    // Creates a response to a command or slash command
    /**
     * 
     * @param {Object} command The command to respond to
     * @param {Message|Interaction} input The message or interaction that triggered the command
     */
    async handle(command, input, game) {
        if(!command) return false

        // Validate permissions
        if(!(await this.hasPermissions(input, command.permissions, game))) {
            let permissions = command.permissions.map(permission => this.titleCase(permission)).join(', ')
            message.channel.sendEmbed(`Sorry, you don't have the necessary permissions for this command.\n\nRequired permissions: \`${permissions}\``, 'Error!', options.colors.error)
            return false
        }

        if (command instanceof BotCommand) {} 
        else if (command instanceof GameCommand) {
            if(!game) {
                input.channel.sendEmbed(`Please start a game before using this command.`, 'Error!', options.colors.error)
                return false
            }
            if(!game.players.has(message.author.id)) {
                input.channel.sendEmbed(`Only players may use in-game commands.`, 'Error!', options.colors.error)
                return false
            }
        } else {
            throw new TypeError('Improperly constructed command, all commands must be of type BotCommand or GameCommand')
        }

        // Check for dmChannel
        if (input.channel.type === CHANNELS.DM && !command.dmCommand) {
            input.channel.send('This command is not available in a DM channel. Please try this again in a server.')
            return false
        }

        try {
            if (['dev', 'mod', 'economy'].includes(command.category)) {
                await this.client.dbClient.createDBInfo((input.user || input.author).id)
            }
            
            // Run as promise so we can always catch the error without awaiting
            command.runPromise(input, command.args, game).catch(err => this.client.emit('error', err, this.client, input))
        } catch (err) {
            this.client.emit('error', err, this.client, input)
        }
    }

    async handleMessage(message) {
        // Ignore bots
        if(message.author.bot && !message.client.isTestingMode) {
            return false
        }

        // Find command
        let messageData = this.getMessageData(message)
        const command = this.getCommand(messageData)

        // Check command exists
        if(!messageData || !command) return false

        let prefix = this.getPrefix(message.channel)

        // Check for empty tag
        if(messageData.prefix === this.client.user.toString() && !messageData.name) {
            message.channel.sendEmbed(`The prefix for this bot is \`${prefix}\`. You can also use ${this.client.user.tag} as a prefix.`)
            return false
        }

        // Validate command type
        const game = this.client.gameManager.games.get(message.channel.id)

        // Validate usage
        // TODO: improve argument checking
        if (command.args.length > 0 && messageData.args.join() === '') {
            message.channel.sendEmbed(`Incorrect usage of this command. Usage: \`${prefix}${command.usage}\`.`)
            return
        }

        this.handle(command, message, game)
    }

    async handleInteraction(interaction) {
        // Ignore bots
        if(interaction.user.bot && !interaction.client.isTestingMode) {
            return false
        }

        if(!interaction.isCommand()) {
            // Not a slash command, ignore
            return false
        }

        const prefix = '/' // Slash commands always use / as a prefix
        const name = interaction.commandName
        const args = interaction.options.data.map(option => option.value)
        const content = `${prefix}${name} ${args.join(' ')}`.trim()

        // Message-ify the interaction
        const interactionData = {
            prefix, name, args, content
        }
        
        // Define message field
        interaction.author = interaction.user
        interaction.content = content

        let game = this.client.gameManager.games.get(interaction.channel.id)

        const command = this.getCommand(interactionData, game)

        // Check command exists
        if(!command) {
            interaction.reply({ content: 'Invalid command', ephemeral: true }) 
            return false
        }

        // Check for dmChannel
        if (interaction.channel.type === CHANNELS.DM && !command.dmCommand) {
            interaction.reply({ content: 'Invalid command', ephemeral: true }) 
            return false
        }


        this.handle(command, interaction, game)
    }
}