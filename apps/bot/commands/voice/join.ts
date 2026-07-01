import {
    createAudioPlayer,
    entersState,
    joinVoiceChannel,
    VoiceConnectionStatus,
} from "@discordjs/voice";
import { ChannelType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { createDiscordJSAdapter } from "./adapter";

export default {
    data: new SlashCommandBuilder()
        .setName("rejoindre")
        .setDescription(
            "Rejoins le salon vocal de l'utilisateur qui a exécuté la commande.",
        ),

    async execute(interaction: any) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        if (!interaction.member.voice.channel) {
            await interaction.editReply({
                content:
                    "# Toc toc, y'a quelqu'un?\n\nTu n'est pas dans un salon vocal, rejoins en un puis réessaye!",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.editReply({
            content: "# Attends un petit peu!\n\nJe rejoins le salon!",
        });

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guildId,
            adapterCreator: createDiscordJSAdapter(
                interaction.member.voice.channel,
            ),
            selfDeaf: false,
            selfMute: false,
        });
        connection.on("error", (err) =>
            console.error(`[join] connection error:`, err),
        );

        const audioPlayer = createAudioPlayer();
        connection.subscribe(audioPlayer);

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
        } catch {
            await interaction.editReply({
                content:
                    "# Impossible de se connecter\n\nLe bot n'a pas pu rejoindre le salon vocal. Vérifie que le bot a les permissions `Connect` et `Speak` dans ce salon.",
            });
            connection.destroy();
            return;
        }

        if (
            interaction.member.voice.channel.type ===
            ChannelType.GuildStageVoice
        ) {
            await interaction.editReply({
                content:
                    "# Connexion prête !\n\nConseil : invitez moi en tant qu'intervenant, sinon on ne pourra pas m'entendre !",
            });
        } else {
            await interaction.editReply({
                content:
                    "# Connexion prête !\n\nIl manque plus qu'une musique dans la playlist.",
            });
        }
    },
};
