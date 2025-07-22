import { ActivityType, Events } from "discord.js";
import { initServer } from "../server.js";

const statuses = [
  { name: 'vos modmails.', type: ActivityType.Listening },
  { name: 'est mal programmé.', type: ActivityType.Custom },
  { name: 'version 0.7.8', type: ActivityType.Custom },
];

let index = 0;

export default {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Connecté en tant que ${client.user.tag}`);
        setInterval(() => {
            const presence = statuses[index % statuses.length];
            client.user.setPresence({
                activities: [presence],
                status: 'online'
            });
            index++;
        }, 30_000)
        initServer(process.env.PORT || 8080, client);
    }
}