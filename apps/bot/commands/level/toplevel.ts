import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getTopLevel } from "../../src/utility/checkDb.js";

export default {
    data: new SlashCommandBuilder()
        .setName("topniveau")
        .setDescription(
            "Affiche les utilisateurs avec le niveau le plus haut du serveur.",
        )
        .addIntegerOption((option) =>
            option
                .setName("top")
                .setDescription(
                    "Le nombre de personnes dans le top à afficher.",
                )
                .setRequired(false),
        ),
    async execute(
        interaction: any,
    ) {
        await interaction.deferReply();
        const top = interaction.options.getInteger("top") || 5;

        const topLevelData = await getTopLevel(top);

        const fields = await Promise.all(
            topLevelData.map(async (user: any) => {
                try {
                    const member = await interaction.guild.members.fetch(
                        user.userId,
                    );

                    return {
                        name: member.user.username,
                        value: `Niveau: ${user.level}\nXP: ${user.totalXp}`,
                        inline: true,
                    };
                } catch {
                    return {
                        name: "Utilisateur inconnu",
                        value: `Niveau: ${user.level}\nXP: ${user.totalXp}`,
                        inline: true,
                    };
                }
            }),
        );

        const embed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle(`Top ${top} niveau`)
            .setDescription(
                `Voici les ${top} utilisateurs avec le niveau le plus haut du serveur.`,
            )
            .setTimestamp()
            .addFields(fields);

        await interaction.editReply({ embeds: [embed] });
    },
};
