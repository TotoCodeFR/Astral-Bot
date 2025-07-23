import { Events, MessageFlags, EmbedBuilder } from "discord.js";
import { getSupabaseClient } from "../utility/supabase.js";
import objectConfig from '../objectConfig.js'

const supabase = getSupabaseClient();

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        if (interaction.customId !== "close-modmail") return;

        if (interaction.inGuild()) {
            const thread = interaction.channel;
            if (!thread || !thread.isThread() || !thread.name.startsWith('modmail-')) {
                return interaction.reply({ content: "Il y a eu un problème", flags: MessageFlags.Ephemeral });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const { data, error } = await supabase
                .from('modmail')
                .select('*')
                .eq('modmail_id', interaction.channel.name.split('-')[1])
                .single();
            
            if (error) {
                console.error('Error fetching modmail data:', error);
                return interaction.editReply("Une erreur est survenue lors de la récupération des données du modmail. Veuillez réessayer plus tard.");
            }

            const member = await interaction.guild.members.fetch(data.user_id)
            const user = member.user

            if (!user) {
                return interaction.editReply("L'utilisateur associé à ce modmail n'a pas été trouvé.");
            }

            const { error: closeError } = await supabase
                .from('modmail')
                .update({ closed: true })
                .eq('modmail_id', interaction.channel.name.split('-')[1]);
            
            if (closeError) {
                console.error('Error closing modmail:', closeError);
                return interaction.editReply({ content: "Une erreur est survenue lors de la fermeture du modmail. Veuillez réessayer plus tard.", flags: MessageFlags.Ephemeral });
            }

            await thread.send({
                content: `Le modmail a été fermé par ${interaction.user.username}.`,
                embeds: [],
                components: []
            });

            await thread.setArchived(true, `Modmail fermé par ${interaction.user.username}`);

            await user.send({
                content: `Votre modmail a été fermé par ${interaction.user.username}. Si vous avez d'autres questions, n'hésitez pas à en créer un nouveau.`,
                embeds: [],
                components: []
            });

            return interaction.editReply({ content: "Le modmail a été fermé avec succès.", flags: MessageFlags.Ephemeral });
        } else {
            const { data, error } = await supabase
                .from('modmail')
                .select('*')
                .eq('user_id', interaction.user.id)
                .eq('closed', false)
                .single();
            
            const guild = await interaction.client.guilds.fetch('1200739738013937664');
            const thread = guild.channels.cache.find(channel => channel.name.includes('modmails')).threads.cache.find(t => t.name === `modmail-${data.modmail_id}-${interaction.user.username}`);
            if (!thread || !thread.isThread() || !thread.name.startsWith('modmail-')) {
                return interaction.reply({ content: "Il y a eu un problème", flags: MessageFlags.Ephemeral });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            
            if (error) {
                console.error('Error fetching modmail data:', error);
                return interaction.editReply("Une erreur est survenue lors de la récupération des données du modmail. Veuillez réessayer plus tard.");
            }

            const user = interaction.user

            if (!user) {
                return interaction.editReply("L'utilisateur associé à ce modmail n'a pas été trouvé.");
            }

            const { error: closeError } = await supabase
                .from('modmail')
                .update({ closed: true })
                .eq('modmail_id', thread.name.split('-')[1]);
            
            if (closeError) {
                console.error('Error closing modmail:', closeError);
                return interaction.editReply({ content: "Une erreur est survenue lors de la fermeture du modmail. Veuillez réessayer plus tard.", flags: MessageFlags.Ephemeral });
            }

            await thread.send({
                content: `Le modmail a été fermé par ${interaction.user.username}.`,
                embeds: [],
                components: []
            });

            await thread.setArchived(true, `Modmail fermé par ${interaction.user.username}`);

            const contactStaffEmbed = objectConfig.interactiveDM.contactStaff
            const closingEmbed = new EmbedBuilder()
                .setColor('#FFD67E')
                .setDescription(
`Votre modmail a été fermé par ${interaction.user.username}. Si vous avez d'autres questions, n'hésitez pas à en créer un nouveau.`
                )
                .setTimestamp()

            await user.send({
                content: ``,
                embeds: [ closingEmbed, contactStaffEmbed ],
                components: objectConfig.interactiveDM.contactStaffRow
            });

            return interaction.editReply({ content: "Le modmail a été fermé avec succès.", flags: MessageFlags.Ephemeral });
        }
    }
};
