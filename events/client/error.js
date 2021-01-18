export const eventName = 'error'

export const handler = (client, err) => {
    console.error('Client on shard ' + client.shard.ids[0] + ' encountered an error:')
    console.error(err)
}

