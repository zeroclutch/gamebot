import axios from 'axios'
import EventEmitter from 'node:events'

import logger from 'gamebot/logger'

class Queue {
    constructor(size) {
        this.queue = new Array(size)
        this.head = 0
        this.tail = 0
        this.size = size
    }

    enqueue(item) {
        if (this.isFull()) {
            return false
        }
        this.queue[this.tail] = item
        this.tail = (this.tail + 1) % this.size

        // Add ID to item
        item.id = this.tail

        return this.tail
    }

    dequeue() {
        if (this.isEmpty()) {
            return null
        }
        let item = this.queue[this.head]
        this.head = (this.head + 1) % this.size
        return item
    }

    isEmpty() {
        return this.head === this.tail
    }

    isFull() {
        return (this.tail + 1) % this.size === this.head
    }

    clear() {
        this.head = 0
        this.tail = 0
    }

    get length() {
        return (this.tail - this.head + this.size) % this.size
    }

    get items() {
        return this.queue.slice(this.head, this.tail)
    }

    get first() {
        return this.queue[this.head]
    }

    get last() {
        return this.queue[this.tail]
    }
}

class Requester extends EventEmitter {
    constructor(...args) {
        super(...args)

        this.maxConcurrentRequests = 200
        this.requestQueue = new Queue(this.maxConcurrentRequests)
        this.setMaxListeners(this.maxConcurrentRequests)

        this.rateLimit = {
            remaining: Infinity,
            reset: 0,
            limit: 0
        }
    }

    sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        })
    }
    
    request(...opts) {
        return new Promise(async (resolve, reject) => {
            let id = this.requestQueue.enqueue(opts)
            if(id === false) {
                reject(new Error('Request queue is full'))
            }
            
            this.once(id, ({ res, err }) => {
                if(err) {
                    reject(err)
                } else {
                    resolve(res)
                }
            })
        })
    }

    async processQueue() {
        if(this.requestQueue.isEmpty()) {
            setTimeout(this.processQueue.bind(this), 1000)
            return
        }

        let opts = this.requestQueue.dequeue()

        // Check if rate limit is hit
        if (this.rateLimit.reset > Date.now()) {
            // Sleep until reset
            const sleepTime = this.rateLimit.reset - Date.now()
            logger.warn(opts, `Rate limit hit for ${sleepTime}ms`)

            await this.sleep(sleepTime)
        }

        try {
            // Make request
            let res = await axios(...opts)

            // Ignore other data
            res = res.data

            // Send response
            this.emit(opts.id, {res})
        } catch (err) {
            // Parse headers to get rate limit info
            let headers = err?.response?.headers

            if(headers) {
                this.rateLimit.remaining = parseInt(headers['X-RateLimit-Remaining']) || Infinity
                this.rateLimit.limit = parseInt(headers['X-RateLimit-Limit']) || 0

                // Look for reset time
                let globalReset = (Date.now() + parseInt(headers['retry-after'])) || 0
                let discordReset = (parseInt(headers['X-RateLimit-Reset']) * 1000) || 0

                // Use the larger of the two
                this.rateLimit.reset = Math.max(globalReset, discordReset)
            }

            this.emit(opts.id, {err})
        }

        // Process next request
        setTimeout(this.processQueue.bind(this), 0)
    }
}

export default Requester