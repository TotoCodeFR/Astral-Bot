import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import { loadEvents } from "./loadEvents.js";
import { loadCommands, commands } from "./loadCommands.js";

export type { Command } from "./loadCommands.js";

async function addLog(message: string) {
    const { default: logs } = await import("./logsShared.js");
    const timestamp = new Date().toISOString();
    logs.push({ timestamp, message });
    const tenSecondsAgo = Date.now() - 10000;
    while (
        logs.length &&
        new Date(logs[0]!.timestamp).getTime() < tenSecondsAgo
    ) {
        logs.shift();
    }
}

(function (oldLog: typeof console.log) {
    console.log = function (...args: unknown[]) {
        const msg = args.map((a) => String(a)).join(" ");
        addLog(msg).catch(() => {});
        return oldLog.apply(console, args);
    };
})(console.log);

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

client.commands = commands;

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) {
        await interaction.reply({
            content: "Cette commande n'existe pas.",
            ephemeral: true,
        });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(
            `Erreur lors de l'exécution de la commande ${interaction.commandName}:`,
            error,
        );

        try {
            const errorMessage = {
                content:
                    "# Oups\n\nUne erreur est survenue lors de l'exécution de cette commande.",
                ephemeral: true,
            };

            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply(errorMessage);
            } else if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.followUp(errorMessage);
            }
        } catch (followUpError) {
            console.error("Erreur en envoyant la réponse:", followUpError);
        }
    }
});

const start = async () => {
    await loadEvents(client);
    await loadCommands();
    await client.login(process.env.DISCORD_TOKEN!);
};

start().catch((error) => {
    console.error("Erreur pendant l'initialisation: ", error);
});
