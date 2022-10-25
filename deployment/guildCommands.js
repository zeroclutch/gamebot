const { REST, Routes, Collection } = require('discord.js');
const fs = require('node:fs');

// configuration
const commands = new Collection()
const commandFiles = fs.readdirSync(path.join('.', 'commands'))

// add commands to list
for (const commandFolder of commandFiles) {
	//search through each folder
	if (!commandFolder.includes('.DS_Store')) {
		const folder = fs.readdirSync(path.join('.', 'commands', commandFolder))
		for (const file of folder) {
			if (file === '.DS_Store') continue
			const { default: command } = await import(`../commands/${commandFolder}/${file}`).catch(logger.error)
			client.commands.set(command.name, command)
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();