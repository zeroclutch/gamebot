import logger from 'gamebot/logger'

import Requester from './Requester.js'

export default class OAuth2Client {
    constructor() {
        this.storedHashes = {}
        this.requester = new Requester()
        this.requester.processQueue()
    }


    sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        })
    }

    /**
     * Begins sweeping the stored hashes
     */
    initialize() {
        this.clearHashes()
    }

    async clearHashes() {
        this.storedHashes = {}
        await this.sleep(60 * 60 * 1000 * 2) // 2 hours
        this.clearHashes()
    }

    /**
     * Creates a token (not a real hash) to reference the id and token
     */
    hash(id, token) {
        return Buffer.from(`${id}${token}`).toString('base64')
    }

    /**
     * Validates a user/token combo
     */
    async validate(id, token) {
        let hash = this.hash(id, token)

        if(token === 'Bearer null') {
            return new Error('Invalid authorization provided.')
        }

        // Check hash storage
        if(this.storedHashes.hasOwnProperty(hash)) {
            // If user hash matches id, return true
            return this.storedHashes[hash] === id
        } else {
            // Check server
            return await this.validateOnServer(id, token)
        }
    }

    async validateOnServer(id, token) {
        let hash = this.hash(id, token)

        let user = await this.requester.request({
            url: 'https://discordapp.com/api/users/@me',
            method: 'GET',
            headers: {
                'Authorization': `${token}`
            }
        }).catch(async (err) => {
            logger.error(err)
            this.storedHashes[hash] = false
        })

        // Cache hash for 2 hours
        if(user?.id === id) {
            this.storedHashes[hash] = id
        } else {
            this.storedHashes[hash] = false
        }
        
        return this.storedHashes[hash] === id
    }
}