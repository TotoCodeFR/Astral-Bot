import { SlashCommandBuilder } from "discord.js";
import { getMoney } from "../../src/utility/checkDb.js";

export default {
    data: new SlashCommandBuilder()
        .setName("argent")
        .setDescription("Affiche l'argent actuel de l'utilisateur.")
        .addUserOption((option) =>
            option
                .setName("utilisateur")
                .setDescription(
                    "L'utilisateur dont vous voulez afficher l'argent.",
                )
                .setRequired(false),
        ),
    async execute(
        interaction: any,
    ) {
        await interaction.deferReply();
        const user =
            interaction.options.getUser("utilisateur") || interaction.user;

        const moneyData = await getMoney(user.id);

        await interaction.editReply(
            `Ton argent : ${moneyData.money}\nTon record : ${moneyData.record}`,
        );
    },
};
