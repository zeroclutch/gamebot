import Discord from '../../discord_mod.js'

export default class DummyAccount {
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

    /**
     * Initializes the bot. The other client must be logged in separately.
     */
    init() {
        return new Promise(async (resolve, reject) => {
            try {
                await this.login().catch(reject)
                this.channel = await this.client.channels.fetch(this._channel, true)
                resolve(true)
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
                this.client.login(this.token)
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
        await this.channel.send(command)
    }
}