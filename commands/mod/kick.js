import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import path from 'path';
import { fileURLToPath } from "url";
import { log } from '../../utility/log.js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulse une personne.')
        .addUserOption(option => option
            .setName("utilisateur")
            .setDescription("L'utilisateur à expulser")
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName("raison")
            .setDescription("La raison pour expulser l'utilisateur.")
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            interaction.editReply({ content: '# Mais tu te crois pour qui?\n\nTu n\'a pas la permission pour utiliser cette commande!' });
        }

        const user = interaction.options.getUser("utilisateur");

        const embed = new EmbedBuilder()
            .setTitle("Expulser <@" + user.id + ">?")
            .setDescription("<@" + interaction.member.id + "> veut expulser <@" + user.id + ">.");

        const confirm = new ButtonBuilder()
            .setLabel("Oui, je veux expulser cette personne.")
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success)
            .setCustomId("confirm");

        const cancel = new ButtonBuilder()
            .setLabel("Non, je change d'idée.")
            .setEmoji('❌')
            .setStyle(ButtonStyle.Danger)
            .setCustomId("cancel");

        const row = new ActionRowBuilder()
            .addComponents(confirm, cancel);

        const réponse = await interaction.editReply({
            embeds: [embed],
            components: [row],
            fetchReply: true
        });

        const collectorFilter = i => i.user.id === interaction.user.id;

        try {
            const confirmation = await réponse.awaitMessageComponent({
                filter: collectorFilter,
                time: 120_000
            });

            if (confirmation.customId === "confirm") {
                await interaction.guild.members.kick(user, interaction.options.getString("raison"));
                await confirmation.update({ content: 'Utilisateur expulsé.', embeds: [], components: [] });
                await log(interaction, "kick", { kicked_username: user.username, reason: interaction.options.getString("raison") });
            } else if (confirmation.customId === "cancel") {
                await confirmation.update({ content: 'Action annulée.', embeds: [], components: [] });
            }
        } catch (e) {
            await interaction.editReply({ content: 'Aucune confirmation reçue!', embeds: [], components: [] });
            console.log(e);
        }
    },
};