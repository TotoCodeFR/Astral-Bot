import {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags,
} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("creer-msg-ticket")
        .setDescription(
            "[ADMIN UNIQUEMENT] Envoyer un message de création de ticket",
        )
        .addChannelOption((option) =>
            option
                .setName("endroit")
                .setDescription("L'endroit où envoyer le message")
                .setRequired(true),
        ),

    async execute(interaction: any) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const channel = interaction.options.getChannel("endroit");

        const embed = new EmbedBuilder()
            .setColor("5e34eb")
            .setTitle("Créer un ticket - Astral Gaming")
            .setDescription("Découvrez comment créer un ticket.")
            .addFields(
                {
                    name: "Raisons pour créer un ticket",
                    value: `> Problèmes avec autrui
                        > Vitrines
                        > Suggestions
                        > Partenariat
                        > Questions`,
                },
                {
                    name: "Comment créer un ticket?",
                    value: "Cliquez sur le bouton ci-dessous.",
                },
                {
                    name: "Sujet trop sensible ?",
                    value: `Contactez les modérateurs via modmail.
                    Utilisez la commande \`/renvoyer-dm-interactif\` pour recevoir le message privé interactif, puis sélectionnez Contact dans le message.`,
                },
            );

        const create = new ButtonBuilder()
            .setCustomId("create-ticket")
            .setLabel("Créer un ticket")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("📩");

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(create);

        await channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: "Message crée!" });
    },
};
