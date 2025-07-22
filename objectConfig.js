import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder } from "discord.js";

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
    );

export default {
    interactiveDM: {
        home: new EmbedBuilder()
            .setDescription(
`# 🏠 Accueil
(En cours de développement)`),
        serverGuide: new EmbedBuilder()
            .setDescription(
`# 📜 Guide du serveur
Je m'appelle Astral Bot, le bot du serveur **Astral Gaming**`),
        homeRow: new ActionRowBuilder().addComponents(createSelectMenu('home')),
        serverGuideRow: new ActionRowBuilder().addComponents(createSelectMenu('serverGuide')),
        loading: new EmbedBuilder().setDescription("Chargement..."),
    }
}
