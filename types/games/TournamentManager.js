import { ButtonBuilder } from '@discordjs/builders'
import { ActionRowBuilder } from 'discord.js'
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

        // Set all tournaments
        for(const tournament of tournaments) {
            this.set(tournament.id, tournament);
        }
    }
    
    /**
     * Create a new tournament
     * @param {Discord.Snowflake} id The id of the message that started the tournament.
     * @param {TournamentOptions} options The options for the tournament.
     */
    set(id, options) {
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
                this.tournaments.get(id).start();
            } else {
                logger.error(`Tournament ${id} does not exist`);
            }
        }.bind(this), options.startTime.getTime() - Date.now())
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

    /**
     * Start a match in a tournament
     * @param {Discord.Snowflake} options.id The id of the tournament  
     * @param {string} options.game The id of the game to start
     * @param {Discord.Snowflake[]} options.players The players to start the game with
     * @param {Discord.Snowflake} options.channel The channel to start the game in
     */
    startMatch({ id, game, players, channel}) {
        // Get the tournament
        const tournament = this.tournaments.get(id);
    }


}

export default TournamentManager
