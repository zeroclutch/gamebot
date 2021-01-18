import TestBot from './classes/TestBot.js'

// import test suites
import commandTest from './commands.test.js'
import apiTest from './api.test.js'
import gameTest from './games.test.js'

export default async client => {
    // Initialize
    const tester = new TestBot(process.env.DISCORD_TEST_BOT_TOKEN, client, process.env.TEST_CHANNEL)
    await tester.init()
    // const dummy1 = new TestBot()
    
    await commandTest(client, tester)
    await apiTest(client, tester)
    await gameTest(client, tester)
}