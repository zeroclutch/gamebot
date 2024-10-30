import { MongoClient } from 'mongodb';
import logger from 'gamebot/logger'

// The connection URI
const uri = process.env.MONGO_DB_URI

// The MongoClient this belongs to
const client = new MongoClient(uri, options)

function convertSeasonIdToName(id) {
    // Convert the season ID to a name
    // Starting from 0 = Summer 2024    
    const year = 2024 + Math.floor((id + 1) / 4)
    const season = id % 4
    switch(season) {
        case 0:
            return `Summer ${year}`
        case 1:
            return `Fall ${year}`
        case 2:
            return `Winter ${year}`
        case 3:
            return `Spring ${year}`
    }
}

function convertDateToSeasonId(date) {
    // Convert a date to a season ID
    // Starting from 0 = Summer 2024
    const year = date.getFullYear()
    const month = date.getMonth()
    return (year - 2024) * 4 + Math.floor(month / 3) - 3
}

// Update the season idempotently
export async function updateSeason() {
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB_NAME);
        const status = db.collection('status');
        const season = await status.findOne({ type: 'season' });
        const currentDate = new Date();
        const currentSeasonId = convertDateToSeasonId(currentDate);
        if (!season || season.id !== currentSeasonId) {
            await status.updateOne(
                { type: 'season' },
                {
                    $set: {
                        id: currentSeasonId,
                        name: `Season ${convertSeasonIdToName(currentSeasonId)}`,
                    },
                }
            );
        }
    } catch (err) {
        logger.error(err);
    } finally {
        await client.close();
    }
}

// Save and reset user stats
// Move current user stats to an array of previous user stats
export async function resetUserStats() {
    try {
        await client.connect()
        const db = client.db(process.env.MONGO_DB_NAME)
        const users = db.collection('users')

        const status = db.collection('status')
        const season = await status.findOne({ type: 'season' })

        // Move current stats to history object and add current stats to 
        users.updateMany({
            [`history.stats.${season.id}`]: { $exists: false }
        }, {
            $rename: {
                stats: `history.stats.${season.id}`,
            },
            $set: {
                stats: {}
            }
        })
    } catch(err) {
        logger.error(err)
    } finally {
        await client.close()
    }
}

// Get the current season
export async function getSeason() {
  try {
    await client.connect()
    const db = client.db('gamebot')
    const seasons = db.collection('status')
    const season = await seasons.findOne({ type: 'season' })
    return season?.name
  } catch (err) {
    logger.error(err)
  } finally {
    await client.close()
  }
}

// 
export async function getSeasonId() {
  try {
    await client.connect()
    const db = client.db('gamebot')
    const seasons = db.collection('status')
    const season = await seasons.findOne({ type: 'season' })
    return season?.id
  } catch (err) {
    logger.error(err)
  } finally {
    await client.close()
  }
}