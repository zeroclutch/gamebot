export const eventName = 'error'

export const handler = (client, err) => {
    console.error('Client on shard ' + client.shard.id + ' encountered an error:')
    console.error(err)
}

