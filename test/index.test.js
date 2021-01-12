import TestBot from './classes/TestBot'

export default async client => {
    // Initialize
    const tester = new TestBot(process.env.DISCORD_TEST_BOT_TOKEN, client, process.env.TEST_CHANNEL)
    await tester.init()
    // const dummy1 = new TestBot()
    
    await require('./commands.test.js')(client, tester)
    await require('./api.test.js')(client, tester)
    await require('./games.test.js')(client, tester)
}