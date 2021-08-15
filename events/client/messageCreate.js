export const eventName = 'messageCreate'

export const handler = async (msg, client) => {
    await client.commandHandler.handle(msg)
}