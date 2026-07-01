import { getVoiceConnections } from "@discordjs/voice";
import { MessageFlags, SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Déconnecte le bot de son salon vocal."),

    async execute(
        interaction: any,
    ) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const connections = getVoiceConnections();

        for (const [, connection] of connections) {
            connection.destroy();
        }

        await interaction.editReply({
            content:
                "# Bot déconnecté\n\nLe bot a été déconnecté de toutes ses sessions.",
        });
    },
};
