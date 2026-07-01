import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, } from "discord.js";
const options = [];
const createSelectMenu = (defaultOptionValue) => {
    const menu = new StringSelectMenuBuilder()
        .setCustomId("interactive-dm-select")
        .setPlaceholder("Sélectionnez une option pour changer la fenêtre");
    menu.addOptions(options.map((opt) => {
        const optionData = opt.toJSON();
        return new StringSelectMenuOptionBuilder()
            .setLabel(optionData.label)
            .setValue(optionData.value)
            .setEmoji(optionData.emoji)
            .setDefault(optionData.value === defaultOptionValue);
    }));
    return menu;
};
const logs = {
    ban: {
        getEmbed(interaction, fields) {
            return new EmbedBuilder()
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTitle(`${fields.banned_username} a été banni`)
                .setDescription(`Raison : ${fields.reason}`);
        },
    },
    kick: {
        getEmbed(interaction, fields) {
            return new EmbedBuilder()
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTitle(`${fields.kicked_username} a été expulsé`)
                .setDescription(`Raison : ${fields.reason}`);
        },
    },
};
const interactiveDM = {
    home: {
        name: "Accueil",
        emoji: "🏠",
        embed: new EmbedBuilder()
            .setColor("#FFD67E")
            .setDescription("# 🏠 Accueil\n(En cours de développement)"),
    },
    serverGuide: {
        name: "Guide du serveur",
        emoji: "📜",
        embed: new EmbedBuilder()
            .setColor("#FFD67E")
            .setDescription(`# 📜 Guide du serveur
Je m'appelle Astral Bot, le bot du serveur **Astral Gaming**.
Je suis là pour vous aider à naviguer dans le serveur et à trouver les informations dont vous avez besoin.
Vous pouvez utiliser le menu déroulant ci-dessous pour changer de fenêtre et accéder à différentes sections du guide.

## Comment démarrer sur le serveur ?
1. **Lisez les règles** : Les règles sont dans le salon <#1226182479442874490>.
2. **Amusez-vous** : Vous pouvez discuter, jouer, et participer aux événements.
3. **Posez des questions** : Contactez un membre ou le staff si besoin.

Note : pour contactez le staff, sélectionnez "Contacter le staff" dans le menu.`),
    },
    contactStaff: {
        name: "Contacter le staff",
        emoji: "📞",
        embed: new EmbedBuilder().setDescription("# 📞 Contacter le staff"),
    },
    loading: {
        name: "",
        embed: new EmbedBuilder().setDescription("Chargement..."),
    },
};
for (const [key, value] of Object.entries(interactiveDM)) {
    if (!value?.name || key === "loading")
        continue;
    const option = new StringSelectMenuOptionBuilder()
        .setLabel(value.name)
        .setValue(key);
    if (value.emoji)
        option.setEmoji(value.emoji);
    options.push(option);
}
const homeSection = interactiveDM.home;
const serverGuideSection = interactiveDM.serverGuide;
const contactStaffSection = interactiveDM.contactStaff;
const homeRow = new ActionRowBuilder().addComponents(createSelectMenu("home"));
const serverGuideRow = new ActionRowBuilder().addComponents(createSelectMenu("serverGuide"));
const contactStaffRow = [
    new ActionRowBuilder().addComponents(createSelectMenu("contactStaff")),
    new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setLabel("Ouvrir un ticket")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("create-ticket")
        .setEmoji("🎫"), new ButtonBuilder()
        .setLabel("Créer un modmail")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("start-modmail")
        .setEmoji("📬")),
];
homeSection.row = [homeRow];
serverGuideSection.row = [serverGuideRow];
contactStaffSection.row = contactStaffRow;
export default {
    interactiveDM,
    options,
    logs,
};
//# sourceMappingURL=config.js.map