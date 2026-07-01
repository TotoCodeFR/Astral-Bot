import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    Events,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ThreadAutoArchiveDuration,
} from "discord.js";
import { db, schema } from "@packages/database";
import { eq } from "drizzle-orm";

export default {
    name: Events.InteractionCreate,
    async execute(interaction: any) {
        if (!interaction.isButton()) return;

        if (interaction.customId === "create-ticket") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const rows = await db
                .select({ count: schema.tickets.ticketId })
                .from(schema.tickets);

            const count = rows.length;

            const guild =
                interaction.guild ||
                (await interaction.client.guilds.fetch("1200739738013937664"));
            let thread;

            if (interaction.guild) {
                thread = await interaction.channel.threads.create({
                    name: `ticket-${count + 1}-${interaction.user.username}`,
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                    reason:
                        "Nouveau ticket pour l'utilisateur " +
                        interaction.user.username,
                    type: ChannelType.PrivateThread,
                });

                await thread.members.add(interaction.user.id);
                await thread.members.add(interaction.client.user.id);
            } else {
                const ticketChannel = guild.channels.cache.find(
                    (channel: any) =>
                        channel.name.includes("créer-un-ticket"),
                );
                if (!ticketChannel) return;

                thread = await ticketChannel.threads.create({
                    name: `ticket-${count + 1}-${interaction.user.username}`,
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                    reason:
                        "Nouveau ticket pour l'utilisateur " +
                        interaction.user.username,
                    type: ChannelType.PrivateThread,
                });

                await thread.members.add(interaction.user.id);
                await thread.members.add(interaction.client.user.id);
            }

            const welcome = new EmbedBuilder()
                .setColor("5e34eb")
                .setTitle("Bienvenue " + interaction.user.displayName)
                .setDescription(
                    "Veuillez décrire votre situation, nous viendrons à vous dans quelques moments.",
                );

            const deleteWithReason = new ButtonBuilder()
                .setCustomId("delete-ticket-" + (count + 1))
                .setLabel("Fermer")
                .setEmoji("❌")
                .setStyle(ButtonStyle.Primary);

            const actions = new ActionRowBuilder<ButtonBuilder>().addComponents(
                deleteWithReason,
            );

            await thread.send({ embeds: [welcome], components: [actions] });

            const transcriptEmbed = new EmbedBuilder()
                .setColor("5e34eb")
                .setTitle(
                    "Ticket crée - " + interaction.user.displayName,
                )
                .setDescription("Cliquez ci-dessous pour le rejoindre.");

            const joinBtn = new ButtonBuilder()
                .setCustomId("join-ticket-" + (count + 1))
                .setLabel("Rejoindre")
                .setEmoji("🚪")
                .setStyle(ButtonStyle.Primary);

            const joinRow =
                new ActionRowBuilder<ButtonBuilder>().addComponents(joinBtn);

            const transcripts = guild.channels.cache.find((channel: any) =>
                channel.name.includes("transcripts"),
            );
            if (transcripts) {
                await transcripts.send({
                    embeds: [transcriptEmbed],
                    components: [joinRow],
                });
            }

            await db
                .insert(schema.tickets)
                .values({
                    userId: interaction.user.id,
                    ticketId: count + 1,
                    closed: false,
                })
                .onConflictDoUpdate({
                    target: schema.tickets.ticketId,
                    set: { closed: false },
                });

            await interaction.editReply({
                flags: MessageFlags.Ephemeral,
                content: "Ticket crée dans <#" + thread.id + ">!",
            });
        } else if (interaction.customId.startsWith("join-ticket-")) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const threadId = parseInt(
                interaction.customId.replace("join-ticket-", ""),
            );

            const ticketChannel = interaction.guild.channels.cache.find(
                (channel: any) => channel.name.includes("créer-un-ticket"),
            );

            if (!ticketChannel) {
                console.log("Le salon 'créer-un-ticket' est introuvable.");
                return;
            }

            const activeThreads = await ticketChannel.threads.fetchActive();
            const thread = activeThreads.threads.find((t: any) =>
                t.name.startsWith(`ticket-${threadId}`),
            );

            if (!thread) {
                console.log("Thread introuvable.");
                return;
            }

            await thread.members.add(interaction.user.id);
            await interaction.editReply({
                content: "Vous avez été ajouté au ticket.",
                flags: MessageFlags.Ephemeral,
            });
        } else if (interaction.customId.startsWith("delete-ticket-")) {
            const threadId = parseInt(
                interaction.customId.replace("delete-ticket-", ""),
            );

            const ticketChannel = interaction.guild.channels.cache.find(
                (channel: any) => channel.name.includes("créer-un-ticket"),
            );

            if (!ticketChannel) {
                console.log("Le salon 'créer-un-ticket' est introuvable.");
                return;
            }

            const activeThreads = await ticketChannel.threads.fetchActive();
            const thread = activeThreads.threads.find((t: any) =>
                t.name.startsWith(`ticket-${threadId}`),
            );

            if (!thread) {
                console.log("Thread introuvable.");
                return;
            }

            const modal = new ModalBuilder()
                .setCustomId("reason")
                .setTitle("Raison de la fermeture");

            const reasonInput = new TextInputBuilder()
                .setCustomId("reason-input")
                .setLabel("Raison")
                .setStyle(TextInputStyle.Paragraph);

            const modalRow =
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    reasonInput,
                );

            modal.addComponents(modalRow);

            await interaction.showModal(modal);

            const modalSubmitInteraction =
                await interaction.awaitModalSubmit({
                    filter: (i: any) =>
                        i.customId === "reason" &&
                        i.user.id === interaction.user.id,
                    time: 3600000,
                });

            await modalSubmitInteraction.deferReply({
                flags: MessageFlags.Ephemeral,
            });

            const raison =
                modalSubmitInteraction.fields.getTextInputValue(
                    "reason-input",
                ) || "Aucune raison définie.";

            await thread.send({
                content:
                    "Ce ticket a été fermé par " +
                    interaction.user.displayName +
                    " pour la raison: " +
                    raison,
            });

            await thread.setLocked(true);
            await thread.setArchived(true);

            await db
                .update(schema.tickets)
                .set({ closed: true })
                .where(eq(schema.tickets.ticketId, threadId));

            await modalSubmitInteraction.editReply({
                content: "Ticket fermé",
                flags: MessageFlags.Ephemeral,
            });

            const transcripts = interaction.guild.channels.cache.find(
                (channel: any) => channel.name.includes("transcripts"),
            );

            if (transcripts) {
                const embed = new EmbedBuilder()
                    .setColor("5e34eb")
                    .setTitle(
                        "Ticket fermé - " + interaction.user.displayName,
                    )
                    .setDescription(
                        "Fermé par: " +
                            interaction.user.displayName +
                            "\nRaison: " +
                            raison,
                    );

                await transcripts.send({ embeds: [embed] });
            }
        }
    },
};
