const RARITIES = {
    COMMON: 'common',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary',
    MYTHICAL: 'mythical',
}

export default [
    ['1K Club', {
        name: '1K Club',
        description: "Get 1000 points",
        category: 'ana',
        rarity: RARITIES.COMMON,

        /**
         * 
         * @param {Game} game the game 
         * @param {Player} player 
         * @returns {boolean} whether the achievement is complete
         */
        validate(_game, player) {
            return player.score >= 1000;
        }
    }],
]