import { Events, PresenceUpdateStatus } from "discord.js";
import { initServer } from "../server.js";

export default {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Connecté en tant que ${client.user.tag}`);
        client.user.setPresence({ activities: [{ name: 'version 0.1.5' }], status: PresenceUpdateStatus.Online });
        initServer(process.env.PORT || 8080, client);
    }
}