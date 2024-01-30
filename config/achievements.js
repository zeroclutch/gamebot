import { choices } from "../types/util/games"

const Rarities = {
    Common: 'common',
    Rare: 'rare',
    Epic: 'epic',
    Legendary: 'legendary',
    Mythical: 'mythical',
}

const CUSTOM_CATEGORIES = {
    General: 'gen',
}

// Load games and add custom categories to categories enum
const Categories = Object.assign(...[
    CUSTOM_CATEGORIES,
].concat(choices().map(
    game => ({
        [game.name]: game.value,
    })
)))

/**
 * Helper functions
 */
const players = ({ game }) => game.players.size
const pangrams = ({ player }) => player.words.filter(word => word.length === 7)

const validateDefault = (category) => {
    switch(category) {
        case Categories['Anagrams']:
            return ({ game }) => game.options['Custom Word'] === 'none' && players({ game }) >= 2
        case Categories['Connect 4']:
            return ({ game }) => game.options['Board Width'] == 7 &&  game.options['Board Height'] == 6
        default:
            return () => true
    }
}

/**
 * @typedef {Object} AchievementValidateOptions
 * @prop {Game} game the game 
 * @prop {Player} player the player data
 * @prop {User} user the user's database
 * @returns {boolean} whether the achievement is complete
 */

/**
 * @name AchievementValidate
 * @function
 * @param {AchievementValidateOptions} arg The game, player, and database user
 * @returns {boolean} whether the achievement is complete
 */

class AchievementBuilder {
    constructor(name) {
        /**
         * Unique name of the achievement
         * @type {string}
         */
        this.name = name
        
        /**
         * Description of the achievement
         * @type {string}
         */
        this.description

        /**
         * Category of the achievement
         * @type {string}
         */
        this.category

        /**
         * Rarity of the achievement
         * @type {string}
         */
        this.rarity

        /**
         * @type {function (AchievementValidateOptions): boolean}
         */
        this.validate
    }

    get emoji() {
        switch(this.rarity) {
            case Rarities.Common:
                return '🟢'
            case Rarities.Rare:
                return '🟡'
            case Rarities.Epic:
                return '🔵'
            case Rarities.Legendary:
                return '🔴'
            case Rarities.Mythical:
                return '🟣'
        }
    }

    setCategory(category) {
        this.category = category;
        return this;
    }

    setRarity(rarity) {
        this.rarity = rarity;
        return this;
    }

    setDescription(description) {
        this.description = description;
        return this;
    }

    /**
     * The method to validate the achievement
     * @param {AchievementValidate} validate The validation function for the achievement, returns true if the achievement is complete
     * @returns 
     */
    setValidate(validate) {
        this.validate = (...args) => validate(...args) && validateDefault(this.category)(...args)
        return this;
    }

    check() {
        if(!this.name) throw new Error(`Achievement name is not set`)
        if(!this.description) throw new Error(`Achievement description is not set for ${this.name}`)
        if(!this.category) throw new Error(`Achievement category is not set for ${this.name}`)
        if(!this.rarity) throw new Error(`Achievement rarity is not set for ${this.name}`)
        if(!this.validate) throw new Error(`Achievement validate function is not set for ${this.name}`)
    }

    toEntry() {
        this.check()

        return [this.name, {
            name: this.name,
            description: this.description,
            category: this.category,
            rarity: this.rarity,
            validate: this.validate,
        }]
    }
}

