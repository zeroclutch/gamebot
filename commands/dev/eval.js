import BotCommand from '../../types/command/BotCommand.js'
import logger from 'gamebot/logger'

import options from '../../config/options.js'

import Discord from '../../discord_mod.js' 
const { Util } = Discord
import { inspect } from 'util'
import { GAMEBOT_PERMISSIONS } from '../../config/types.js'

let responsify = (response, msg, completed='+ eval completed +') => {
    response = inspect(response) 
    response = Util.splitMessage(response, {maxLength: 1600})
    response.forEach((res, index, arr) => {
        const isFirst = index === 0
        const isLast = index === arr.length - 1
        const content = `${isFirst ? '**Response**' : ''}\`\`\`js\n${res}\`\`\`${isLast ? `\`\`\`diff\n${completed}\`\`\`\nResponse Time: \`${(Date.now()-msg.createdTimestamp)}ms\`\nType: \`${typeof res}\``
            : ''}`
        msg.channel.send({
            content,
        })
    })
}

export default new BotCommand({
  name: 'eval',
  aliases: ['ev'],
  description: 'Test code',
  category: 'dev',
  permissions: [GAMEBOT_PERMISSIONS.OWNER],
  dmCommand: true,
  args: [],
  run: async (msg, args) => {
    let response
    try {
        response = await eval('(async ()=>{'+args.join(' ')+'})()')
        responsify(response, msg)
    } catch (err) {
        //logger.error(err)
        responsify(err, msg, '- eval failed -')
    }
}
})