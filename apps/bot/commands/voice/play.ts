import {
    Attachment,
    MessageFlags,
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
} from "discord.js";
import { Readable } from "node:stream";
import {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    getVoiceConnection,
    joinVoiceChannel,
    VoiceConnectionStatus,
} from "@discordjs/voice";

const activeSkips = new Map<string, any>();
const queue = new Map<string, any[]>();
const volumes = new Map<string, number>();
const volumeCleanupConnections = new WeakSet<any>();
const DEFAULT_VOLUME = 35;

function isMp3File(file: Attachment) {
    return file.contentType === "audio/mpeg" || file.name.endsWith(".mp3");
}

async function getMp3AudioStream(file: Attachment) {
    const response = await fetch(file.url);

    if (!response.ok || !response.body) {
        throw new Error(`Could not download MP3 file: ${response.status}`);
    }

    return Readable.fromWeb(response.body as any);
}

function getVolume(guildId: string) {
    return volumes.get(guildId) ?? DEFAULT_VOLUME;
}

function applyVolume(resource: any, guildId: string) {
    resource.volume?.setVolume(getVolume(guildId) / 100);
    console.log(`applyVolume: volume = ${getVolume(guildId)}`);
}

function ensureVolumeCleanup(connection: any, guildId: string) {
    if (volumeCleanupConnections.has(connection)) return;

    volumeCleanupConnections.add(connection);
    connection.once(VoiceConnectionStatus.Destroyed, () => {
        volumes.delete(guildId);
    });
}

async function skip(interaction: any) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
        return interaction.editReply({
            content:
                "Vous devez être dans un canal vocal pour utiliser cette commande.",
            flags: MessageFlags.Ephemeral,
        });
    }

    const memberCount = voiceChannel.members.filter(
        (m: any) => !m.user.bot,
    ).size;
    const requiredVotes = memberCount > 1 ? Math.ceil(memberCount / 2) : 1;

    const embed = new EmbedBuilder()
        .setTitle("Vote de saut de musique 🎵")
        .setDescription(
            `Une demande de saut a été initiée par <@${interaction.user.id}>.`,
        )
        .addFields({
            name: "Votes nécessaires",
            value: `1 / ${requiredVotes}`,
            inline: true,
        })
        .setColor("Orange")
        .setFooter({ text: "Expire dans 2 minutes." });

    const skipButton = new ButtonBuilder()
        .setCustomId("vote_skip")
        .setLabel("⏭️ Skip")
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(skipButton);

    await interaction.editReply({ embeds: [embed], components: [row] });

    const message = await interaction.fetchReply();

    const voters = new Set<string>();
    voters.add(interaction.user.id);

    let currentVotes = 1;

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 2 * 60 * 1000,
    });

    activeSkips.set(interaction.guildId, {
        collector,
        message,
    });

    collector.on("collect", async (i: any) => {
        if (
            !i.member.voice.channel ||
            i.member.voice.channel.id !== voiceChannel.id
        ) {
            return i.reply({
                content: "Tu dois être dans le même salon vocal pour voter.",
                flags: MessageFlags.Ephemeral,
            });
        }

        if (voters.has(i.user.id)) {
            return i.reply({
                content: "Tu as déjà voté !",
                flags: MessageFlags.Ephemeral,
            });
        }

        voters.add(i.user.id);
        currentVotes++;

        embed.data.fields![0]!.value = `${currentVotes} / ${requiredVotes}`;
        await i.update({ embeds: [embed] });

        if (currentVotes >= requiredVotes) {
            collector.stop("skipped");
        }
    });

    collector.on("end", async (_: any, reason: string) => {
        activeSkips.delete(interaction.guildId);

        if (reason === "skipped") {
            embed.setDescription("⏭️ La musique a été passée avec succès !");
            embed.setColor("Green");
            await message.edit({ embeds: [embed], components: [] });

            const connection = getVoiceConnection(interaction.guildId);

            if (!connection) {
                console.log("skip: no connection found");
                return;
            }
            if (connection.state.status === VoiceConnectionStatus.Destroyed) {
                console.log("skip: connection is destroyed");
                return;
            }

            const player = connection.state.subscription?.player;
            if (player) {
                player.stop();
            }
        } else {
            embed.setDescription("❌ Le vote a expiré. La musique continue.");
            embed.setColor("Red");
            await message.edit({ embeds: [embed], components: [] });
        }
    });

    if (requiredVotes === 1) {
        collector.stop("skipped");
    }
}

