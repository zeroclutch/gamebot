import axios from 'axios'
import WebUIManager from './WebUIManager.js'
import { Collection } from '../../discord_mod.js'

// TODO: Use Worker messages

/**
 * An API for creating WebUIs, which allow users to enter responses from a webpage
 * @class
 */
export default class WebUIClient {
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
                if(Date.now() > (UI.killAt + 5000)) {
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
    create(user, message='Enter your response here', variables={}, type='text', duration=300) {
        const id = WebUIManager.generateUIID(user.id)

        // Add default variables
        Object.assign(variables, { name: (user.nickname ?? user.username), message })

        const UI = {
            id,
            user,
            type,
            variables,
            shard: this.client.shard.ids[0],
            killAt: Date.now() + (duration * 1000),
        }

        // Notify master process/worker
        this.client.shard.send({ type: 'webui', data: UI })

        UI.result = new Promise((resolve, reject) => {
            UI.resolve = resolve
            UI.reject = reject
        })

        UI.url = this.toURL(id)

        // Register UI
        this.UIs.set(id, UI)
        return UI
    }

    toURL(id) {
        let url = process.env.BASE_URL

        // Proxy requests during development
        if(url === 'http://localhost:8080') url = 'http://localhost:8081'

        return `${url}/ui/${id}`
    }

    /**
     * Receives the data and runs the callback function
     * @param {*} data The data received from the WebUI
     */
    receive(data) {
        let UI = this.UIs.get(data.id)
        if(!UI) throw new Error('UI was not found on the WebUIClient.')
        
        // Run callback
        this.UIs.get(data.id).resolve(data.value)
        process.nextTick(() => this.UIs.delete(data.id))
    }

    /**
     * Helper function for creating a Web UI.
     * @param {Discord.Member} member The Discord member this UI is for.
     * @param {WebUIOptions} [options] The options for this WebUI.
     * @returns {object} containing the URL and the result promise
     */
    createWebUI(user, options={}) {
        if(!user) throw new Error('User is a required field.')

        // Create new UI
        let UI = this.create(user, options.message, options.variables, options.type, options.duration)

        return {
            url: UI.url,
            result: UI.result
        }
    }
}
