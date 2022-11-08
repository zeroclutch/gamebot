import { ApplicationCommandOptionType } from 'discord.js'
import GamebotError from '../error/GamebotError.js'

/**
 * Abstract class for a command
 */
export default class BaseCommand {
    constructor(options) {
        this.run         = options.run         || new GamebotError('Command has uninitialized run command')
        this.name        = options.name        || new GamebotError('Command has uninitialized name')
        this.aliases     = options.aliases     || new GamebotError('Command has uninitialized aliases')
        this.category    = options.category    || new GamebotError('Command has uninitialized category')
        this.description = options.description || new GamebotError('Command has uninitialized description')
        this.permissions = options.permissions || []
        this.args        = options.args        || [] // Array of objects with name, type, required, description

        this.usage = `${this.name} ${
            this.args.map(
                arg => arg.required ? `<${arg.name}>` : `[${arg.name}]`
            ).join(' ')
        }`.trim()
    }

    toSlashCommand() {
        return {
            type: Constants.ApplicationCommandType.ChatInput, // Slash command
            name: this.name,
            description: this.description,
            options: this.args,
        }
    }

    /**
     * Similar to run, but always returns a promise.
     * @return {Promise<T>} The result of the run command
     */
    async runPromise(...args) {
        return await this.run(...args)
    }
}