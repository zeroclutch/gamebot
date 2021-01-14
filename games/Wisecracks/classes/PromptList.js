import Discord from '../../../discord_mod.js'
import fs from 'fs'

/**
 * A selection of prompts loaded from a file for Wisecracks
 * @class
 */
export default class PromptList {
    constructor(files) {
        // Read files
        let content = files.map(file => file = fs.readFileSync(file, 'utf8'))
        // Split text
        this.prompts = []
        content.join('\n').split('\n').forEach(prompt => {
            this.prompts.push(prompt.replace(/BLANK/gm, '____'))
        })
    }

    /**
     * Escapes markdown in text
     * @param {String} str String to escape
     */
    escape(str) {
        return str.replace(/\_/g, '\\_')
    }

    /**
     * Grabs a new prompt
     */
    get() {
        let index = Math.floor(Math.random() * this.prompts.length)
        let prompt = `${this.prompts[index]}`
        this.prompts.splice(index, 1)
        return {
            raw: prompt,
            escaped: this.escape(prompt)
        }
    }
}