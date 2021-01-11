const Discord = require('../../discord_mod.js')

module.exports = class DummyAccount {
    /**
     * 
     * @param {string} token The token of this bot
     * @param {Snowflake} channel The channel id to perform the test in
     * @constructor
     */
    constructor(token, channel) {
        this._channel = channel
        this.token = token
        this.client = new Discord.Client()
    }

    get channel() {
        return this.client.channels.get(this._channel)
    }

    /**
     * Initializes the bot. The other client must be logged in separately.
     */
    init() {
        return new Promise(async (resolve, reject) => {
            try {
                await this.client.login(this.token).catch(reject)
            } catch (error) {
                reject(error)
            }
        })
    }

    login() {
        return new Promise((resolve, reject) => {
            try {
                /** Check if both bots are ready */
                this.client.once('ready', () => {
                    resolve(true)
                })
                this.client.login(token)
            } catch(error) {
                reject(error)
            }
        })
    }

    /**
     * 
     * @param {String} command The message to send as a command
     * @param {number} responseCount The number of responses to expect
     * @param {time} time How long to wait before timing out
     */
    async command(command) {
        this.channel.send(command)
    }
}