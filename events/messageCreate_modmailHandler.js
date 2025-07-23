import { ChannelType, Events } from "discord.js";
import { getSupabaseClient } from "../utility/supabase.js";

const supabase = getSupabaseClient();

export default {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.channel.type === ChannelType.DM) {
            if (message.author.bot) return;
            const { data, error } = await supabase
                .from('modmail')
                .select('*')
                .eq('user_id', message.author.id)
                .eq('closed', false)
                .single()
            
            if (error) {
                if (error.code === 'PGRST116') {
                    return
                } else {
                    console.error('Error fetching modmail data:', error);
                    return message.reply("Une erreur est survenue lors de la récupération de vos données de modmail. Veuillez réessayer plus tard.");
                }
            }

            if (!data) return

            const guild = await message.client.guilds.fetch('1200739738013937664');

            const thread = await guild.channels.cache.find(channel => channel.name.includes('modmails')).threads.cache.find(t => t.name === `modmail-${data.modmail_id}-${message.author.username}`);

            thread.send({
                content: `**${message.author.username}** : ${message.content}`,
                embeds: [],
                components: []
            })
        } else {
            if (!message.channel.isThread()) return;
            if (!message.channel.name.startsWith('modmail-')) return;
            if (message.author.bot) return;

            const { data, error } = await supabase
                .from('modmail')
                .select('*')
                .eq('modmail_id', message.channel.name.split('-')[1])
                .single();
            
            if (error) {
                console.error('Error fetching modmail data:', error);
                return message.reply("Une erreur est survenue lors de la récupération des données du modmail. Veuillez réessayer plus tard.");
            }

            const member = await message.guild.members.fetch(data.user_id)
            const user = member.user

            if (!user) {
                return message.reply("L'utilisateur associé à ce modmail n'a pas été trouvé.");
            }

            user.send({
                content: `**${message.author.username}** : ${message.content}`,
                embeds: [],
                components: []
            })
        }
    }
}