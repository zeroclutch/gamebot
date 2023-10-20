import achievements from "../../config/achievements.js";
import Game from "../../games/_Game/main.js";

class RewardsManager {
    constructor(client) {
        this.XP_LEVELS = Object.freeze([1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11500, 13000, 14500, 16000, 17500, 19000, 20500, 22000, 23500, 25000, 26500, 28000, 30000, 32000, 34000, 36000, 38000, 40000, 42000, 44000, 46000, 48000, 50500, 53000, 55500, 58000, 60500, 63000, 65500, 68500, 71500, 74500, 77500, 80500, 83500, 87000, 90500, 94000, 97500, 101000])
    
        this.achievements = Object.freeze(
            new Map(achievements)
        )

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
        let bonus = 1
        if(game.winners.includes(player.id)) {
            bonus = 1.5
        }
        return game.duration
        // return Math.max(Math.floor((game.duration - 30000) / 1000) * bonus, 0);
    }

    /**
     * Awards the achievements to the database and returns a report
     * of the changes made.
     * @param {Game} game The game that was played
     */
    async awardAchievements(game) {
        let changes = []
        for(let [id, player] of game.players) {
            // Award achievements
            const change = {
                id,
                xp: 0,
                level: 0,
                achievements: []
            }

            // Get user from database
            let user = await this.client.dbClient.fetchDBInfo(player.id);

            // Establish user properties if they don't exist
            if(!user.achievements) user.achievements = []
            if(!user.xp) user.xp = 0
            if(!user.level) user.level = 0

            // Check if user completed any achievements
            for(let [id, achievement] of this.achievements) {
                console.log(id, achievement)

                // Skip if achievement is malformed validate function
                if(!achievement?.validate) continue

                // Skip if user already has achievement
                if(user.achievements.includes(id)) continue

                // Skip if achievement is not for this game mode
                if(achievement.category !== game.metadata.id) continue

                if(achievement.validate({ game, player, user })) {
                    user.achievements.push(id)
                    change.achievements.push(achievement)
                }
            }

            // Award XP
            let oldLevel = user.level;
            let xp = this.getXP(game, player);
            user.xp += xp;
            user.level = this.calculateLevel(user.xp);

            // Store changes
            change.xp = xp;
            change.level = user.level - oldLevel;

            // Update user in database
            this.client.dbClient.updateUserInfo(user);

            changes.push({ user, change })
        }
        return changes
    }
}

export default RewardsManager;