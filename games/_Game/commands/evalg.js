import GameCommand from '../../../types/command/GameCommand.js'

import { Util } from 'discord.js'
import util from 'util'
import { GAMEBOT_PERMISSIONS } from '../../../config/types.js'
import logger from 'gamebot/logger'

import Discord from 'discord.js-light'
const { Constants } = Discord

let responsify = (response, msg, completed='+ eval completed +') => {
    response = util.inspect(response) 
    response = Util.splitMessage(response, {maxLength: 1600})
    response.forEach((res, index, arr) => {
        const isFirst = index === 0
        const isLast = index === arr.length - 1
        const message = `${isFirst ? '**Response**' : ''}\`\`\`js\n${res}\`\`\`${isLast ? `\`\`\`diff\n${completed}\`\`\`\nResponse Time: \`${(Date.now()-msg.createdTimestamp)}ms\`\nType: \`${typeof res}\``
            : ''}`
        msg.channel.send(message)
    })
}

export default new GameCommand({
  name: 'evalg',
  usage: 'evalg',
  aliases: ['evg'],
  description: 'Test code',
  category: 'dev',
  permissions: [GAMEBOT_PERMISSIONS.OWNER],
  dmCommand: false,
  args: [{
    name: 'code',
    description: 'The code to test',
    required: true,
    type: Constants.ApplicationCommandOptionTypes.STRING,
  }],
  run: async (msg, args, game) => {
    let response
    try {
        response = await eval('(async ()=>{'+args.join(' ')+'})()')
        responsify(response, msg)
    } catch (err) {
        logger.error(err)
        responsify(err, msg, '- eval failed -')
    }
  }
})