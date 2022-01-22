This guide is intended to help get you started in the process of developing a game. It includes a list of required commands, methods, and fields. If you are interested in creating a game, you should have knowledge of JavaScript ES6 syntax.

Gamebot games should be playable by small groups and larger groups, simple to use for new players, and most importantly, fun! Games also should avoid taking too long—starting a game with Gamebot shouldn't have to be a scheduled activity or something that requires a lot of commitment for users.

## Complete the {@tutorial getting_started} tutorial 

Before starting, you should have your own version of Gamebot working and running on your local machine. See the {@tutorial getting_started} for information on how to do that.

## 2. Create a new folder in the *games* directory.

The title should be the name of the game in `UpperCamelCase`. This folder will be the base directory for the rest of this tutorial.

## 3. Create your metadata file.

A metadata file is a `json` file that contains the standard information about the game. This data will be used within the bot to access information about the game, and within the game class to access information about the game. In your current directory, create a file called `metadata.json` with the following content:
```json
{
    "id": "sal",
    "name": "Snakes and Ladders",
    "playerCount": {
        "min": 2,
        "max": 10
    },
    "genre": "Board",
    "about": "Be the first to finish in this topsy-turvy board game.",
    "rules": "Rules rules rules, blah blah blah!"
}
```
*Example metadata.json*

Customize this data as needed. Documentation about the game's metadata file {@link GameMetadata|can be found here}.

## 4. Create the game class and entrypoint files

Gamebot uses a module-based system, where games in the `/games` directory are exported to the bot. It also uses Javascript ES6 classes. Every time a player starts a new game, a new instance of that specific game is created. Once the game is over, that game object is left out for garbage collection. 

You will have to create 2 files here: the aforementioned game class, and the entry point for this game class.

First, create a file in your game's directory, called `main.js`. This will be the entry point.

Next, create a new directory called `/classes`. Within this directory, add a `.js` file with your game's name in `UpperCamelCase`. So, if your game is called "Snakes and Ladders", you would name the `.js` file `SnakesAndLadders.js`.

At this point, Gamebot's file tree should look something like this:
```
gamebot (root directory)
 |-games
 | |-SnakesAndLadders
 | | |-metadata.json
 | | |-main.js
 | | |-classes
 | | | |-SnakesAndLadders.js
 | |...
 |...
...
```
*Example File tree*

## 5. Configure the entry point

`main.js` is the file that is directly imported into the game, and will be instantiated whenever a player creates a new game. However, it won't contain any actual game logic. It is simply a wrapper for the actual game content. You should `require` your game class, and directly export it via `module.exports`. 

```js
module.exports = require('./classes/ExampleGame.js') 
```
*Example main.js*

There's your whole file! Now's the fun part.

## 6. Building your game

