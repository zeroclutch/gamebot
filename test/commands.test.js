import options from '../config/options.js'
const $ = options.prefix

import { test, testResults } from './classes/test.js'

import assert from 'assert'

let message, collected

export default async (client, tester) => {
    
    await test('run invite command', async () => {
        message = (await tester.command($ + 'invite')).first()
        assert.strictEqual('Important Links', message.embeds[0].title)
    })
    
    await test('run balance command', async () => {
        // set self as moderator
        client.moderators.push(tester.id)
        
        // reset data
        message = (await tester.command($ + 'wipe ' + tester.id)).first()
        message = (await tester.command($ + 'bal')).first()
        assert.strictEqual(`You have **0**${options.creditIcon}.`, message.embeds[0].description)
    })

    await test('run daily command and update balance', async () => {
        // try fake voting
        message = (await tester.command($ + 'daily')).first()
        assert.strictEqual('**0 day streak!**\n⬜⬜⬜⬜⬜⬜⬜ | **Next Reward: 100' + options.creditIcon + '**', message.embeds[0].fields[0].value)
        message = (await tester.command($ + 'fakevote ' + tester.id)).first()
        message = (await tester.command($ + 'daily')).first()
        assert.strictEqual('Thank you for voting on Gamebot! You can vote again in about 12 hours.', message.embeds[0].description)

        message = (await tester.command($ + 'bal')).first()
        assert.strictEqual(`You have **100**${options.creditIcon}.`, message.embeds[0].description)
    })

    await test('run status command', async () => {
        message = (await tester.command($ + 'status')).first()
        assert.strictEqual('Latest Status Update', message.embeds[0].fields[0].name)
        assert.strictEqual('Shards Online', message.embeds[0].fields[1].name)
        assert.strictEqual('Current Shard', message.embeds[0].fields[2].name)
        assert.strictEqual('Active Games', message.embeds[0].fields[3].name)
        assert.strictEqual('Guild Count', message.embeds[0].fields[4].name)
        assert.strictEqual('User Count', message.embeds[0].fields[5].name)
        assert.strictEqual('Users in database', message.embeds[0].fields[6].name)
    })

    testResults()
}