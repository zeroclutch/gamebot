import BaseCommand from './BaseCommand.js'

/**
 * Class for a bot command
 */
export default class BotCommand extends BaseCommand {
    constructor(options) {
        super(options)
        this.dmCommand = options.dmCommand || false
    }
}