import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const createSelectMenu = (defaultOptionValue) => new StringSelectMenuBuilder()
    .setCustomId('interactive-dm-select')
    .setPlaceholder('Sélectionnez une option pour changer la fenêtre')
    .addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('Guide du serveur')
            .setValue('serverGuide')
            .setEmoji('📜')
            .setDefault(defaultOptionValue === 'serverGuide'),
        new StringSelectMenuOptionBuilder()
            .setLabel('Accueil')
            .setValue('home')
            .setEmoji('🏠')
            .setDefault(defaultOptionValue === 'home'),
        new StringSelectMenuOptionBuilder()
            .setLabel('Contacter le staff')
            .setValue('contactStaff')
            .setEmoji('📞')
            .setDefault(defaultOptionValue === 'contactStaff'),
    );

export default {
    interactiveDM: {
        home: new EmbedBuilder()
            .setColor('#FFD67E')
            .setDescription(
`# 🏠 Accueil
(En cours de développement)`),
        serverGuide: new EmbedBuilder()
            .setColor('#FFD67E')
            .setDescription(
`# 📜 Guide du serveur
Je m'appelle Astral Bot, le bot du serveur **Astral Gaming**.
Je suis là pour vous aider à naviguer dans le serveur et à trouver les informations dont vous avez besoin.
Vous pouvez utiliser le menu déroulant ci-dessous pour changer de fenêtre et accéder à différentes sections du guide.

## Comment démarrer sur le serveur ?
1. **Lisez les règles** : Les règles sont dans le salon <#1226182479442874490> pour vous dire ce que notre staff autorise ou non.
2. **Amusez-vous** : Vous pouvez vous amuser dans les salons de discussion, jouer à des jeux, et participer aux événements organisés par le staff.
3. **Posez des questions** : Si vous avez des questions, n'hésitez pas à demander de l'aide à d'autres membres du serveur ou à contacter le staff.

Note : pour contactez le staff, sélectionnez "Contacter le staff" dans le menu déroulant ci-dessous.`),
        contactStaff: new EmbedBuilder()
            .setColor('#FFD67E')
            .setDescription(
`# 📞 Contacter le staff`),
        contactStaffRow: [
            new ActionRowBuilder().addComponents(createSelectMenu('contactStaff')),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                .setLabel('Ouvrir un ticket')
                .setStyle(ButtonStyle.Primary)
                .setCustomId('create-ticket')
                .setEmoji('🎫'),
                new ButtonBuilder()
                .setLabel('Créer un modmail')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('start-modmail')
                .setEmoji('📬')
            )
        ],
        homeRow: [ new ActionRowBuilder().addComponents(createSelectMenu('home')) ],
        serverGuideRow: [ new ActionRowBuilder().addComponents(createSelectMenu('serverGuide')) ],
        loading: new EmbedBuilder().setDescription("Chargement..."),
    }
}
