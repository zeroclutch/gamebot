
import CardsAgainstHumanity from '../../Cards Against Humanity/classes/CardsAgainstHumanity.js'
import metadata from '../metadata.js'

const CARD_PACKS = {
    'glow_pack': 'family-glow',
    'kids_pack': 'family-kids',
}

export default class CardsAgainstHumanityFamily extends CardsAgainstHumanity {
    constructor(...args) {
        super(...args)
        this.metadata = metadata
        this.settings.sets = ['family']

        this.CARD_PACKS = CARD_PACKS
        this.defaultFriendlySetList = ['**Family** *(536 cards)*']

        this.mode = 'FAMILY'
    }
}