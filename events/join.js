import { Events } from "discord.js";
import objectConfig from '../objectConfig.js'

export default {
    name: Events.GuildMemberAdd,
    async execute(member) {
        await member.send({
            embeds: [ objectConfig.interactiveDM.serverGuide ],
            components: objectConfig.interactiveDM.serverGuideRow
        })
    }
}