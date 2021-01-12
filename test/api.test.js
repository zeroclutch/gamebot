import options from '../config/options'
const $ = options.prefix

const { test, testSync, testResults } = require('./classes/test')

import assert from 'assert'

let message, collected

export default async (client, tester) => {
    await test('test buying items', async () => {
        await client.dbClient.buyShopItem(client.user.id, 'gord_board', 100)
        let hasBoard = await client.dbClient.hasItem(client.user.id, 'gord_board')
        assert.strictEqual(hasBoard, true)
    })

    testResults()
}