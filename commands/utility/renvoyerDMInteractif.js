import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import 'dotenv/config';
import objectConfig from '../../objectConfig.js';

export default {
    data: new SlashCommandBuilder()
        .setName('renvoyer-dm-interactif')
        .setDescription('Renvoie le DM interactif, envoyé lorsqu\'un utilisateur rejoint.'),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        await interaction.user.send({
            embeds: [ objectConfig.interactiveDM.serverGuide.embed ],
            components: objectConfig.interactiveDM.serverGuide.row
        });

        await interaction.editReply({
            content: 'Le DM interactif a été renvoyé avec succès !',
            flags: MessageFlags.Ephemeral
        });
    },
};