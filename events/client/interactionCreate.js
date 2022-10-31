export const eventName = 'interactionCreate'

import { InteractionType } from 'discord-api-types/v10' 


export const handler = async (interaction, client) => {
    try {
        switch(interaction.type) {
            // Slash command
            case InteractionType.ApplicationCommand:
                await client.commandHandler.handleInteraction(interaction)
                break
            // Do nothing for other interaction types
            default:
                break
        }
    } catch (error) {
        client.emit('error', error)
    }
}