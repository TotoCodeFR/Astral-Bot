import { Events } from "discord.js";
import objectConfig from "../objectConfig.js";

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        const client = interaction.client;

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId == "interactive-dm-select") {
                await interaction.update({
                    embeds: [ objectConfig.interactiveDM.loading ],
                    components: []
                })

                // get value
                const value = interaction.values[0];

                await interaction.editReply({
                    embeds: [ objectConfig.interactiveDM[value] ],
                    components: objectConfig.interactiveDM[value + "Row"]
                })
            }
        }
    }
}