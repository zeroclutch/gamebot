export const eventName = 'shardError'

export const handler = (client, err) => {
    console.error('A websocket connection encountered an error:')
    console.error(err)
}