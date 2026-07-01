import { SlashCommandBuilder, MessageFlags } from "discord.js";
import config from "../../src/config.js";

export default {
    data: new SlashCommandBuilder()
        .setName("renvoyer-dm-interactif")
        .setDescription(
            "Renvoie le DM interactif, envoyé lorsqu'un utilisateur rejoint.",
        ),

    async execute(
        interaction: any,
    ) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        await interaction.user.send({
            embeds: [config.interactiveDM.serverGuide.embed],
            components: config.interactiveDM.serverGuide.row,
        });

        await interaction.editReply({
            content: "Le DM interactif a été renvoyé avec succès !",
            flags: MessageFlags.Ephemeral,
        });
    },
};