The `{@link Game}` class is the base class for all games, but is an [abstract class](https://en.wikipedia.org/wiki/Abstract_type) and should never be instantiated. When developing this game, you will extend the base Game class, and take advantage of its various capabilities.

First, `require` the necessary modules and create your class. Be sure to export it at the end!
```js
// Required files
const Game = require('../../Game')
const options = require('../../../config/options')
const metadata = require('../metadata.json')

/**
 * The base class for Snakes and Ladders games.
 * @class
 */
const SnakesAndLadders = class SnakesAndLadders extends Game {

}

module.exports = SnakesAndLadders
```

Within the class, you must create a constructor first. The constructor must:

1. Call the superclass constructor (`super(msg, settings)`).
2. Set the value of required (and optional) class properties. 

The Game class already gives you access to some properties that you will be able to access in your games. Here's a list of the important ones:

*  `this.players` A {@link https://discord.js.org/#/docs/main/11.5.1/class/Collection|Discord.Collection} of players that is updated as players join and leave the game.
*  `this.channel` The {@link https://discord.js.org/#/docs/main/11.5.1/class/TextChannel|Discord.TextChannel} the game is played in.
*  `this.options` After the initialization stage of the game, this property will be generated. It will have the player-configured options as an object. See {@link Game#configureOptions} for more details.

See {@link Game#Game} to see all the inherited properties. 


### Required properties: 
* `this.metadata` Set this to equal the `metadata.json` file that you required earlier.
* `this.gameOptions` This is an array of game options that the user will configure during the beginning of the game. See {@link Game#gameOptions} for detailed information.
* `this.defaultPlayer` This is what the default player structure should look like. Whenever a player is added to the game, the Game will add a player using this structure. You can initialize the primitive types like numbers, strings, and booleans normally. However, for arrays or objects, set the value as 'Array' or 'Object'
* `this.settings.isDmNeeded` Set this to true if you DM players during the game. Additional permissions are required, and they are handled by the `Game` class.

Let's see at what this looks like in the example:
```js
const Game = require('../../Game')
const options = require('../../../config/options')
const metadata = require('../metadata.json')

// ...
const SnakesAndLadders = class SnakesAndLadders extends Game {
    constructor(msg, settings) {
        super(msg, settings)

        this.metadata = metadata

        this.gameOptions = [
            {
                friendlyName: 'Game Mode',
                type: 'radio',
                default: 'Solo',
                choices: ['Team', 'Solo'],
                note: 'In team, players are matched up against each other in groups. In solo, it\'s everyone for themself!'
            }
        ]

        this.defaultPlayer = {
            points: 0,
            position: 'Array'
        }
    }
}
```

Next, you have to implement the required methods. You don't have to worry about the join phase or adding and removing players. The Game class will automatically handle all of that. The game class will also handle the user settings configuration. That really makes for 1 required method you need to implement, and 1 optional method.

### Adding methods:
Here, it's important to understand how your game class will run. This is the order in which methods are called.

1. The Game Constructor. {@link Game#Game}
2. **The {@link Game#init} method.** Every time a user types `&play`, the `init()` method of the `Game` class is called first. 
3. **The {@link Game#generateOptions} method.** This method allows for you, the developer, to dynamically generate and modify the `this.gameOptions` property. Since it's asynchronous, you can do operations that you normally wouldn't be able to do in the constructor.
4. **The {@link Game#configureOptions} method.** This allows the player to select and edit the options. After this method is completed, the player-configured options will be outputted to `this.options`.
5. **The {@link Game#play} method.** This is where you get fancy, and create the game logic.

You might have noticed two methods that stand out here: `this.generateOptions()` and `this.play()`. You must override these methods and add them to your game's class. Be sure to call `this.end()` when the game is over. Let's do that in our example.

```js
// ...
const SnakesAndLadders = class SnakesAndLadders extends Game {
    constructor(msg, settings) {
        // ...
    }

    async generateOptions () {
        // Get the message content from the pinned messages as an array
        let pinnedMessages = await this.channel.fetchPinnedMessages().tap(m => m.content).array()
        this.gameOptions.push({
            friendlyName: 'Favorite Pin',
            type: 'radio',
            default: pinnedMessages[0],
            choices: pinnedMessages,
            note: 'This is such an odd thing to do in a game, it\'s really only for example\'s sake.'
        })
    }

    play () {
        // This is called and the gameplay goes here.
        this.end()
    }

}
```

## 7. Customizing your game 

You now have the tools to build the game any way you want, adding more methods (that don't happen to override existing Game methods) and classes. Look to existing games for examples on how to add features.

```js
// ...
const SnakesAndLadders = class SnakesAndLadders extends Game {
    constructor(msg, settings) {
        // ...
    }

    async generateOptions () {
        // ...
    }

    async play () {
        if(this.options['Game Mode'] == 'Solo') {
            await this.playSolo()
        } else if (this.options['Game Mode'] == 'Team') {
            await this.playTeam()
        }
    }

    async playSolo() { 
        this.channel.sendEmbed('Game has started in solo mode!')
        // ...
    }

    async playTeam() {
        this.channel.sendEmbed('Game has started in team mode!')
        // ...
    }
}
```
----
## Important notes:
* Always use `options.prefix` whenever you need to have a command prefix in your code.
* Ending a game should stop all commands and processes. Check `this.ending` on all event handlers before executing any code. If the game is ending, `return` the function.