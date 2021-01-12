// Script to generate command list
import fs from 'fs'

const PATH = __dirname + '/../commands'

const commandFiles = fs.readdirSync(PATH);

let commands = []

// add commands to list
for (const commandFolder of commandFiles) {
  //search through each folder
  if(!commandFolder.includes('.DS_Store') && !commandFolder.includes('dev')) {
    const folder = fs.readdirSync(`${PATH}/${commandFolder}`)
    for(const file of folder) {
      if(file == '.DS_Store') continue
      const command = require(`${PATH}/${commandFolder}/${file}`)
      commands.push({
          name: command.name,
          description: command.description, 
          usage: '&' + command.usage,
          category: commandFolder
      })
    }
  }
}

let html = ''
commands.forEach(command => {
    html += '<tr>\n'
    Array.from(Object.keys(command)).forEach(key => {
        html += `\t<td>${command[key]}</td>\n`
    })
    html += '</tr>\n'
})

console.log(html)