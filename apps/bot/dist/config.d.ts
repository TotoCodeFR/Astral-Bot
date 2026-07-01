import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder } from "discord.js";
interface InteractiveDmSection {
    name: string;
    emoji?: string;
    embed: EmbedBuilder;
    row?: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[];
}
declare const _default: {
    interactiveDM: Record<string, InteractiveDmSection>;
    options: StringSelectMenuOptionBuilder[];
    logs: Record<string, {
        getEmbed: (interaction: any, fields: Record<string, string>) => EmbedBuilder;
    }>;
};
export default _default;
//# sourceMappingURL=config.d.ts.map