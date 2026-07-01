import { MessageFlags, SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("getchanneltype")
        .setDescription("[DEV UNIQUEMENT] Get the current channel's type"),

    async execute(
        interaction: any,
    ) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        await interaction.editReply({
            content: String(interaction.channel.type),
        });
    },
};
