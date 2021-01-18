import options from '../config/options.js'
const $ = options.prefix

import { test, testResults } from './classes/test.js'

import { strict as assert } from 'assert'

let message, collected

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export default async (client, tester) => {
    await test('start anagrams game', async () => {
        collected = (await tester.command($ + 'play ana', 2))
        assert.strictEqual(collected.first().embeds[0].title, tester.client.user.tag + ' is starting a Anagrams game!')
        assert.strictEqual(collected.last().embeds[0].description.includes('was added to the game') , true)
    })
    
    await test('configure anagrams options', async () => {
        collected = (await tester.command($ + 'start', 2))
        assert.strictEqual(collected.first().embeds[0].title, `Time's up!`)
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
        assert.strictEqual(message.embeds[0].description.includes(`got **GAME** for **100** points.`), true)
        message = (await tester.command($ + 'end')).first()
        assert.strictEqual(message.embeds[0].title.includes(`Game over!`), true)
    })

    await test('start chess game with full name', async () => {
        collected = (await tester.command($ + 'play chess', 2))
        assert.strictEqual(collected.first().embeds[0].title, tester.client.user.tag + ' is starting a Chess game!')
        assert.strictEqual(collected.last().embeds[0].description.includes('was added to the game') , true)
    })

    await test('add second chess player', async () => {
        message = (await tester.commandFrom(tester.accounts[0], `${$}join`)).first()
        assert.strictEqual(message.embeds[0].description.includes('was added to the game'), true)
    })

    await test('add third player with error', async () => {
        collected = (await tester.commandFrom(tester.accounts[1], `${$}join`))
        assert.strictEqual(collected.first().embeds[0].description.includes(`The game can't have more than 2 players!`), true)
    })

    await test('leave during join freely', async () => {
        collected = (await tester.commandFrom(tester.accounts[0], `${$}leave`))
        assert.strictEqual(collected.first().embeds[0].description.includes(`was removed from the game!`), true)
    })

    await test('add user with command (id)', async () => {
        collected = (await tester.command(`${$}add ${tester.accounts[0].client.user.id}`, 3))
        assert.strictEqual(collected.first().embeds[0].description.includes(`was added from the game!`), true)
    })
    
    await test('configure chess options', async () => {
        collected = (await tester.command($ + 'start', 2))
        assert.strictEqual(collected.first().embeds[0].title, `Time's up!`)
        message = (await tester.channel.send('1'))
        await sleep(2000)
        message = (await tester.channel.send('2'))
        await sleep(2000)
    })

    await test('play chess game', async () => {
        message = (await tester.command($ + 'start')).first()
        // get message
        assert.strictEqual(message.content.includes(`It's your turn to move as`), true) 
        // check image hash
    })

    await test('attempt to leave during game', async () => {
        collected = (await tester.commandFrom(tester.accounts[0], `${$}leave`))
        assert.strictEqual(collected.first().embeds[0].description, `The game can't have fewer than 2 players!`)
    })

    await test('make moves in game', async () => {
        message = (await tester.commandFrom(tester.accounts[0], `${$}f4`)).first()
        // get message
        assert.strictEqual(message.content.includes(`It's your turn to move as`), true)

        message = (await tester.command(`${$}e6`)).first()
        // get message
        assert.strictEqual(message.content.includes(`It's your turn to move as`), true)

        message = (await tester.commandFrom(tester.accounts[0], `${$}g4`)).first()
        // get message
        assert.strictEqual(message.content.includes(`It's your turn to move as`), true)
    })

    await test('checkmate and win game', async () => {
        collected = (await tester.command(`${$}Qh4`, 3))
        // get message
        assert.strictEqual(collected.first().embeds[0].title, `View the computer analysis and game recap.`)
        // get message
        assert.strictEqual(collected.last().embeds[0].title, `This game contains unlockable content!`)
    })

    testResults()
}