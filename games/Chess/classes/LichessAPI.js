import request from 'axios'

/**
 * An API wrapper that allows for basic interfacing with the Lichess API.
 * @class
 */
const LichessAPI = class LichessAPI {
    constructor() {
    }

    async importGame(PGN) {
        return await request({
            method: 'post',
            url: 'https://lichess.org/api/import',
            data: PGN,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    }
}

export default LichessAPI