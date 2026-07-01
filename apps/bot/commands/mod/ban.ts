import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags,
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import { log } from "../../src/utility/log.js";

export default {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Banne une personne.")
        .addUserOption((option) =>
            option
                .setName("utilisateur")
                .setDescription("L'utilisateur à bannir")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("raison")
                .setDescription("La raison pour bannir l'utilisateur."),
        ),

    async execute(
        interaction: any,
    ) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        if (
            !interaction.member.permissions.has(
                PermissionsBitField.Flags.BanMembers,
            )
        ) {
            await interaction.editReply({
                content:
                    "# Mais tu te crois pour qui?\n\nTu n'a pas la permission pour utiliser cette commande!",
            });
            return;
        }

        const user = interaction.options.getUser("utilisateur");

        const embed = new EmbedBuilder()
            .setTitle("Bannir <@" + user.id + ">?")
            .setDescription(
                "<@" +
                    interaction.member.id +
                    "> veut bannir <@" +
                    user.id +
                    ">.",
            );

        const confirm = new ButtonBuilder()
            .setLabel("Oui, je veux bannir cette personne.")
            .setEmoji("✅")
            .setStyle(ButtonStyle.Success)
            .setCustomId("confirm");

        const cancel = new ButtonBuilder()
            .setLabel("Non, je change d'idée.")
            .setEmoji("❌")
            .setStyle(ButtonStyle.Danger)
            .setCustomId("cancel");

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            confirm,
            cancel,
        );

        const réponse = await interaction.editReply({
            embeds: [embed],
            components: [row],
            fetchReply: true,
        });

        const collectorFilter = (i: any) => i.user.id === interaction.user.id;

        try {
            const confirmation = await réponse.awaitMessageComponent({
                filter: collectorFilter,
                time: 120_000,
            });

            if (confirmation.customId === "confirm") {
                await interaction.guild.members.ban(user);
                await confirmation.update({
                    content: "Utilisateur banni.",
                    embeds: [],
                    components: [],
                });
                await log(interaction, "ban", {
                    banned_username: user.username,
                    reason: interaction.options.getString("raison"),
                });
            } else if (confirmation.customId === "cancel") {
                await confirmation.update({
                    content: "Action annulée.",
                    embeds: [],
                    components: [],
                });
            }
        } catch {
            await interaction.editReply({
                content: "Aucune confirmation reçue!",
                embeds: [],
                components: [],
            });
        }
    },
};
