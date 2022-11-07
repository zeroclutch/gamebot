import fs from 'node:fs'
import path from 'node:path'

let __dirname = path.dirname(new URL(import.meta.url).pathname) // Get the directory name of the current file

// Read all the games from the games folder
export const games = fs.readdirSync(decodeURIComponent(path.join(__dirname, '..', '..', 'games'))).filter(
  game => (game !== '.DS_Store' && !game.startsWith('_'))
)

// Read metadata from each game
export const choices = (() => games.map(async game => {
    const { default: metadata } = await import(`../../games/${game}/metadata.js`)

    return {
      name: metadata.name,
      value: metadata.id,
    }
}))();