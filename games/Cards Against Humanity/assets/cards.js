const Discord = require('./../../../discord_mod')
const fs = require('fs')

// Get card sets from filesystem
// Collection<Object metadata, Array.<String card> cards>
var blackCards = new Discord.Collection()

// Collection<Object metadata, Array.<String card> cards>
var whiteCards = new Discord.Collection()

// get card sets
const cardFolder = fs.readdirSync('./gameData/CardsAgainstHumanity')

// add cards to list
for (const cardSet of cardFolder) {
  //search through each folder
  if(!cardSet.includes('.DS_Store')) {
    var metadata = JSON.parse(fs.readFileSync(`./gameData/CardsAgainstHumanity/${cardSet}/metadata.json`, 'utf8'))
    var blackCardList = fs.readFileSync(`./gameData/CardsAgainstHumanity/${cardSet}/black.md.txt`, 'utf8').split('\n')
    var whiteCardList = fs.readFileSync(`./gameData/CardsAgainstHumanity/${cardSet}/white.md.txt`, 'utf8').split('\n')
    blackCards.set(metadata, blackCardList)
    whiteCards.set(metadata, whiteCardList)
  }
}

module.exports = { blackCards, whiteCards }