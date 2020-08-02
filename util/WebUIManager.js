const { Collection } = require('../discord_mod')
const fs = require('fs')

/**
 * A manager for creating and using WebUIs within games
 * The WebUI manager must be able to communicate with the Express server and each client
 * It will be a property of each client 
 * @class
 */
module.exports = class WebUIManager {
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

    generatePage(webUI) {
        let page = fs.readFileSync(`./public/web-ui/ui-${webUI.type}.html`, 'utf8')
        let variables = webUI.variables || []
        try {
            variables = webUI.variables
            variables.push(['{id}', webUI.id])
            variables.push(['{killAt}', webUI.killAt])
        } catch(err) {
            console.error(err)
            return false
        }
        variables.forEach(v => page = page.replace(v[0], v[1]))
        return page
    }

    getWebpage(id) {
        return new Promise((resolve, reject) => {
            let webUI = this.UIs.get(id)

            // Check if ID exists
            if(!webUI || !webUI.type) {
                reject(new Error('WebUI is not registered.'))
                return
            }
            
            let generatedPage = this.generatePage(webUI)

            // Check if page was successfully generated
            if (!generatedPage) {
                reject(new Error('WebUI was not able to be generated.'))
                return
            }
                
            resolve(generatedPage)
        })
    }
}