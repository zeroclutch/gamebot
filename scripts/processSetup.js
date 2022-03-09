import fs from 'fs'
import path from 'path'

const events = async () => {
    const events = fs.readdirSync(path.join('.', 'events', 'process'))

    // add events classes to collection
    for (let event of events) {
        // ignore .DS_Store files
        if (event === '.DS_Store') continue
        const { eventName, handler  } = await import(`../events/process/${event}`)
        process.on(eventName, async (...args) => {
            // client is always passed as last event handler argument
            await handler(...args)
        })
    }
}

export default {
    events,
}