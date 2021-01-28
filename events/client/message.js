export const eventName = 'message'

export const handler = async (msg, client) => {
    await client.commandHandler.handle(msg)
}