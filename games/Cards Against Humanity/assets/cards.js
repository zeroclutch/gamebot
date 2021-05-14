import Discord from './../../../discord_mod.js'
import fs from 'fs'

// Get card sets from filesystem
// Collection<Object metadata, Array.<String card> cards>
let _blackCards = new Discord.Collection()

// Collection<Object metadata, Array.<String card> cards>
let _whiteCards = new Discord.Collection()

// get card sets
const cardFolder = fs.readdirSync('./gameData/CardsAgainstHumanity')

// add cards to list
for (const cardSet of cardFolder) {
  //search through each folder
  if(!cardSet.includes('.DS_Store')) {
    let metadata = JSON.parse(fs.readFileSync(`./gameData/CardsAgainstHumanity/${cardSet}/metadata.json`, 'utf8'))
    let blackCardList = fs.readFileSync(`./gameData/CardsAgainstHumanity/${cardSet}/black.md.txt`, 'utf8').split('\n')
    let whiteCardList = fs.readFileSync(`./gameData/CardsAgainstHumanity/${cardSet}/white.md.txt`, 'utf8').split('\n')
    _blackCards.set(metadata, blackCardList)
    _whiteCards.set(metadata, whiteCardList)
  }
}

export const blackCards = _blackCards
export const whiteCards = _whiteCards
