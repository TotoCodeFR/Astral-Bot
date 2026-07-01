import { ChannelType, Events, type Message } from "discord.js";
import { db, schema } from "@packages/database";
import { and, eq } from "drizzle-orm";

export default {
    name: Events.MessageCreate,
    async execute(message: Message) {
        if (message.channel.type === ChannelType.DM) {
            if (message.author.bot) return;

            const rows = await db
                .select()
                .from(schema.modmail)
                .where(
                    and(
                        eq(schema.modmail.userId, message.author.id),
                        eq(schema.modmail.closed, false),
                    ),
                )
                .limit(1);

            if (rows.length === 0) return;

            const data = rows[0]!;

            const guild = await message.client.guilds.fetch(
                "1200739738013937664",
            );

            const modmailChannel = guild.channels.cache.find(
                (channel: any) => channel.name.includes("modmails"),
            );

            if (!modmailChannel) return;

            const thread = modmailChannel.threads.cache.find(
                (t: any) =>
                    t.name ===
                    `modmail-${data.modmailId}-${message.author.username}`,
            );

            if (thread) {
                await thread.send({
                    content: `**${message.author.username}** : ${message.content}`,
                    embeds: [],
                    components: [],
                });
            }
        } else {
            if (!message.channel.isThread()) return;
            if (!message.channel.name.startsWith("modmail-")) return;
            if (message.author.bot) return;

            const rows = await db
                .select()
                .from(schema.modmail)
                .where(
                    eq(
                        schema.modmail.modmailId,
                        Number(message.channel.name.split("-")[1]),
                    ),
                )
                .limit(1);

            if (rows.length === 0) {
                await message.reply(
                    "Une erreur est survenue lors de la récupération des données du modmail. Veuillez réessayer plus tard.",
                );
                return;
            }

            const data = rows[0]!;

            try {
                const member = await message.guild!.members.fetch(
                    data.userId,
                );
                const user = member.user;

                if (!user) {
                    await message.reply(
                        "L'utilisateur associé à ce modmail n'a pas été trouvé.",
                    );
                    return;
                }

                await user.send({
                    content: `**${message.author.username}** : ${message.content}`,
                    embeds: [],
                    components: [],
                });
            } catch {
                await message.reply(
                    "L'utilisateur associé à ce modmail n'a pas été trouvé.",
                );
            }
        }
    },
};