async function add(interaction: any) {
    const file = interaction.options.getAttachment("fichier");
    if (!file || !isMp3File(file)) {
        return interaction.followUp("Veuillez fournir un fichier MP3 valide.");
    }

    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
        return interaction.followUp(
            "Vous devez être dans un canal vocal pour ajouter une musique.",
        );
    }

    const connection = getVoiceConnection(interaction.guildId);
    if (!connection?.state?.subscription) {
        return interaction.followUp(
            "Le bot n'est connecté à aucun salon vocal.",
        );
    }

    if (!connection) {
        return interaction.followUp(
            "Le bot n'est connecté à aucun salon vocal.",
        );
    }
    if (connection.state.status === VoiceConnectionStatus.Destroyed) {
        return interaction.followUp("La connexion vocale est détruite.");
    }

    if (connection.state.status !== VoiceConnectionStatus.Ready) {
        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
        } catch {
            connection.destroy();
            return interaction.followUp(
                "Impossible de se connecter au salon vocal. Le bot manque peut-être de permissions (`Connect`, `Speak`). Réessaie `/rejoindre`.",
            );
        }
    }
    ensureVolumeCleanup(connection, interaction.guildId);

    let player = connection.state.subscription?.player;
    if (!player) {
        player = createAudioPlayer();
        connection.subscribe(player);
    }

    let resource;
    try {
        const stream = await getMp3AudioStream(file);
        resource = createAudioResource(stream, { inlineVolume: true });
    } catch (err) {
        console.error(err);
        return interaction.followUp(
            "Une erreur s'est produite lors du chargement du fichier MP3.",
        );
    }

    if (!queue.has(interaction.guildId)) {
        queue.set(interaction.guildId, []);
    }

    const serverQueue = queue.get(interaction.guildId)!;
    serverQueue.push(resource);

    if (player.state.status === AudioPlayerStatus.Idle) {
        playNextInQueue(interaction.guildId);
    }

    return interaction.followUp(
        `Le fichier ${file.name} a été ajouté à la playlist.`,
    );
}

async function volume(interaction: any) {
    const connection = getVoiceConnection(interaction.guildId);

    if (
        !connection ||
        connection.state.status === VoiceConnectionStatus.Destroyed
    ) {
        return interaction.editReply({
            content:
                "Le bot doit être connecté à un salon vocal pour changer le volume.",
            flags: MessageFlags.Ephemeral,
        });
    }

    ensureVolumeCleanup(connection, interaction.guildId);

    const volume = interaction.options.getInteger("volume");
    volumes.set(interaction.guildId, volume);

    const player = connection.state.subscription?.player;
    const resource =
        player?.state.status === AudioPlayerStatus.Playing ||
        player?.state.status === AudioPlayerStatus.Buffering
            ? player.state.resource
            : undefined;

    if (resource) {
        applyVolume(resource, interaction.guildId);
    }

    return interaction.editReply(`Volume de la playlist réglé à ${volume}%.`);
}

function playNextInQueue(guildId: string) {
    const serverQueue = queue.get(guildId);
    if (!serverQueue || serverQueue.length === 0) {
        console.log("playNextInQueue: queue is empty or missing");
        return;
    }

    const connection = getVoiceConnection(guildId);
    if (!connection) {
        console.log("playNextInQueue: no connection");
        return;
    }
    if (connection.state.status === VoiceConnectionStatus.Destroyed) {
        console.log("playNextInQueue: connection is destroyed");
        return;
    }

    const player = connection.state.subscription?.player;
    if (!player) {
        console.log("playNextInQueue: no player");
        return;
    }

    const nextTrack = serverQueue.shift()!;
    applyVolume(nextTrack, guildId);
    player.play(nextTrack);

    player.once(AudioPlayerStatus.Idle, () => {
        playNextInQueue(guildId);
    });
}

export default {
    data: new SlashCommandBuilder()
        .setName("playlist")
        .setDescription("Ajouter une musique à une playlist")
        .addSubcommand((subCommand) =>
            subCommand
                .setName("add")
                .setDescription("Ajoute une musique à une playlist")
                .addAttachmentOption((option) =>
                    option
                        .setName("fichier")
                        .setDescription("Le fichier MP3 à ajouter")
                        .setRequired(true),
                ),
        )
        .addSubcommand((subCommand) =>
            subCommand
                .setName("skip")
                .setDescription("Créer un vote de passe de musique."),
        )
        .addSubcommand((subCommand) =>
            subCommand
                .setName("volume")
                .setDescription("Change le volume de la playlist.")
                .addIntegerOption((option) =>
                    option
                        .setName("volume")
                        .setDescription("Volume en pourcentage")
                        .setMinValue(0)
                        .setMaxValue(100)
                        .setRequired(true),
                ),
        ),

    async execute(interaction: any) {
        await interaction.deferReply();

        const sub = interaction.options.getSubcommand();

        if (sub === "add") {
            await add(interaction);
        } else if (sub === "skip") {
            await skip(interaction);
        } else if (sub === "volume") {
            await volume(interaction);
        }
    },
};
