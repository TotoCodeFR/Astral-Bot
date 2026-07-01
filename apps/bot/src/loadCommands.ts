import { Collection, REST, Routes, type SlashCommandBuilder } from "discord.js";
import { readdirSync } from "node:fs";
import { join, extname } from "node:path";
import { pathToFileURL } from "node:url";

function walk(dir: string): string[] {
    const results: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walk(fullPath));
        } else if (
            entry.isFile() &&
            [".ts", ".js"].includes(extname(entry.name))
        ) {
            results.push(fullPath);
        }
    }
    return results;
}

export interface Command {
    data: SlashCommandBuilder;
    execute: (...args: unknown[]) => unknown;
}

export const commands = new Collection<string, Command>();

async function pushCommands(): Promise<void> {
    const applicationId =
        process.env.DISCORD_APPLICATION_ID ?? process.env.DISCORD_CLIENT_ID;

    if (!process.env.DISCORD_TOKEN || !applicationId) {
        console.warn(
            "Skipping command push: DISCORD_TOKEN and DISCORD_APPLICATION_ID or DISCORD_CLIENT_ID are required.",
        );
        return;
    }

    const rest = new REST({ version: "10" }).setToken(
        process.env.DISCORD_TOKEN,
    );
    const body = commands.map((command) => command.data.toJSON());

    await rest.put(Routes.applicationCommands(applicationId), { body });
    console.log(`Updated ${body.length} Discord application commands.`);
}

export async function loadCommands(): Promise<void> {
    const commandsPath = join(import.meta.dirname, "..", "commands");
    const files = walk(commandsPath);

    for (const file of files) {
        const { default: command } = await import(pathToFileURL(file).href);

        if (command?.data?.name && command?.execute) {
            commands.set(command.data.name, command);
        }
    }

    await pushCommands();
}
