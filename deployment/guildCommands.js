import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

import logger from 'gamebot/logger'

import fs from 'node:fs';
import path from 'node:path';

const GUILD_ID = '777699407876849684' // Server guild ID

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

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, GUILD_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();