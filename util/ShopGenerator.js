const DatabaseClient = require("./DatabaseClient");

module.exports = class ShopGenerator {
    constructor(options) {
        this.client = new DatabaseClient('ShopGenerator')
        this.itemCache = {
            items: [],
            errors: ['ShopGenerator is still initializing']
        }
        this.refreshDelay = options.refreshDelay || 60000
    }

    /**
     * Initializes a new instance of a ShopGenerator
     */
    async initialize() {
        await this.client.initialize()
        this.cycleShopRefresh()
    }

    sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        })
    }

    /**
     * Refreshes shop item cache
     */
    async refreshShopItemCache() {
        try {
            let items = await this.client.getItems()
            this.itemCache = { items, errors: [] }
        } catch (err) {
            console.error('There was an error fetching the shop items.\n' + err)
            this.itemCache = { items: [], errors: ['There was an error fetching the shop items.'] }
        }
    }

    async cycleShopRefresh() {
        await this.refreshShopItemCache()
        await this.sleep(this.refreshDelay)
        this.cycleShopRefresh()
    }

    async fetchShopItems(userID) {
        let items = []
        let userInfo = await this.client.fetchDBInfo(userID)
        let userItems = userInfo.unlockedItems
        let shopStatus = await this.client.getShopStatus()
        this.itemCache.items.forEach(item => {
            let newItem
            if(userItems.includes(item.itemID)) {
                newItem = Object.assign({}, item)
                newItem.purchased = true
            }
            items.push(newItem || item)
        })
        return { items: items || this.itemCache.items, errors: this.itemCache.errors, balance: userInfo.balance, shopStatus }
    }
}