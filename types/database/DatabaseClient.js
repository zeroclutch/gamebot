import mongodb from 'mongodb';
const { MongoClient: MongoClient } = mongodb;

export default class DatabaseClient {

  /**
   * Initializes a new instance of a DatabaseClient
   */
  constructor(label, options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, uri) {
    // A name for the client
    this.label = label

    // The connection URI
    this.URI = process.env.MONGO_DB_URI || uri

    // The MongoClient this belongs to
    this.client = new MongoClient(this.URI, options)

    // Development mode converts this class to a mock shell to avoid throwing errors without a URI string
    this.developmentMode = this.URI == undefined
  }

  /**
   * Sets up a DatabaseClient for use by connecting to the database instance
   */
  async initialize() {
    if(this.developmentMode) {
      this.mock()
      return
    }
     return await this.connect().catch(err => {
      console.error(err)
      this.initialize()
    })
  }

  /**
   * Mocks a MongoDB database
   */
  mock() {
    this.client = {
      connect: () => {},
      database: {
        collection: () => {
          return {
            findOne: new Promise().resolve({}),
            find: new Promise().resolve({}),
            insertOne: new Promise().resolve({})
          }
        }
      },
      db: () => {}
    }
  }

  /**
   * Connects to the item database
   */
  connect() {
    return new Promise((resolve, reject) => {
      this.client.connect(err => {
        if (err) {
          reject(err)
          return
        }
        resolve(true)
        console.log(`Database client ${this.label} connected to database`);
        this.database = this.client.db(process.env.MONGO_DB_NAME)
      })
    })
  }

  /**
   * Reconnects to the item database
   */
  reconnect() {
    return new Promise((resolve, reject) => {
      this.database = null
      this.initialize.then(resolve).catch(reject)
    })
  }

  createDBInfo(userID) {
    return new Promise((resolve, reject) => {
      if (!this.database || !this.database.collection('users')) {
        reject('Error: Database not found.')
        return
      }

      const defaultInfo = {
        userID,
        balance: 0,
        lastClaim: -1000000000000,
        voteStreak: 0,
        amountDonated: 0.001,
        unlockedGames: [],
        unlockedItems: [],
        created: Date.now(),
        coins: 0,
        wins: [],
        achievements: [],
        quests: [],
        lastQuest: -1000000000000
      }

      this.database.collection('users').findOne({
        userID
      }).then(async user => {
        if (!user) {
          await this.database.collection('users').insertOne(defaultInfo)
          resolve(defaultInfo)
        } else {
          resolve(user)
        }
      }).catch(reject)
    })
  }

  fetchDBInfo(userID) {
    return new Promise(async (resolve, reject) => {
      await this.createDBInfo(userID)
      await this.database.collection('users').findOne({
          userID
        })
        .then(resolve)
        .catch(reject)
    })
  }

  fetchItemInfo(itemID) {
    return new Promise(async (resolve, reject) => {
      await this.database.collection('items').findOne({
          itemID
        })
        .then(resolve)
        .catch(reject)
    })
  }


/**
 * Sees if a user has an item in their inventory.
 * @returns {Boolean}
 */
  async hasItem (userID, itemID) {
    let isItemUnlocked = false
    await this.fetchDBInfo(userID)
    .then(info => {
      if(info && info.unlockedItems && info.unlockedItems.find(item => item == itemID)) {
        isItemUnlocked = true
      }
    })
    .catch(err => {
      console.error(err)
    })
    return isItemUnlocked
  }

  async getItems() {
    const collection = this.database.collection('items')
    return await collection.find('*').toArray()
  }

  async getShopStatus () {
    return new Promise(async (resolve, reject) => {
      const collection = this.database.collection('status')
      await collection.findOne({
        type: 'shop'
      }).then(resolve)
      .catch(reject)
    })
  }

  /**
   * Updates a shop item
   * @param item {string} The ID of the item
   * @param props {object} a key-value pairing of the properties to update
   * @example
   * dbClient.updateShopItem('gord_board', {cost: 120000, description, 'A board that is not overpriced!'} )
   */
  async updateShopItem(item, update) {
    return new Promise(async (resolve, reject) => {
      const collection = this.database.collection('items')
      
      await collection.findOne({
        itemID: item
      }).then(resolve)
      .catch(reject)
    })
  }

    /**
   * Buys a shop item
   * @param userID {string} The ID of the user
   * @param itemID {string} The ID of the item
   * @param cost {string} The cost of the item
   * @example
   * dbClient.updateShopItem('gord_board', {cost: 120000, description, 'A board that is not overpriced!'} )
   */
  async buyShopItem(userID, itemID, cost) {
    return new Promise(async (resolve, reject) => {
      const collection = this.database.collection('users')
      
      let response = await collection.findOneAndUpdate(
        { userID },
        { 
            $push: { unlockedItems: itemID },
            $inc: { balance: -cost }
        },
        { returnOriginal: false }
      ).catch(reject)
      resolve(response)
    })
  }

}