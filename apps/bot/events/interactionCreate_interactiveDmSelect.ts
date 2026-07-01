import { Events } from "discord.js";
import config from "../src/config.js";

export default {
    name: Events.InteractionCreate,
    async execute(interaction: any) {
        if (!interaction.isStringSelectMenu()) return;
        if (interaction.customId !== "interactive-dm-select") return;

        await interaction.update({
            embeds: [config.interactiveDM.loading.embed],
            components: [],
        });

        const value = interaction.values[0];

        await interaction.editReply({
            embeds: [config.interactiveDM[value].embed],
            components: config.interactiveDM[value].row,
        });
    },
};
