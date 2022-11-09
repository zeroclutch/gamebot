import { REST, Routes } from 'discord.js';

import * as dotenv from 'dotenv'
dotenv.config()

const GUILD_ID = '777699407876849684' // Server guild ID
const CLIENT_ID = process.env.DISCORD_CLIENT_ID

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

// for guild-based commands
rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] })
	.then(() => console.log('Successfully deleted all guild commands.'))
	.catch(console.error);

// for global commands
rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] })
	.then(() => console.log('Successfully deleted all application commands.'))
	.catch(console.error);