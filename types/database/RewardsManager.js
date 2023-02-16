class RewardsManager {
    constructor() {
        this.XP_LEVELS = Object.freeze([1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11500, 13000, 14500, 16000, 17500, 19000, 20500, 22000, 23500, 25000, 26500, 28000, 30000, 32000, 34000, 36000, 38000, 40000, 42000, 44000, 46000, 48000, 50500, 53000, 55500, 58000, 60500, 63000, 65500, 68500, 71500, 74500, 77500, 80500, 83500, 87000, 90500, 94000, 97500, 101000])
    }
    
    /**
     * 
     * @param {number} xp amount of XP user has
     * @returns {number} level
     */
    calculateLevel(xp) {
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
}

export default RewardsManager;