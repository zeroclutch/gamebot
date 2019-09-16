module.exports = class Game {
    constructor(msg, settings) {}

    init() {
        throw new Error('Error: This game does not have an init() method.')
    }

    clearCollectors(collectors) {
        throw new Error('Error: This game does not have a clearCollectors() method.')
    }

    end() {
        throw new Error('Error: This game does not have an end() method.')
    }
    
    forceStop() {
        this.end()
        throw new Error('Error: This game does not have a forceStop() method.')
    }
}

// static fields
module.exports.id = 'game' // a 3-4 letter identifier for the game that people will use to start a game
module.exports.gameName = 'Game' // friendly name for display purposes
module.exports.playerCount = {
    min: 1, // minimum required player count
    max: 12 // maximum required player count
}
module.exports.genre = 'Game' // options are Card, Party, Board, Arcade, Tabletop, etc.
module.exports.about = 'A game.' // a one-sentence summary of the game
module.exports.rules = 'Rules about the game.' // explanation about how to play
