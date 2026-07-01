import { Collection } from "discord.js";
import { readdirSync } from "node:fs";
import { join, extname } from "node:path";
import { pathToFileURL } from "node:url";
function walk(dir) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walk(fullPath));
        }
        else if (entry.isFile() &&
            [".ts", ".js"].includes(extname(entry.name))) {
            results.push(fullPath);
        }
    }
    return results;
}
export const commands = new Collection();
export async function loadCommands() {
    const commandsPath = join(import.meta.dirname, "..", "commands");
    const files = walk(commandsPath);
    for (const file of files) {
        const { default: command } = await import(pathToFileURL(file).href);
        if (command?.data?.name && command?.execute) {
            commands.set(command.data.name, command);
        }
    }
}
//# sourceMappingURL=loadCommands.js.map