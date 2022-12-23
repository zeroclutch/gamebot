import { ButtonBuilder } from '@discordjs/builders'
import { ActionRowBuilder, ShardClientUtil } from 'discord.js'
import logger from 'gamebot/logger'

import Tournament from './Tournament.js'

class TournamentManager {
    constructor(client) {
        this.client = client
        this.tournaments = new Map()
    }

    async setup() {
        // Get all tournaments from the database
        const collection = this.client.database.collection('tournaments')

        // Fetch all tournaments using no filter ({})
        const tournaments = await collection.find({}).toArray()

        // Set all tournaments on this shard
        for(const tournament of tournaments) {
            const shard = ShardClientUtil.shardIdForGuildId(tournament.id, this.client.shard.count)

            // If this shard is responsible for the tournament, set it
            if (this.client.shard.ids.includes(shard))
                this.set(tournament.id, tournament);
        }
    }
    
    /**
     * Create a new tournament
     * @param {Discord.Snowflake} id The id of the message that started the tournament.
     * @param {TournamentOptions} options The options for the tournament.
     */
    set(id, options) {
        // Create a new tournament
        this.tournaments.set(id, new Tournament(options, this, this.client));

        // Save the tournament to the database
        this.client.database.collection('tournaments').updateOne(
            {
                id
            },
            {
                $set: options
            },
            {
                upsert: true
            }
        )

        // Create a timer to start the tournament
        setTimeout(function() {
            if(this.tournaments.has(id)) {
                this.tournaments.get(id).initialize();
            } else {
                logger.error(`Tournament ${id} does not exist`);
            }
        }.bind(this), Math.max(options.startTime - Date.now(), 0))
    }
    
    get(id) {
        return this.tournaments.get(id);
    }

    delete(id) {
        this.tournaments.delete(id);

        // Delete the tournament from the database
        this.client.database.collection('tournaments').deleteOne({
            id
        })
    }


}

export default TournamentManager
