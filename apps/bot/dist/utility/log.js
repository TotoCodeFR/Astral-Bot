import {} from "discord.js";
import config from "../config.js";
export async function log(interaction, type, fields) {
    const guild = interaction.guild;
    const embed = config.logs[type].getEmbed(interaction, fields);
    const channel = guild.channels.cache.find((c) => {
        if (!("name" in c))
            return false;
        const name = c.name;
        return typeof name === "string" && name.includes("log");
    });
    if (channel?.isTextBased()) {
        await channel.send({ embeds: [embed] });
    }
}
//# sourceMappingURL=log.js.map