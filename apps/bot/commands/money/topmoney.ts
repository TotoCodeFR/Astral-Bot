import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getTopMoney } from "../../src/utility/checkDb.js";

export default {
    data: new SlashCommandBuilder()
        .setName("topargent")
        .setDescription(
            "Affiche les utilisateurs avec l'argent le plus haut du serveur.",
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

        const topMoneyData = await getTopMoney(top);

        const fields = await Promise.all(
            topMoneyData.map(async (user: any) => {
                try {
                    const member = await interaction.guild.members.fetch(
                        user.userId,
                    );

                    return {
                        name: member.user.username,
                        value: `Argent: ${user.money}\nRecord: ${user.record}`,
                        inline: true,
                    };
                } catch {
                    return {
                        name: "Utilisateur inconnu",
                        value: `Argent: ${user.money}\nRecord: ${user.record}`,
                        inline: true,
                    };
                }
            }),
        );

        const embed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle(`Top ${top} argent`)
            .setDescription(
                `Voici les ${top} utilisateurs avec l'argent le plus haut du serveur.`,
            )
            .setTimestamp()
            .addFields(fields);

        await interaction.editReply({ embeds: [embed] });
    },
};
