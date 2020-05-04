module.exports = class BlackCard {
    constructor(text) {
        this.cardText = text
        // get possible card responses based on blanks, minimum 1
        this.cardResponses =  Math.max(text.split(/\_/g).length - 1, 1)
        // if a number is specified, use that instead.
        if(text.charAt(0) == '[' && text.charAt(2) == ']') {
            this.cardResponses = parseInt(text.charAt(1))
            this.cardText = this.cardText.substring(3, text.length)
        }

    }

    get responses () {
        return this.cardResponses
    }

    get text() {
        return this.cardText
    }

    /**
     * Extends underscores and removes '\n's
     */
    get clean() {
        return this.cardText.replace(/\_/g, '_____').replace(/\\n/g, ' ')
    }

    /**
     * Cleans text and escapes markdown characters to be discord-text friendly
     */
    get escaped() {
        return this.cardText.replace(/\_/g, '_____').replace(/\\n/g, ' ').replace(/\_/g, '\\_').replace(/\*/g, '\\*').replace(/\~/g, '\\~')
    }
}