export default [
    /** Anagrams **/
    new AchievementBuilder('500 Club')
    .setDescription('Get 500 points')
    .setCategory(Categories['Anagrams'])
    .setRarity(Rarities.Common)
    .setValidate(
        ({ player }) => player.score >= 500
    )
    .toEntry(),

    new AchievementBuilder('1K Club')
    .setDescription('Get 1000 points')
    .setCategory(Categories['Anagrams'])
    .setRarity(Rarities.Rare)
    .setValidate(
        ({ player }) => player.score >= 1000
        )
        .toEntry(),

    new AchievementBuilder('2K Club')
        .setDescription('Get 2000 points')
        .setCategory(Categories['Anagrams'])
        .setRarity(Rarities.Epic)
        .setValidate(
            ({ player }) => player.score >= 2000
        )
        .toEntry(),

    new AchievementBuilder('4K Club')
        .setDescription('Get 4000 points')
        .setCategory(Categories['Anagrams'])
        .setRarity(Rarities.Legendary)
        .setValidate(
            ({ player }) => player.score >= 4000
        )
        .toEntry(),

    new AchievementBuilder('Akeelah')
        .setDescription('Get 6000 points')
        .setCategory(Categories['Anagrams'])
        .setRarity(Rarities.Mythical)
        .setValidate(
            ({ player }) => player.score >= 6000
        )
        .toEntry(),

    new AchievementBuilder('The Two-Time')
        .setDescription('Find two pangrams in a single game')
        .setCategory(Categories['Anagrams'])
        .setRarity(Rarities.Epic)
        .setValidate(
            ({ player }) => pangrams({ player }).length >= 2
        ).toEntry(),

    new AchievementBuilder('Unscrambler')
        .setDescription('Find a pangram')
        .setCategory(Categories['Anagrams'])
        .setRarity(Rarities.Common)
        .setValidate(
            ({ player }) => pangrams({ player }).length >= 1
        )
        .toEntry(),

    new AchievementBuilder('Wordsmith')
        .setDescription('Find 10 pangrams')
        .setCategory(Categories['Anagrams'])
        .setRarity(Rarities.Rare)
        .setValidate(
            ({ user }) => user?.stats?.pangrams >= 10
        ).toEntry(),

    new AchievementBuilder('Decoder')
        .setDescription('Find 50 pangrams')
        .setCategory(Categories['Anagrams'])
        .setRarity(Rarities.Epic)
        .setValidate(
            ({ user }) => user?.stats?.pangrams >= 50
        ).toEntry(),

    new AchievementBuilder('Shakespeare')
        .setDescription('Find 100 pangrams')
        .setCategory(Categories['Anagrams'])
        .setRarity(Rarities.Legendary)
        .setValidate(
            ({ user }) => user?.stats?.pangrams >= 100
        ).toEntry(),

    new AchievementBuilder('Cunning Linguist')
        .setDescription('Find 500 pangrams')
        .setCategory(Categories['Anagrams'])
        .setRarity(Rarities.Mythical)
        .setValidate(
            ({ user }) => user?.stats?.pangrams >= 500
        ).toEntry(),
    
    new AchievementBuilder('The Two-Time')
        .setDescription('Get 2 or more pangrams in a single game')
        .setCategory(Categories['Anagrams'])
        .setRarity(Rarities.Epic)
        .setValidate(
            ({ player }) => pangrams({ player }).length >= 2
        ).toEntry(),
    
    new AchievementBuilder('Party Night')
        .setDescription('Play a Cards Against Humanity game that ends with 5 or more players')
        .setCategory(Categories['Cards Against Humanity'])
        .setRarity(Rarities.Rare)
        .setValidate(
            ({ game }) => game.players.size >= 5
        ).toEntry(),
    
    // TODO FIXME ADD INFRA FOR THIS
    // new AchievementBuilder('Fancy Pants')
    //     .setDescription('Purchase your first card back')
    //     .setCategory(Categories['Cards Against Humanity'])
    //     .setRarity(Rarities.Common)
    //     .setValidate(
    //         ({ user }) => user?.stats?.cardBacksPurchased >= 1
    //     ).toEntry(),
    
    // new AchievementBuilder('Box Set')
    //     .setDescription('Purchase your first card pack')
    //     .setCategory(Categories['Cards Against Humanity'])
    //     .setRarity(Rarities.Common)
    //     .setValidate(
    //         ({ user }) => user?.stats?.cardPacksPurchased >= 1
    //     ).toEntry(),
    
    new AchievementBuilder('Aspiring Comic')
        .setDescription('Win a game of Cards Against Humanity')
        .setCategory(Categories['Cards Against Humanity'])
        .setRarity(Rarities.Common)
        .setValidate(
            ({ user }) => user?.stats?.cah?.wins >= 1
        ).toEntry(),    
    
    new AchievementBuilder('Certified Comedian')
        .setDescription('Win 10 games of Cards Against Humanity')
        .setCategory(Categories['Cards Against Humanity'])
        .setRarity(Rarities.Rare)
        .setValidate(
            ({ user }) => user?.stats?.cah?.wins >= 10
        ).toEntry(),
    
    new AchievementBuilder('Genuine Jokester')
        .setDescription('Win 50 games of Cards Against Humanity')
        .setCategory(Categories['Cards Against Humanity'])
        .setRarity(Rarities.Epic)
        .setValidate(
            ({ user }) => user?.stats?.cah?.wins >= 50
        ).toEntry(),
    
    new AchievementBuilder('A Bigger Blacker Winner')
        .setDescription('Win 100 games of Cards Against Humanity')
        .setCategory(Categories['Cards Against Humanity'])
        .setRarity(Rarities.Legendary)
        .setValidate(
            ({ user }) => user?.stats?.cah?.wins >= 100
        ).toEntry(),
    
    new AchievementBuilder('Misanthrope')
        .setDescription('Win 500 games of Cards Against Humanity')
        .setCategory(Categories['Cards Against Humanity'])
        .setRarity(Rarities.Mythical)
        .setValidate(
            ({ user }) => user?.stats?.cah?.wins >= 500
        ).toEntry(),

    new AchievementBuilder('Nail Biter')
        .setDescription('Achieve a win with 2 or fewer pieces remaining')
        .setCategory(Categories['Chess'])
        .setRarity(Rarities.Rare)
        .setValidate(
            ({ game, player }) => game.winners.has(player.side) && game.status.board.squares.filter(({ piece }) => piece.side === player.side).length <= 2 && game.status.isCheckmate
        ).toEntry(),

    new AchievementBuilder('Sliced and Diced')
        .setDescription('Checkmate your opponent in 10 moves or fewer')
        .setCategory(Categories['Chess'])
        .setRarity(Rarities.Rare)
        .setValidate(
            ({ game, player }) => game.winners.has(player.side) && game.status.board.squares.filter(({ piece }) => piece.side === player.side).length <= 2 && game.status.isCheckmate
        ).toEntry(),

    new AchievementBuilder('XQC Gambit')
        .setDescription('Checkmate your opponent in 6 moves or fewer')
        .setCategory(Categories['Chess'])
        .setRarity(Rarities.Epic)
        .setValidate(
            ({ game, player }) => game.winners.has(player.side) && game.status.board.squares.filter(({ piece }) => piece.side === player.side).length <= 2 && game.status.isCheckmate
        ).toEntry(),

    new AchievementBuilder('Overachiever')
        .setDescription('Connect five in a row')
        .setCategory(Categories['Connect 4'])
        .setRarity(Rarities.Epic)
        .setValidate(
            ({ game, player }) => player.user.id === game.getWinner(5) && players({ game }) >= 2
        ).toEntry(),

    new AchievementBuilder('Noob')
        .setDescription('Play a game')
        .setCategory(Categories['General'])
        .setRarity(Rarities.Common)
        .setValidate(
            () => 1
        ).toEntry(),

]