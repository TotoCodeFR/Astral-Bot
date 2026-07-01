import { SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("pileouface")
        .setDescription("Vas-tu être chanceux? 👀"),

    async execute(
        interaction: any,
    ) {
        await interaction.deferReply();
        const random = Math.round(Math.random());
        if (random === 1) {
            await interaction.editReply({ content: "Tu es tombé sur pile! 🪙" });
        } else {
            await interaction.editReply({ content: "Tu es tombé sur face! 😀" });
        }
    },
};
