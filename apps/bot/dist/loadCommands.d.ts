import { Collection, type SlashCommandBuilder } from "discord.js";
export interface Command {
    data: SlashCommandBuilder;
    execute: (...args: unknown[]) => unknown;
}
export declare const commands: Collection<string, Command>;
export declare function loadCommands(): Promise<void>;
//# sourceMappingURL=loadCommands.d.ts.map