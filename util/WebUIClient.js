const axios = require('axios')
const WebUIManager = require('./WebUIManager')
const { Collection } = require('../discord_mod')

module.exports = class WebUIClient {
    /**
     * Instantiates a WebUIClient.
     * @param {Discord.Client} client Constructor
     * @constructor
     */
    constructor(client) {
        this.client = client

        /**
         * A collection of the UIs, keyed by their UI IDs
         * @type {Discord.Collection<WebUI>}
         */
        this.UIs = new Collection()

        // Periodically sweep UIs for expired links
        setInterval(() => {
            this.UIs.forEach(UI => {
                if(Date.now() > UI.killAt) {
                    this.UIs.delete(UI.id)
                }
            })
        }, 20000)
    }

    /**
     * @typedef PlayerWebResponse
     * @type {Object}
     * @property {*} result The user's result 
     */


    /**
     * The options for this WebUI.
     * @typedef WebUIOptions
     * @type {Object}
     * @property {String} type The type of WebUI to generate.
     * @property {String} message The custom message the user sees on the WebUI.
     * @property {String[][]|RegExp[][]} variables Array of [tag, replacement] pairs to customize webpage content. Accepts RegExp.
     * @property {Number} duration How long to keep the webpage alive, in seconds
     */

     /**
      * Callback to handle the data received from the Web UI
      * @callback handlePlayerWebResponse
      * @param {PlayerWebResponse} data User input received from the web UI
      * @param {Object} UI The web UI object itself
      * @param {Discord.Client} client The discord client that initiated this request
      */

    /**
     * Creates a new WebUI and returns the generated ID.
     * @param {Discord.Member|Discord.User} user The Discord user this UI is for.
     * @param {String} message The string message to display to the usser
     * @param {String[][]|RegExp[][]} variables Array of [tag, replacement] pairs to customize webpage content. Accepts RegExp.
     * @param {Number} duration How long to keep the webpage alive, in seconds
     * @param {handlePlayerWebResponse} callback The callback function that handles the data from the Web UI
     */
    create(user, message='Enter your response here', callback, variables=[['{name}', user.nickname || user.username], ['{message}',message]], type='text', duration=300) {
        return new Promise(async (resolve, reject)=> {
            const id = WebUIManager.generateUIID(user.id)

            const UI = {
                id,
                user,
                type,
                variables,
                killAt: Date.now() + (duration * 1000),
                callback
            }
            
            // Create a new UI on the manager
            axios({
                url: `http://${process.env.BASE_URL}/createui`,
                method: 'post',
                headers: {
                    'Connection': 'close',
                    'Web-UI-Client-Token': process.env.WEB_UI_CLIENT_TOKEN
                },
                data: {
                    id,
                    user: user.id,
                    variables,
                    type,
                    shard: this.client.shard.id,
                    killAt: Date.now() + (duration * 1000)
                }
            })
            .then(() => {
                // Register UI
                this.UIs.set(id, UI)
                resolve(UI)
            })
            .catch(reject)
        })
    }

    /**
     * Receives the data and runs the callback function
     * @param {*} data The data received from the WebUI
     */
    receive(data) {
        let UI = this.UIs.get(data.id)
        if(!UI) throw new Error('UI was not found on the WebUIClient.')
        
        // Run callback
        this.UIs.get(data.id).callback(data.value, UI, this.client)
        process.nextTick(() => this.UIs.delete(data.id))
    }

    /**
     * Helper function for creating a Web UI.
     * @param {Discord.Member} member The Discord member this UI is for.
     * @param {handlePlayerWebResponse} callback The callback function that handles the data from the Web UI
     * @param {WebUIOptions} [options] The options for this WebUI.
     * @returns The UI's link
     */
    createWebUI(user, callback, options={}) {
        if(!user) throw new Error('User is a required field.')
        return new Promise((resolve, reject) => {
            // Create new UI
            this.create(user, options.message, callback, options.variables, options.type, options.duration)
            .then(UI => resolve(`http://${process.env.BASE_URL}/game/${UI.id}`))
            .catch(reject)
        })
    }
}