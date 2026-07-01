import { type BaseInteraction, type Guild } from "discord.js";
export declare function log(interaction: BaseInteraction & {
    guild: Guild;
}, type: string, fields: Record<string, string>): Promise<void>;
//# sourceMappingURL=log.d.ts.map