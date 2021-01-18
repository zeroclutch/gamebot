import axios from 'axios'

export default class OAuth2Client {
    constructor() {
        this.storedHashes = {}
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
        await this.sleep(60 * 60 * 1000)
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
        // Check hash storage
        if(this.storedHashes[hash]) {
            return true
        } else {
            // Check server
            return await this.validateOnServer(id, token)
        }
    }

    async validateOnServer(id, token) {
        let res = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                authorization: token
            }
        }).catch(console.error)
        if(res && res.data && res.data.id == id) {
            this.storedHashes[this.hash(id, token)] = true
            return true
        } else {
            return false
        }
    }
}