import { Events, type GuildMember } from "discord.js";
import config from "../src/config.js";

export default {
    name: Events.GuildMemberAdd,
    async execute(member: GuildMember) {
        await member.send({
            embeds: [config.interactiveDM.serverGuide.embed],
            components: config.interactiveDM.serverGuide.row,
        });
    },
};
