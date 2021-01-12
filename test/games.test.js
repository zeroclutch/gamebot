import options from '../config/options'
const $ = options.prefix

const { test, testSync, testResults } = require('./classes/test')

import { strict as assert } from 'assert'

let message, collected

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export default async (client, tester) => {
    await test('start anagrams game', async () => {
        collected = (await tester.command($ + 'play ana', 2))
        assert.strictEqual(tester.client.user.tag + ' is starting a Anagrams game!', collected.first().embeds[0].title)
        assert.strictEqual(true, collected.last().embeds[0].description.includes('was added to the game') )
    })
    
    await test('configure anagrams options', async () => {
        collected = (await tester.command($ + 'start', 2))
        assert.strictEqual(`Time's up!`, collected.first().embeds[0].title)
        message = (await tester.channel.send('2'))
        await sleep(2000)
        message = (await tester.channel.send('GAMEBOT'))
        await sleep(2000)
    })

    await test('play anagrams game', async () => {
        message = (await tester.command($ + 'start')).first()
        assert.strictEqual(`Anagrams`, message.embeds[0].title)
        await sleep(6500)
        message = (await tester.command('GAME')).first()
        assert.strictEqual(true, message.embeds[0].description.includes(`got **GAME** for **100** points.`))
        message = (await tester.command($ + 'end')).first()
        assert.strictEqual(true, message.embeds[0].title.includes(`Game over!`))
    })

    await test('start chess game with full name', async () => {
        collected = (await tester.command($ + 'play chess', 2))
        assert.strictEqual(tester.client.user.tag + ' is starting a Chess game!', collected.first().embeds[0].title)
        assert.strictEqual(true, collected.last().embeds[0].description.includes('was added to the game') )
    })

    testResults()
}