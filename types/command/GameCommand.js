import GamebotError from '../error/GamebotError.js'
import BaseCommand from './BaseCommand.js'

/**
 * Class for a game command
 */
export default class GameCommand extends BaseCommand {
    constructor(options) {
        super(options)
        // Stages of the game where this command is allowed to be used. null means anytime
        this.allowedStages = options.allowedStages || null
    }
}