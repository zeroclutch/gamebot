const options = require('../config/options')
const $ = options.prefix

const { test, testSync, testResults } = require('./classes/test')

const assert = require('assert')

let message, collected

module.exports = async (client, tester) => {
    await test('test buying items', async () => {
        await client.dbClient.buyShopItem(client.user.id, 'gord_board', 100)
        let hasBoard = await client.dbClient.hasItem(client.user.id, 'gord_board')
        assert.strictEqual(hasBoard, true)
    })

    testResults()
}