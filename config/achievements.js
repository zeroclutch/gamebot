const RARITIES = {
    COMMON: 'common',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary',
    MYTHICAL: 'mythical',
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
            case RARITIES.COMMON:
                return '🟢'
            case RARITIES.RARE:
                return '🟡'
            case RARITIES.EPIC:
                return '🔵'
            case RARITIES.LEGENDARY:
                return '🔴'
            case RARITIES.MYTHICAL:
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
        this.validate = validate;
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

/**
 * Helper functions
 */
const pangrams = ({ player }) => player.words.filter(word => word.length === 7)

export default [
    /** Anagrams **/
    new AchievementBuilder('500 Club')
        .setDescription('Get 500 points')
        .setCategory('ana')
        .setRarity(RARITIES.COMMON)
        .setValidate(
            ({ player, game }) => player.score >= 500 && game.options['Custom Word'] === 'none'
        )
        .toEntry(),

    new AchievementBuilder('1K Club')
        .setDescription('Get 1000 points')
        .setCategory('ana')
        .setRarity(RARITIES.RARE)
        .setValidate(
            ({ player, game }) => player.score >= 1000 && game.options['Custom Word'] === 'none'
        )
        .toEntry(),

    new AchievementBuilder('2K Club')
        .setDescription('Get 2000 points')
        .setCategory('ana')
        .setRarity(RARITIES.EPIC)
        .setValidate(
            ({ player, game }) => player.score >= 2000 && game.options['Custom Word'] === 'none'
        )
        .toEntry(),

    new AchievementBuilder('4K Club')
        .setDescription('Get 4000 points')
        .setCategory('ana')
        .setRarity(RARITIES.LEGENDARY)
        .setValidate(
            ({ player, game }) => player.score >= 4000 && game.options['Custom Word'] === 'none'
        )
        .toEntry(),

    new AchievementBuilder('Akeelah')
        .setDescription('Get 6000 points')
        .setCategory('ana')
        .setRarity(RARITIES.MYTHICAL)
        .setValidate(
            ({ player, game }) => player.score >= 6000 && game.options['Custom Word'] === 'none'
        )
        .toEntry(),

    new AchievementBuilder('Unscrambler')
        .setDescription('Find a pangram')
        .setCategory('ana')
        .setRarity(RARITIES.COMMON)
        .setValidate(
            // !!! TODO FIXME I got this with a 6 letter word!
            ({ player, game }) => pangrams({ player }) && game.options['Custom Word'] === 'none'
        )
        .toEntry(),

    new AchievementBuilder('The Two-Time')
        .setDescription('Find two pangrams in a single game')
        .setCategory('ana')
        .setRarity(RARITIES.EPIC)
        .setValidate(
            ({ player, game }) => pangrams({ player }).length >= 2 && game.options['Custom Word'] === 'none'
        ).toEntry(),

    new AchievementBuilder('Wordsmith')
        .setDescription('Find 10 pangrams')
        .setCategory('ana')
        .setRarity(RARITIES.LEGENDARY)
        .setValidate(
            ({ user }) => user.stats.pangrams >= 10
        ).toEntry(),

    // new AchievementBuilder('Decoder'),

    // new AchievementBuilder('Shakespeare'),

    // new AchievementBuilder('Cunning Linguist'),

]