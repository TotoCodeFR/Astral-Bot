import { SlashCommandBuilder } from "discord.js";
import { getMoney } from "../../checkDb.js";
import path from 'path'
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    data: new SlashCommandBuilder()
        .setName('argent')
        .setDescription('Affiche l\'argent actuel de l\'utilisateur.')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('L\'utilisateur dont vous voulez afficher l\'argent.')
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getUser('utilisateur') || interaction.user;
        
        const moneyData = await getMoney(user.id);

        interaction.editReply(`Ton argent : ${moneyData.money}\nTon record : ${moneyData.record}`)
    }
}