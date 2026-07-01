import { Events, MessageFlags, EmbedBuilder } from "discord.js";
import { db, schema } from "@packages/database";
import { and, eq } from "drizzle-orm";
import config from "../src/config.js";

export default {
    name: Events.InteractionCreate,
    async execute(interaction: any) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== "close-modmail") return;

        if (interaction.inGuild()) {
            const thread = interaction.channel;
            if (
                !thread ||
                !thread.isThread() ||
                !thread.name.startsWith("modmail-")
            ) {
                return interaction.reply({
                    content: "Il y a eu un problème",
                    flags: MessageFlags.Ephemeral,
                });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const rows = await db
                .select()
                .from(schema.modmail)
                .where(
                    eq(
                        schema.modmail.modmailId,
                        Number(interaction.channel.name.split("-")[1]),
                    ),
                )
                .limit(1);

            if (rows.length === 0) {
                return interaction.editReply(
                    "Une erreur est survenue lors de la récupération des données du modmail. Veuillez réessayer plus tard.",
                );
            }

            const data = rows[0]!;

            const member = await interaction.guild.members.fetch(data.userId);
            const user = member.user;

            if (!user) {
                return interaction.editReply(
                    "L'utilisateur associé à ce modmail n'a pas été trouvé.",
                );
            }

            await db
                .update(schema.modmail)
                .set({ closed: true })
                .where(
                    eq(
                        schema.modmail.modmailId,
                        Number(interaction.channel.name.split("-")[1]),
                    ),
                );

            await thread.send({
                content: `Le modmail a été fermé par ${interaction.user.username}.`,
                embeds: [],
                components: [],
            });

            await thread.setArchived(
                true,
                `Modmail fermé par ${interaction.user.username}`,
            );

            await user.send({
                content: `Votre modmail a été fermé par ${interaction.user.username}. Si vous avez d'autres questions, n'hésitez pas à en créer un nouveau.`,
                embeds: [],
                components: [],
            });

            return interaction.editReply({
                content: "Le modmail a été fermé avec succès.",
                flags: MessageFlags.Ephemeral,
            });
        } else {
            const rows = await db
                .select()
                .from(schema.modmail)
                .where(
                    and(
                        eq(schema.modmail.userId, interaction.user.id),
                        eq(schema.modmail.closed, false),
                    ),
                )
                .limit(1);

            if (rows.length === 0) {
                return interaction.reply({
                    content: "Il y a eu un problème",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const data = rows[0]!;

            const guild = await interaction.client.guilds.fetch(
                "1200739738013937664",
            );
            const modmailChannel = guild.channels.cache.find(
                (channel: any) =>
                    channel.name.includes("modmails"),
            );
            if (!modmailChannel) return;

            const thread = modmailChannel.threads.cache.find(
                (t: any) =>
                    t.name ===
                    `modmail-${data.modmailId}-${interaction.user.username}`,
            );

            if (
                !thread ||
                !thread.isThread() ||
                !thread.name.startsWith("modmail-")
            ) {
                return interaction.reply({
                    content: "Il y a eu un problème",
                    flags: MessageFlags.Ephemeral,
                });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const user = interaction.user;

            await db
                .update(schema.modmail)
                .set({ closed: true })
                .where(
                    eq(
                        schema.modmail.modmailId,
                        Number(thread.name.split("-")[1]),
                    ),
                );

            await thread.send({
                content: `Le modmail a été fermé par ${interaction.user.username}.`,
                embeds: [],
                components: [],
            });

            await thread.setArchived(
                true,
                `Modmail fermé par ${interaction.user.username}`,
            );

            const contactStaffEmbed =
                config.interactiveDM.contactStaff.embed;
            const closingEmbed = new EmbedBuilder()
                .setColor("#FFD67E")
                .setDescription(
                    `Votre modmail a été fermé par ${interaction.user.username}. Si vous avez d'autres questions, n'hésitez pas à en créer un nouveau.`,
                )
                .setTimestamp();

            await user.send({
                content: "",
                embeds: [closingEmbed, contactStaffEmbed],
                components: config.interactiveDM.contactStaff.row,
            });

            return interaction.editReply({
                content: "Le modmail a été fermé avec succès.",
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
