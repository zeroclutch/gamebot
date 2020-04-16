> Update: As of 3-25-2019, this guide is outdated. The Game class has many added functionalities that are not reflected in this guide.

# Creating a Game

This guide is intended to help get you started in the process of developing a game. It includes a list of required commands, methods, and fields. If you are interested in creating a game, you should have knowledge of JavaScript ES6 syntax.

Ideally, Gamebot games should be playable by small groups and larger groups, simple to use for new players, and most importantly, fun! Games also should avoid taking too long—starting a game with Gamebot shouldn't have to be a scheduled activity or something that requires a lot of commitment for users.

## 1. Create your own bot instance.

Fork or clone the repository to your local machine. Detailed instructions coming soon.

## 2. Create a new file in the `/games` directory.

The title should be the name of the game in `UpperCamelCase` and the file should have the extension `.js`.

## 3. Create your Game class.

Gamebot uses a module based system, where files in the `/games` directory are exported. You must export your game class so that it may be stored, and you must extend the parent `Game` class.

```js
// global dependencies
const Game = require('./Game')
const Discord = require('./../discord_mod')
const options = require('./../config/options')

/** @class Class representing My Game */
module.exports = class MyGame extends Game {
    constructor() {
        super()
        // constructor code
    }
}
```

## 4. Create the constructor.

The constructor has two parameters:

1. `msg` - The original message that was sent to start the game. Type: `Discord.Message`.
2. `settings` - The settings the game master uses to configure the game. Type: `object`.

> It is not recommended you use the `settings` parameter outside of debugging and testing, use the `init()` method to allow the user to set those values.

The required and recommended constructor fields are displayed below.
```js
// ...
module.exports = class MyGame extends Game {
    /**
     * Creates and instantiates a new MyGame.
     * 
     * @constructor
     * @param {Discord.Message} msg The original message that was sent to start the game.
     * @param {object} settings The settings the game master uses to configure the game.
     */
    constructor(msg, settings) {
        super()

        /** REQUIRED FIELDS **/
        this.msg = msg
        this.gameMaster = msg.author
        this.players = new Discord.Collection()
        this.ending = false
        this.collectors = [] // Whenever a MessageCollector or ReactionCollector is created, push it to this.collectors
        this.messageListener = msg => { this.onMessage(msg) } // whenever a message is sent, it is handled by the this.onMessage(msg) callback

        /** RECOMMENDED FIELDS **/
        this.stage = 'init'
    }
}
```

## 6. Implement the required methods.

As JavaScript ES6 does not have interface capabilities, `Game.js` is not at true interface. However, you are required to override each of the methods in the Game class.

```js
// ...
module.exports = class MyGame extends Game {
    constructor(msg, settings) {
        // ...
    }

    /**
     * Gets the leader of the game.
     *
     * @return {Discord.User} The leader of the game.
     */
    get leader() {
        return this.gameMaster
    }

    /**
     * Begins a new game. This will be called by the play command.
     *
     */
    init() {
        // Create listener for commands
        this.msg.client.on('message', this.messageListener)

        // Allow game leader to configure options
        // Begin playing the game
    }

    /**
     * Handles message events emitted by the client.
     * 
     * @param {Discord.Message} message The message emitted by the client.
    */
    onMessage(message) {
        // Only listen to messages sent in the game channel
        if(message.channel !== this.msg.channel) return
        // Handle commands
    }


    /**
     * Stop all collectors and reset collector list.
     * 
     * @param {Array<Discord.Collector>} 
     */
    async clearCollectors(collectors) {
        // Iterate over collectors and call Discord.Collector.stop()
    }
    

    /**
     * End a game. This will be called when a player wins or the game is force stopped.
     *
     * @param {object} winner
     */
    async end(winner) {
        // Send a message in the game channel (this.msg.channel) that the game is over.
        // Destroy all MessageCollectors and ReactionCollectors
        // Remove all event listeners created during this game.
        // Set this.msg.channel.gamePlaying to false
        // set this.msg.channel.game to undefined
    }

    /**
     * Force ends a game. This will be called by the end command.
     *
     */
    forceStop() {
        // Set this.ending to true
        // Call end command
    }

}
```

## 7. Add the required static fields.

