// Define the rewards for each level
export const REWARD_TYPES = Object.freeze({
    Credits: 'credits',
    Gold: 'gold',
    RandomItem: 'random',
    Item: 'item'
})

const { Credits, Gold, RandomItem, Item } = REWARD_TYPES

export const XP_LEVELS = Object.freeze(
    Object.values({
        '1': 1000,
        '2': 2000,
        '3': 3000,
        '4': 4000,
        '5': 5000,
        '6': 6000,
        '7': 7000,
        '8': 8000,
        '9': 9000,
        '10': 10000,
        '11': 11500,
        '12': 13000,
        '13': 14500,
        '14': 16000,
        '15': 17500,
        '16': 19000,
        '17': 20500,
        '18': 22000,
        '19': 23500,
        '20': 25000,
        '21': 26500,
        '22': 28000,
        '23': 30000,
        '24': 32000,
        '25': 34000,
        '26': 36000,
        '27': 38000,
        '28': 40000,
        '29': 42000,
        '30': 44000,
        '31': 46000,
        '32': 48000,
        '33': 50500,
        '34': 53000,
        '35': 55500,
        '36': 58000,
        '37': 60500,
        '38': 63000,
        '39': 65500,
        '40': 68500,
        '41': 71500,
        '42': 74500,
        '43': 77500,
        '44': 80500,
        '45': 83500,
        '46': 87000,
        '47': 90500,
        '48': 94000,
        '49': 97500,
        '50': 101000
    })
)

// Totals should add up to
export const LEVEL_REWARDS = Object.freeze(
    Object.values({
        "1": {
            "type": Credits,
            "premium": false,
            "value": 100
        },
        "2": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "3": {
            "type": Gold,
            "premium": true,
            "value": 1
        },
        "4": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "5": {
            "type": Credits,
            "premium": false,
            "value": 100
        },
        "6": {
            "type": RandomItem,
            "premium": true,
            "value": "common"
        },
        "7": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "8": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "9": {
            "type": Gold,
            "premium": true,
            "value": 1
        },
        "10": {
            "type": Credits,
            "premium": false,
            "value": 100
        },
        "11": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "12": {
            "type": RandomItem,
            "premium": true,
            "value": "rare"
        },
        "13": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "14": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "15": {
            "type": Gold,
            "premium": false,
            "value": 1
        },
        "16": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "17": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "18": {
            "type": RandomItem,
            "premium": true,
            "value": "rare"
        },
        "19": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "20": {
            "type": Credits,
            "premium": false,
            "value": 100
        },
        "21": {
            "type": Gold,
            "premium": true,
            "value": 1
        },
        "22": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "23": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "24": {
            "type": RandomItem,
            "premium": true,
            "value": "rare"
        },
        "25": {
            "type": Credits,
            "premium": false,
            "value": 100
        },
        "26": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "27": {
            "type": Gold,
            "premium": true,
            "value": 1
        },
        "28": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "29": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "30": {
            "type": RandomItem,
            "premium": false,
            "value": "epic"
        },
        "31": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "32": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "33": {
            "type": Gold,
            "premium": true,
            "value": 1
        },
        "34": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "35": {
            "type": Credits,
            "premium": false,
            "value": 100
        },
        "36": {
            "type": RandomItem,
            "premium": true,
            "value": "epic"
        },
        "37": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "38": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "39": {
            "type": Gold,
            "premium": true,
            "value": 1
        },
        "40": {
            "type": Credits,
            "premium": false,
            "value": 100
        },
        "41": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "42": {
            "type": RandomItem,
            "premium": true,
            "value": "legendary"
        },
        "43": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "44": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "45": {
            "type": Gold,
            "premium": false,
            "value": 1
        },
        "46": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "47": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "48": {
            "type": Credits,
            "premium": true,
            "value": 100
        },
        "49": {
            "type": RandomItem,
            "premium": false,
            "value": "epic"
        },
        "50": {
            "type": Item,
            "premium": true,
            "value": "mythical"
        }
    })
)

// Getter function to retrieve the reward for a specific level
export function getReward(level) {
  return rewards[level];
}
