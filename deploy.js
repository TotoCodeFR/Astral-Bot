import { REST, Routes } from 'discord.js';
import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function deployCommands(client) {
	const commands = [];
	const foldersPath = path.join(__dirname, 'commands');

	const commandFolders = await readdir(foldersPath);

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = (await readdir(commandsPath)).filter(file => file.endsWith('.js'));

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const fileUrl = pathToFileURL(filePath);

			const command = await import(fileUrl);

		if (command.default && command.default.data && command.default.execute && !command.default.ignore) {
				commands.push(command.default.data.toJSON());
				// Also add the command to the client.commands Collection
				client.commands.set(command.default.data.name, command.default);
			}
			else {
				console.warn(`[AVERTISSEMENT] La commande ${filePath} manque la/les propriéte(s) 'data' ou/et 'execute'!` );
			}
		}
	}

	const rest = new REST().setToken(process.env.DISCORD_TOKEN);

	try {
		console.log(`Chargement de ${commands.length} commandes...`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
			{ body: commands },
		);

		console.log(`${data.length} commandes ont été chargées!`);
		return data;
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
		throw error;
	}
}

export async function deployEvents(client) {
	console.log('Chargement des évènements...')
	const eventsPath = path.join(__dirname, 'events');
	const eventFiles = (await readdir(eventsPath)).filter(file => file.endsWith('.js'));

	for (const file of eventFiles) {
		const filePath = path.join(eventsPath, file);
		const fileUrl = pathToFileURL(filePath);
		const eventModule = await import(fileUrl);
		const event = eventModule.default;

		if (event && event.name && typeof event.execute === 'function' && !event.ignore) {
			if (event.once) {
				client.once(event.name, (...args) => event.execute(...args));
			} else {
				client.on(event.name, (...args) => event.execute(...args));
			}
		} else {
			console.warn(`[AVERTISSEMENT] L'évènement ${filePath} manque la/les propriéte(s) 'name' ou/et 'execute' !`);
		}
	}

	console.log(`Chargement des évènements terminé! ${eventFiles.length} évènements chargés.`)
}