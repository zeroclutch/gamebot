module.exports = class SubscriptionManager {
    constructor(options) {
        this.subscriptions = new Map()
        this.sweepInterval = options && options.sweepInterval ? options.sweepInterval : 60000
    }

    init() {
        setInterval(function() {
            this.sweep()
        }.bind(this), this.sweepInterval)
    }

    /**
    @example hosted_page
    { id: 'ABCDEKwUSVyLqzwoIeSvmhz40NV12345',
        type: 'checkout_new',
        url: 'https://example-test.chargebee.com/pages/v3/VPQ6NKwUSVyLqzwoIeSvmhz40NV0jOyq/',
        state: 'created',
        embed: false,
        created_at: 1612759805,
        expires_at: 1612770605,
        object: 'hosted_page',
        updated_at: 1612759805,
        resource_version: 1612759805404
    }
    */
    add(hostedPage) {
        return this.subscriptions.set(hostedPage.id, hostedPage.expires_at * 1000)
    }
    
    remove(hostedPage) {
        return this.subscriptions.delete(hostedPage.id)
    }

    sweep() {
        let now = Date.now()
        this.subscriptions.forEach((expiry, id) => {
            if(expiry < now) {
                this.subscriptions.delete(id)
            }
        })
    }
}