import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getTopMoney } from "../../checkDb.js";
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    data: new SlashCommandBuilder()
        .setName('topargent')
        .setDescription('Affiche les utilisateurs avec l\'argent le plus haut du serveur.')
        .addIntegerOption(option =>
            option.setName('top')
                .setDescription('Le nombre de personnes dans le top à afficher.')
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const top = interaction.options.getInteger('top') || 5;

        const topMoneyData = await getTopMoney(top);

        // Fetch member data for all users (even if not cached)
        const fields = await Promise.all(
            topMoneyData.map(async user => {
                try {
                    const member = await interaction.guild.members.fetch(user.user_id);

                    return {
                        name: member.user.username,
                        value: `Argent: ${user.money}\nRecord: ${user.record}`,
                        inline: true
                    };
                } catch (err) {
                    return {
                        name: 'Utilisateur inconnu',
                        value: `Argent: ${user.money}\nRecord: ${user.record}`,
                        inline: true
                    };
                }
            })
        );

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Top ${top} argent`)
            .setDescription(`Voici les ${top} utilisateurs avec l\'argent le plus haut du serveur.`)
            .setTimestamp()
            .addFields(fields);

        interaction.editReply({ embeds: [embed] });
    }
};