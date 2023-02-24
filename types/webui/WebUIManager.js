import Discord from 'discord.js';
import logger from 'gamebot/logger'
const { Collection } = Discord;
import fs from 'fs'

/**
 * A manager for creating and using WebUIs within games
 * The WebUI manager must be able to communicate with the Express server and each client
 * It will be a property of each client 
 * @class
 */
export default class WebUIManager {
    /**
     * @typedef WebUI
     */

    /**
     * Creates a new WebUI Manager
     */
    constructor(app) {
        this.app = app
        
        /**
         * A collection of the UIs, keyed by their game IDs
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
     * Generates a guaranteed™ unique WebUI identifier.
     * @param {String|Number} user The user's ID
     * @param {String|Number} channel The game channel's ID
     */
    static generateUIID(user) {
        return Buffer.from(user + Date.now() + Math.floor(Math.random() * Math.pow(10,8))).toString('base64').replace(/\W/g,'')
    }

    create(UI) {
        this.UIs.set(UI.id, {...UI})
    }

    get(id) {
        let webUI = this.UIs.get(id)

        // Check if ID exists
        if(!webUI || !webUI.type) {
            throw new Error('WebUI is not registered.')
            return
        }
        
        return webUI
    }
}