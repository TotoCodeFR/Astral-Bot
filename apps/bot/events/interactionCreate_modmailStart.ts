import {
    ActionRowBuilder,
    ButtonBuilder,
    ChannelType,
    Events,
    ThreadAutoArchiveDuration,
    ButtonStyle,
} from "discord.js";
import { db, schema } from "@packages/database";
import { and, eq } from "drizzle-orm";

export default {
    name: Events.InteractionCreate,
    async execute(interaction: any) {
        if (!interaction.isButton()) return;
        if (interaction.inGuild()) return;
        if (!interaction.channel) return;
        if (interaction.customId !== "start-modmail") return;

        await interaction.deferReply();

        const rows = await db
            .select({ count: schema.modmail.modmailId })
            .from(schema.modmail);

        const count = rows.length;

        const openModmails = await db
            .select()
            .from(schema.modmail)
            .where(
                and(
                    eq(schema.modmail.closed, false),
                    eq(schema.modmail.userId, interaction.user.id),
                ),
            );

        if (openModmails.length > 0) {
            return interaction.editReply(
                "Vous avez déjà un modmail ouvert. Veuillez attendre qu'un membre du staff vous réponde ou fermez le modmail existant avant d'en créer un nouveau.",
            );
        }

        await db
            .insert(schema.modmail)
            .values({
                userId: interaction.user.id,
                modmailId: count + 1,
            })
            .onConflictDoUpdate({
                target: schema.modmail.modmailId,
                set: { closed: false },
            });

        const guild = await interaction.client.guilds.fetch(
            "1200739738013937664",
        );

        const modmailChannel = guild.channels.cache.find(
            (channel: any) =>
                channel.name.includes("modmail") && channel.isTextBased(),
        );

        if (!modmailChannel || !modmailChannel.threads) {
            console.error("Modmail channel or threads manager not found.");
            return interaction.editReply(
                "Erreur interne : impossible de trouver le salon des modmails.",
            );
        }

        const thread = await modmailChannel.threads.create({
            name: `modmail-${count + 1}-${interaction.user.username}`,
            type: ChannelType.PrivateThread,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
            reason: `Modmail créé par ${interaction.user.username}`,
        });

        const closeModmail = new ButtonBuilder()
            .setCustomId("close-modmail")
            .setLabel("Fermer le modmail")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("❌");

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            closeModmail,
        );

        await thread.send({
            content: `Modmail créé par ${interaction.user.username}. ID du modmail : ${count + 1}.`,
            embeds: [],
            components: [row],
        });

        await interaction.editReply({
            content:
                "Votre modmail a été créé avec succès. Un membre du staff vous répondra dès que possible. En attendant, décrivez votre problème ou question ci-dessous.",
            embeds: [],
            components: [row],
        });
    },
};
