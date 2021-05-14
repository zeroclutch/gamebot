/**
 * Wrapper class for Error.
 * @class
 */
export default class GamebotError extends Error {
    constructor(message) {
        super(message)
    }
}