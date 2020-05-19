/**
 * Wrapper class for Error.
 * @class
 */
module.exports = class GamebotError extends Error {
    constructor(message) {
        super(message)
    }
}