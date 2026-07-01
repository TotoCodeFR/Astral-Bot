import { type Client } from "discord.js";
import { readdirSync } from "node:fs";
import { join, extname } from "node:path";
import { pathToFileURL } from "node:url";

function walk(dir: string): string[] {
    const results: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walk(fullPath));
        } else if (entry.isFile() && [".ts", ".js"].includes(extname(entry.name))) {
            results.push(fullPath);
        }
    }
    return results;
}

export async function loadEvents(client: Client): Promise<void> {
    const eventsPath = join(import.meta.dirname, "..", "events");
    const files = walk(eventsPath);

    for (const file of files) {
        const { default: event } = await import(pathToFileURL(file).href);

        if (event?.name && event?.execute) {
            if (event.once) {
                client.once(event.name, (...args: unknown[]) => event.execute(...args));
            } else {
                client.on(event.name, (...args: unknown[]) => event.execute(...args));
            }
        }
    }
}
