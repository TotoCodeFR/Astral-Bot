import { ActionRowBuilder, ButtonBuilder, ChannelType, Events, ThreadAutoArchiveDuration, ButtonStyle } from "discord.js";
import { getSupabaseClient } from "../utility/supabase.js";

const supabase = getSupabaseClient();

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        // Vérifie si l'interaction a un canal, sinon stop
        if (interaction.inGuild()) return;
        

        if (!interaction.channel) return

        // Fix de logique : on veut vérifier que customId == 'start-modmail'
        if (interaction.customId !== 'start-modmail') return;

        await interaction.deferReply();

        const { count } = await supabase
            .from('modmail')
            .select('*', { count: 'exact' });

        const { error } = await supabase
            .from('modmail')
            .upsert({
                user_id: interaction.user.id,
                modmail_id: count + 1,
            });

        if (error) {
            console.error('Error upserting user:', error);
            return interaction.editReply("Une erreur est survenue lors de la création du modmail. Veuillez réessayer plus tard.");
        }

        const guild = await interaction.client.guilds.fetch('1200739738013937664');

        const modmailChannel = guild.channels.cache.find(channel =>
            channel.name.includes('modmail') && channel.isTextBased()
        );

        if (!modmailChannel || !modmailChannel.threads) {
            console.error('Modmail channel or threads manager not found.');
            return interaction.editReply("Erreur interne : impossible de trouver le salon des modmails.");
        }

        const thread = await modmailChannel.threads.create({
            name: `modmail-${count + 1}-${interaction.user.username}`,
            type: ChannelType.PrivateThread,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
            reason: `Modmail créé par ${interaction.user.username}`,
        });

        await thread.send({
            content: `Modmail créé par ${interaction.user.username}. ID du modmail : ${count + 1}.`,
            embeds: [],
            components: []
        });

        const closeModmail = new ButtonBuilder()
            .setCustomId('close-modmail')
            .setLabel('Fermer le modmail')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌');

        const row = new ActionRowBuilder().addComponents(closeModmail);

        await interaction.editReply({
            content: "Votre modmail a été créé avec succès. Un membre du staff vous répondra dès que possible. En attendant, décrivez votre problème ou question ci-dessous.",
            embeds: [],
            components: [row]
        });
    }
};
