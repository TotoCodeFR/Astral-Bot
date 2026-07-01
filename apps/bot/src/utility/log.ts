import { type BaseInteraction, type Guild, type TextChannel } from "discord.js";
import config from "../config.js";

export async function log(
    interaction: BaseInteraction & { guild: Guild },
    type: string,
    fields: Record<string, string>,
) {
    const guild = interaction.guild;

    const embed = config.logs[type]!.getEmbed(interaction, fields);

    const channel = guild.channels.cache.find((c) => {
        if (!("name" in c)) return false;
        const name = (c as TextChannel).name;
        return typeof name === "string" && name.includes("log");
    }) as TextChannel | undefined;

    if (channel?.isTextBased()) {
        await channel.send({ embeds: [embed] });
    }
}
