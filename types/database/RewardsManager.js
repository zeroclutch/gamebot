import achievements, { CustomCategories } from "../../config/achievements.js";
import Game from "../../games/_Game/main.js";

class RewardsManager {
    constructor(client) {
        this.achievements = Object.freeze(
            new Map(achievements)
        )

        this.constants = Object.freeze({
            MINIMUM_GAME_LENGTH: 30000, // in milliseconds
            XP_PER_SECOND: 1,
            XP_WIN_MULTIPLIER: 1.5
        })

        this.client = client
    }
    
    /**
     * @param {number} xp amount of XP user has
     * @returns {number} level
     */
    calculateLevel(xp) {
        if(!isFinite(xp)) return -1;

        // Binary search to find lowest level with experience <= xp
        let lo = 0;
        let hi = this.XP_LEVELS.length - 1;

        while(lo <= hi) {
            let mid = lo + Math.floor((hi - lo) / 2)
            let currLevelXP = this.XP_LEVELS[mid];

            if (currLevelXP > xp) {
                hi = mid - 1;
            }
            else if (currLevelXP < xp) {
                lo = mid + 1
            }
            else {
                return mid + 1;
            }
        }
        // As hi moves left if a level's XP is too large, hi is the minimum level marker.
        // + 1 for starting at level 1
        return hi + 1; 
    }

    /**
     * Gets the amount of XP a player earned in a game.
     * @param {Game} game The game that was played
     * @param {object} player The player object
     * @returns {number} XP earned
     */
    getXP(game, player) {
        const { MINIMUM_GAME_LENGTH, XP_PER_SECOND, XP_WIN_MULTIPLIER } = this.constants;

        let bonus = XP_PER_SECOND
        if(game.winners.includes(player.id)) {
            bonus = XP_PER_SECOND * XP_WIN_MULTIPLIER
        }

        // XP is awarded based on duration and win status
        return Math.floor(
            Math.max((game.duration - MINIMUM_GAME_LENGTH) / 1000 * bonus, 0)
        );
    }

    /**
     * Awards the achievements to the database and returns a report
     * of the changes made.
     * @param {Game} game The game that was played
     */
    async awardAchievements(game) {
        let changes = []

        // TODO: Skip achievements if game ends unexpectedly


        // Iterate through players
        for(let [id, player] of game.players) {
            // Award achievements
            const change = {
                id,
                achievements: []
            }

            // Get user from database
            let user = await this.client.dbClient.fetchDBInfo(id);
            console.log(id)

            // Establish user properties if they don't exist
            if(!user.achievements) user.achievements = []

            // Check if user completed any achievements
            for(let [id, achievement] of this.achievements) {
                console.log(id, achievement.validate)

                // Skip if achievement is malformed validate function
                if(!achievement?.validate) throw new Error(`Achievement ${id} is missing a validate function.`)

                // Skip if user already has achievement
                if(user.achievements.includes(id)) continue

                // Skip if achievement is not for this game mode
                const validCategories = [CustomCategories.General, game.metadata.id]
                if(!validCategories.includes(achievement.category)) continue

                if(achievement.validate({ game, player, user })) {
                    user.achievements.push(id)
                    change.achievements.push(achievement)
                }
            }

            // Update user in database
            const users = this.client.dbClient.database.collection('users')
            await users.updateOne(
                { userID: id },
                {
                    $inc: {
                        [`stats.${game.metadata.id}.games`]: 1,
                        [`stats.${game.metadata.id}.wins`]: game.winners.find(p => p.user.id === id) ? 1 : 0
                    },
                }
            )

            // Award XP
            const { xp, level } = await this.client.dbClient.updateXP(
                id,
                this.getXP(game, player)
            );

            // Award achievements
            if(change.achievements.length > 0) {
                this.client.dbClient.updateAchievements(
                    id,
                    change.achievements
                )
            }

            // Store changes
            change.xp = xp - user.xp;
            change.level = level - user.level;

            changes.push({ user, change })
        }
        return changes
    }
}

export default RewardsManager;