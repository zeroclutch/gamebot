import options from './../../config/options.js'
const DAILY_REWARDS = [
    { credits: 50,  gold: 0 },
    { credits: 100, gold: 0 }, 
    { credits: 200, gold: 0 }, // Day 0 Median
    { credits: 250, gold: 0 }, // Day 1 Median
    { credits: 300, gold: 0 }, // Day 2 Median
    { credits: 350, gold: 0 }, // Day 3 Median
    { credits: 400, gold: 0 }, // Day 4 Median
    { credits: 420, gold: 0 }, // Day 5 Median
    { credits: 450, gold: 0 }, // Day 6 Median
    { credits: 500, gold: 0 }, // Day 7+ Median
    { credits: 600, gold: 0 },
    { credits: 0,   gold: 1 },
    { credits: 1000, gold: 0 },
    { credits: 1500, gold: 0 },
    { credits: 0,   gold: 5 },
]

// Box-Muller Transform
// Courtesy of https://stackoverflow.com/a/36481059
function randomNormal() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

// Limits a value to within a range
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
};

function getReward(streak) {
    streak = Math.min(streak, 7) + 2
    let index = Math.round(randomNormal() + streak)
    return DAILY_REWARDS[clamp(index, 0, DAILY_REWARDS.length)]
}

const HOUR_LENGTH = (60 * 60 * 1000)
const RESET_LENGTH = (12 * HOUR_LENGTH)
const DAY_LENGTH = (24 * HOUR_LENGTH)

import BotCommand from '../../types/command/BotCommand.js'
export default new BotCommand({
    name: 'daily',
        aliases: ['claim', 'vote'],
    description: 'Claim today\'s credits for voting on the bot.',
    category: 'economy',
    permissions: [],
    dmCommand: true,
    args: [],
    run: async function(msg, args) {
        const collection = msg.client.database.collection('users')
        const characters = ['<:gamebot_g:810656510995595304>','<:gamebot_a:810656545725349928>','<:gamebot_m:810656506273071125>','<:gamebot_e:810656515316121630>','<:gamebot_b:810656509666787390>','<:gamebot_o:810656516507566150>','<:gamebot_t:810656512154140732>']
        msg.author.fetchDBInfo().then(async info => {
            const voteStreak = streak => `**${streak} day streak!**\n${characters.slice(0, streak).join('')}${'⬜'.repeat(Math.max(7 - streak, 0))}`

            // check if user can claim credits
            // daily hasn't been claimed and check if lastVoted was in last 12 hours
            if (info.lastClaim < Date.now() - RESET_LENGTH) {
                // tell them to vote on top.gg and vote, then type daily. Have brief explanation of vote streak.
                const msExpire = info.lastClaim + DAY_LENGTH + RESET_LENGTH - Date.now()
                const hoursExpire = Math.floor(msExpire / HOUR_LENGTH)
                const minutesExpire = Math.round((msExpire / HOUR_LENGTH- hoursExpire) * 60)

                
                // if streak has expired, reset it.
                if(msExpire < 0) {
                    info.voteStreak = 0
                    await collection.updateOne(
                        { userID: msg.author.id },
                        { $set: { voteStreak: 0 } }
                    )
                }

                msg.reply({
                    embeds: [{
                        title: '**Vote for Gamebot on top.gg here!**',
                        url: 'https://top.gg/bot/620307267241377793/vote',
                        description: `Vote to receive credits each day! After clicking the link and voting, type \`${options.prefix}daily\` to claim your rewards. You can spend your balance by typing \`${options.prefix}shop\`.`,
                        fields: [{
                            name: 'Current vote streak',
                            value: voteStreak(info.voteStreak),
                            inline: true,
                        },{
                            name: 'Possible rewards',
                            value: `🔹50–1500${options.creditIcon}\n🔹1${options.goldIcon}+\n🔹Longer streaks have better rewards!`,
                            inline: true,
                        }],
                        color: options.colors.info,
                        footer: {
                            text: info.voteStreak > 0 ? `Your streak expires in ${hoursExpire} hours and ${minutesExpire} minutes.` : 'Extend your vote streak and get bonus rewards each day you vote!'
                        }
                    }]
                })
            } else if(!info.dailyClaimed) {
                // user may claim credits, daily not claimed and voted in last 24 hours
                let reward = getReward(info.voteStreak + 1)
                // credit rewards, and set dailyClaimed to true
                await collection.updateOne(
                    { userID: msg.author.id },
                    {
                        $set: { 
                            dailyClaimed: true
                        },
                        $inc: {
                            balance: reward.credits || 0, 
                            goldBalance: reward.gold || 0, 
                            voteStreak: 1
                        }
                    }
                )
                // display vote streak
                let rewardContent = `Daily reward claimed! - ${reward.credits || ''}${reward.credits ? options.creditIcon : ''}${reward.gold || ''}${reward.gold ? options.goldIcon : ''}`
                msg.reply({
                    embeds: [{
                        title: rewardContent,
                        description: `Thank you for voting on Gamebot! You can vote again in about 12 hours.`,
                        fields: [{
                            name: 'Current vote streak',
                            value: voteStreak(info.voteStreak + 1)
                        }],
                        color: options.colors.economy,
                        footer: {
                            text: `Extend your vote streak and get bonus rewards each day you vote!`
                        }
                    }]
                })

                if(info.firstVote) {
                    await collection.updateOne(
                        { userID: msg.author.id },
                        { $inc: { balance: 1000 } })
                    msg.channel.send({
                        embeds: [{
                            title: `First-timer bonus`,
                            description: `You get an extra 1000${options.creditIcon} for your first vote! Buy yourself something nice [in our shop](${process.env.BASE_URL}/shop).`,
                            color: options.colors.economy,
                            footer: {
                                text: `Type &shop to see our shop at any time.`
                            }
                        }]
                    })
                }
                
            } else if (info.dailyClaimed) {
                // check how much longer it takes for another vote 
                const msWait = info.lastClaim + RESET_LENGTH - Date.now()
                const hoursWait = Math.floor(msWait / HOUR_LENGTH)
                const minutesWait = Math.round((msWait / HOUR_LENGTH - hoursWait) * 60)

                msg.reply({
                    embeds: [{
                        title: `You've already claimed your rewards!`,
                        description: `You have to wait ${hoursWait} hours and ${minutesWait} minutes before voting again.`,
                        fields: [{
                            name: 'Current vote streak',
                            value: voteStreak(info.voteStreak)
                        }],
                        color: options.colors.error,
                        footer: {
                            text: `Extend your vote streak and get bonus rewards each day you vote!`
                        }
                    }]
                })
            } else {    
                // this should never happen
                msg.reply({
                    title: 'Error!',
                    description: `There seems to be an issue with the ${msg.channel.prefix}daily command. Please submit a bug report in the [support server](${options.serverInvite}).`,
                    color: options.colors.error
                })
            }
        })
    }
  })