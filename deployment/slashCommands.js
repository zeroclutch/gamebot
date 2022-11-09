import { REST, Routes } from 'discord.js';

import * as dotenv from 'dotenv'
dotenv.config()

import logger from 'gamebot/logger'
import assert from 'node:assert';

import fs from 'node:fs';
import path from 'node:path';

const GUILD_ID = '777699407876849684' // Server guild ID

const TARGETS = Object.freeze({
	GUILD: 'guild',
	GLOBAL: 'global',
})

let MODE = TARGETS.GUILD

// Read process arguments
let targetArg = process.argv.find(arg => arg.startsWith('--target='))
console.log(process.argv)
if(targetArg) {
	MODE = targetArg.replace('--target=', '')
	assert.strictEqual(MODE === TARGETS.GUILD || MODE === TARGETS.GLOBAL, true, 'Invalid target specified.')
}

const __dirname = path.dirname(new URL(import.meta.url).pathname) // Get the directory name of the current file
const BASE_DIR = path.join(__dirname, '..') // Get the directory name of the current file

// configuration
const commands = []
const commandFiles = fs.readdirSync(decodeURIComponent(path.join(BASE_DIR, 'commands')))

// add commands to list
for (const commandFolder of commandFiles) {
	// Search for command files in the command folder, ignore .DS_Store and dev folder
	if (!commandFolder.includes('.DS_Store') && commandFolder !== 'dev' && commandFolder !== 'mod') {
		const folder = fs.readdirSync(decodeURIComponent(path.join(BASE_DIR, 'commands', commandFolder)))
		for (const file of folder) {
			if (file === '.DS_Store' || file.startsWith('_')) continue
			const { default: command } = await import(decodeURIComponent(path.join(BASE_DIR, 'commands', commandFolder, file))).catch(logger.error.bind(logger))
			console.log(commands.length, command.name)
			commands.push(command.toSlashCommand())
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		let response = []

		if(MODE === TARGETS.GUILD) {
			// The put method is used to fully refresh all commands in the guild with the current set
			response = await rest.put(
				Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, GUILD_ID),
				{ body: commands },
			);
		} else if(MODE === TARGETS.GLOBAL) {
			// Refresh all commands in the global scope
			response = await rest.put(
				Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
				{ body: commands },
			);
		}

		console.log(`Successfully reloaded ${response.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();