import { Writable } from 'stream';
import axios from 'axios'
import options from '../../config/options.js';

const levels = {
    '10': 'trace',
    '20': 'debug',
    '30': 'info',
    '40': 'warn',
    '50': 'error',
    '60': 'fatal'
}

class DiscordWebhook extends Writable {
    constructor(...args) {
        super(...args)
    }

    write(data) {
        try {
            let json = JSON.parse(data)
            let msg = json.msg
            delete json.msg
            axios.post(process.env.LOGGING_WEBHOOK, {
                embeds: [{
                    title: `Log [${levels[json.level].toUpperCase()}]`,
                    description: `
**Message:**
\`\`\`yaml
${msg}
\`\`\`
**Metadata:**
\`\`\`json
${JSON.stringify(json)}
\`\`\`
                    `,
                    color: json.level < 50 ? options.colors.info : options.colors.error, 
                    footer: {
                        text: `Process ${json.pid}  •  Hostname ${json.hostname}`,
                    },
                    timestamp: new Date(json.time).toISOString()
                }]
            }).catch(console.error)
        } catch(err) {
            console.error(err)
        }
        super.write(...args)
    }
}

export default function(target) {
    return new DiscordWebhook(target)
}