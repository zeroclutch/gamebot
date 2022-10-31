import BotCommand from '../../types/command/BotCommand.js'
import logger from 'gamebot/logger'

import Discord from '../../discord_mod.js' 
const { Util } = Discord
import util from 'util'

let responsify = (response, msg, completed='+ eval completed +') => {
    response = util.inspect(response) 
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
  usage: 'eval',
  aliases: ['ev'],
  description: 'Test code',
  category: 'dev',
  permissions: ["GOD"],
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