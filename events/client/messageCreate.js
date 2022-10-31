export const eventName = 'messageCreate'

export const handler = async (msg, client) => {
    try {
        await client.commandHandler.handle(msg)
    } catch (error) {
        client.emit('error', error)
    }
}