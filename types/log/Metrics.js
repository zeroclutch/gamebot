import Mixpanel from 'mixpanel'
import StatsD from 'hot-shots'
const dogstatsd = new StatsD();

/**
 * Extensible library for collection of usage statistics and anonymous user data.
 * @class
 */
export default class Metrics {
    constructor() {
        if(process.env.MIXPANEL_TOKEN) {
            this.logger = Mixpanel.init(process.env.MIXPANEL_TOKEN, {
                protocol: 'https'
            })
        } else {
            this.logger = {
                track: () => false
            }
        }
    }

    log(event, data) {
        this.logger.track(event, data)
    }
}