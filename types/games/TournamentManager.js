class TournamentManager {
    constructor(client) {
        this.client = client
        this.tournaments = new Map()
    }

    async setup() {
        // Get all tournaments from the database
        const collection = this.client.database.collection('tournaments')

        // Fetch all tournaments using no filter ({})
        const tournaments = await collection.find({ }).toArray()

        // Set all tournaments
        for(const tournament of tournaments) {
            this.set(tournament.id, tournament);
        }
    }
    
    set(id, options) {
        this.tournaments.set(id, options);

        // Create a timer to start the tournament
        setTimeout(() => {
            this.start(id);
        }, options.startTime.getTime() - Date.now())
    }
    
    get(id) {
        return this.tournaments.get(id);
    }

    delete(id) {
        this.tournaments.delete(id);
    }

}

export default TournamentManager