```js
// ...
module.exports = class MyGame extends Game {
    // ...
}

// static fields
module.exports.id = 'myg' // a 3-4 letter identifier for the game that people will use to start a game
module.exports.gameName = 'My Game' // friendly name for display purposes
module.exports.playerCount = { 
    min: 2, // minimum player count
    max: 10 // maximum player count
}
module.exports.genre = 'Card' // options are Card, Party, Board, Arcade, Tabletop, etc.
module.exports.about = 'A fun game about world domination.' // a one-sentence summary of the game
module.exports.rules = 'Blah blah blah rules rules rules.' // explanation about how to play
```

## 8. Adding commands 

Each game must include and handle these commands:
* `join` - Allows players to join a game after `play <game>` is called. Make sure the player count does not exceed the maximum.
* `leave` - Allows players to leave a game after joining. Make sure the player count does not drop below the required minimum.
* `add <@player>` - Allows the game leader to add a player. Make sure the player count does not exceed the maximum.
* `kick <@player>` - Allows the game leader to kick a player. Make sure the player count does not drop below the required minimum.

```js 
```

## 9. Example starting framework.

```js
// global dependencies
const Game = require('./Game')
const Discord = require('./../discord_mod')
const options = require('./../config/options')

/** @class Class representing My Game */
module.exports = class MyGame extends Game {
    /**
     * Creates and instantiates a new MyGame.
     * 
     * @constructor
     * @param {Discord.Message} msg The original message that was sent to start the game.
     * @param {object} settings The settings the game master uses to configure the game.
     */
    constructor(msg, settings) {
        super()

        /** REQUIRED FIELDS **/
        this.msg = msg
        this.gameMaster = msg.author
        this.players = new Discord.Collection()
        this.ending = false
        this.collectors = [] // Whenever a MessageCollector or ReactionCollector is created, push it to this.collectors
        this.messageListener = msg => { this.onMessage(msg) } // whenever a message is sent, it is handled by the this.onMessage(msg) callback

        /** RECOMMENDED FIELDS **/
        this.stage = 'init'
    }

    /**
     * Gets the leader of the game.
     *
     * @return {Discord.User} The leader of the game.
     */
    get leader() {
        return this.gameMaster
    }

    /**
     * Begins a new game. This will be called by the play command.
     *
     */
    init() {
        // Create listener for commands
        this.msg.client.on('message', this.messageListener)

        // Allow game leader to configure options
        // Begin playing the game
    }

    /**
     * Handles message events emitted by the client.
     * 
     * @param {Discord.Message} message The message emitted by the client.
    */
    onMessage(message) {
        // Only listen to messages sent in the game channel
        if(message.channel !== this.msg.channel) return
        
        // leader commands
        if(message.author.id == this.gameMaster.id) {
            // add command
            if(message.content.startsWith(`${options.prefix}add`)) {
                // check if the player count will stay within the min and max
                // add player to this.players
            }

            // kick command
            if(message.content.startsWith(`${options.prefix}kick`)) {
                // check if the player count will stay within the min and max
                // remove player from this.players
            }
        } else {
            // leave command
            if(message.content.startsWith(`${options.prefix}leave`)) {
                // check if the player count will stay within the min and max
                // remove player from this.players
            }
        }
    }

    /**
     * Stop all collectors and reset collector list.
     * 
     * @param {Array<Discord.Collector>} List of collectors
     */
    async clearCollectors(collectors) {
        await collectors.forEach(collector => {
            collector.stop('Force stopped.')
        })
        collectors = []
    }
    

    /**
     * End a game. This will be called when a player wins or the game is force stopped.
     *
     * @param {object} winner
     */
    end(winner) {
        // Send a message in the game channel (this.msg.channel) that the game is over.
        this.clearCollectors(this.collectors)
        // Remove all event listeners created during this game.
        this.msg.channel.gamePlaying = false
        this.msg.channel.game = undefined
    }

    /**
     * Force ends a game. This will be called by the end command.
     */
    forceStop() {
        this.ending = true
        this.end()
    }

}

// static fields
module.exports.id = 'myg' // a 3-4 letter identifier for the game that people will use to start a game
module.exports.gameName = 'My Game' // friendly name for display purposes
module.exports.playerCount = {
    min: 2, // minimum required player count
    max: 10 // maximum required player count
}
module.exports.genre = 'Card' // options are Card, Party, Board, Arcade, Tabletop, etc.
module.exports.about = 'A fun game about world domination.' // a one-sentence summary of the game
module.exports.rules = 'Blah blah blah rules rules rules.' // explanation about how to play
```

## 10. Important notes:

* Always use `options.prefix` whenever you need to have a command prefix in your code.
* Ending a game should stop all commands and processes. Check `this.ending` on all event handlers before executing any code. If the game is ending, `return` the function.