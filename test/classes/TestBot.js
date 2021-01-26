import Discord from '../../discord_mod.js'
import DummyAccount from './DummyAccount.js'

export default class TestBot {
    /**
     * 
     * @param {string} token The token of this bot
     * @param {Discord.Client} target The Discord.Client of the bot to test
     * @param {Snowflake} channel The channel id to perform the test in
     * @param  {DummyAccount} accounts Any additional accounts to test with
     * @constructor
     */
    constructor(token, target, channel, ...accounts) {
        this._channel = channel
        this.token = token
        this.target = target
        this.accounts = accounts
        this.client = new Discord.Client()
    }

    get channel() {
        return this.client.channels.cache.get(this._channel)
    }

    get id() {
        return this.client.user.id
    }

    /**
     * Initializes the bot. The other client must be logged in separately.
     */
    init() {
        return new Promise(async (resolve, reject) => {
            try {
                await this.client.channels.fetch(this._channel, true)
                await this.login().catch(reject)
                let clientUser = await this.target.users.fetch(this.client.user.id, true)

                // Pretend tester isn't a bot
                clientUser.createDM = () => new Promise(resolve => resolve(this.channel))

                // Log into dummy accounts and update bot status
                for(let i = 0; i < this.accounts.length; i++) {
                    let account = this.accounts[i]
                    await account.login(account.token)

                    let dummyUser = await this.target.users.fetch(account.client.user.id)
                    dummyUser.createDM = () => new Promise(resolve => resolve(this.channel))
                }
                resolve(true)
            } catch (error) {
                reject(error)
            }
        })
    }

    login() {
        return new Promise(async (resolve, reject) => {
            try {
                /** Check if both bots are ready */
                this.client.login(this.token).then(resolve).catch(reject)
            } catch(error) {
                reject(error)
            }
        })
    }
    /**
     * 
     * @param {String} command The message to send as a command
     * @param {number} responseCount The number of responses to expect
     * @param {Discord.Channel} channel The channel to expect responses in
     * @param {time} time How long to wait before timing out
     */
    async command(command, responseCount=1, channel=this.channel, time=10000) {
        return new Promise(async (resolve, reject) => {
            await channel.send(command).catch(reject)
            this.awaitMessages(channel, responseCount, time).then(resolve).catch(reject)
        })
    }

    /**
     * 
     * @param {DummyAccount} account The account to send a command as
     * @param {String} command The message to send as a command
     * @param {number} responseCount The number of responses to expect
     * @param {Discord.Channel} channel The channel to expect responses in
     * @param {time} time How long to wait before timing out
     */
    async commandFrom(account, command, responseCount=1, channel=this.channel, time=10000) {
        return new Promise(async (resolve, reject) => {
            await account.command(command).catch(reject)
            this.awaitMessages(channel, responseCount, time).then(resolve).catch(reject)
        })
    }
    
    /**
     * Awaits a response from the bot.
     * @param {number} responseCount The number of responses to expect
     * @param {time} time How long to wait before timing out
     */
    awaitMessages(channel=this.channel, responseCount=1, time=10000) {
        return new Promise(async (resolve, reject) => {
            channel.awaitMessages(m => m.author.id === this.target.user.id && m.channel.id === channel.id, { maxProcessed: responseCount, time, errors: ['time'] })
            .then(resolve)
            .catch(err => {
                if(err.size === 0) {
                    reject(new Error('The command response timed out.'))
                } else {
                    reject(err)
                }
            })
        })
    }
}