import type { DiscordGatewayAdapterCreator, DiscordGatewayAdapterLibraryMethods } from "@discordjs/voice";
import {
    GatewayDispatchEvents,
    Status,
    type Client,
    type GatewayVoiceServerUpdateDispatchData,
    type GatewayVoiceStateUpdateDispatchData,
    type VoiceBasedChannel,
    type Snowflake,
} from "discord.js";

const adapters = new Map<Snowflake, DiscordGatewayAdapterLibraryMethods>();
const trackedClients = new Set<Client>();
const trackedShards = new Map<number, Set<Snowflake>>();

function trackClient(client: Client) {
    if (trackedClients.has(client)) return;
    trackedClients.add(client);
    client.ws.on(GatewayDispatchEvents.VoiceServerUpdate, (payload: GatewayVoiceServerUpdateDispatchData) => {
        console.log(`[adapter] VoiceServerUpdate for guild ${payload.guild_id} endpoint=${payload.endpoint} token=${payload.token?.slice(0, 8)}...`);
        const ok = adapters.get(payload.guild_id)?.onVoiceServerUpdate(payload);
        console.log(`[adapter] VoiceServerUpdate forwarded: ${!!ok}`);
    });
    client.ws.on(GatewayDispatchEvents.VoiceStateUpdate, (payload: GatewayVoiceStateUpdateDispatchData) => {
        if (payload.guild_id && payload.session_id && payload.user_id === client.user?.id) {
            console.log(`[adapter] VoiceStateUpdate for self in guild ${payload.guild_id}, channel=${payload.channel_id}`);
            const ok = adapters.get(payload.guild_id)?.onVoiceStateUpdate(payload);
            console.log(`[adapter] VoiceStateUpdate forwarded: ${!!ok}`);
        }
    });
    client.on("shardDisconnect", (_, shardId) => {
        const guilds = trackedShards.get(shardId);
        if (guilds) {
            for (const guildId of guilds.values()) {
                adapters.get(guildId)?.destroy();
            }
        }
        trackedShards.delete(shardId);
    });
}

function trackGuild(guild: { shardId: number; id: string }) {
    let guilds = trackedShards.get(guild.shardId);
    if (!guilds) {
        guilds = new Set();
        trackedShards.set(guild.shardId, guilds);
    }
    guilds.add(guild.id);
}

export function createDiscordJSAdapter(channel: VoiceBasedChannel): DiscordGatewayAdapterCreator {
    return (methods) => {
        console.log(`[adapter] Creating adapter for guild ${channel.guild.id} channel=${channel.id} type=${channel.type}`);
        adapters.set(channel.guild.id, methods);
        trackClient(channel.client);
        trackGuild(channel.guild);
        return {
            sendPayload(data) {
                const shardStatus = channel.guild.shard.status;
                console.log(`[adapter] sendPayload: shard=${shardStatus}, channel=${data.d?.channel_id}`);
                if (shardStatus !== Status.Ready) return false;
                channel.guild.shard.send(data);
                console.log(`[adapter] sendPayload sent`);
                return true;
            },
            destroy() {
                console.log(`[adapter] Destroy adapter for guild ${channel.guild.id}`);
                adapters.delete(channel.guild.id);
            },
        };
    };
}
