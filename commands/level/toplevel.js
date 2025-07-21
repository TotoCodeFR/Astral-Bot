import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getTopLevel } from "../../checkDb.js";
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    data: new SlashCommandBuilder()
        .setName('topniveau')
        .setDescription('Affiche les utilisateurs avec le niveau le plus haut du serveur.')
        .addIntegerOption(option =>
            option.setName('top')
                .setDescription('Le nombre de personnes dans le top à afficher.')
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const top = interaction.options.getInteger('top') || 5;

        const topLevelData = await getTopLevel(top);

        // Fetch member data for all users (even if not cached)
        const fields = await Promise.all(
            topLevelData.map(async user => {
                try {
                    const member = await interaction.guild.members.fetch(user.user_id);

                    return {
                        name: member.user.username,
                        value: `Niveau: ${user.level}\nXP: ${user.total_xp}`,
                        inline: true
                    };
                } catch (err) {
                    return {
                        name: 'Utilisateur inconnu',
                        value: `Niveau: ${user.level}\nXP: ${user.total_xp}`,
                        inline: true
                    };
                }
            })
        );

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Top ${top} niveau`)
            .setDescription(`Voici les ${top} utilisateurs avec le niveau le plus haut du serveur.`)
            .setTimestamp()
            .addFields(fields);

        interaction.editReply({ embeds: [embed] });
    }
};
