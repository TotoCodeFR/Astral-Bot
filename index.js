import { getDopplerClient } from './utility/doppler.js';
const doppler = await getDopplerClient()
import 'dotenv/config'
import { getSupabaseClient } from './utility/supabase.js'
import { Client, Events, GatewayIntentBits, Collection, MessageFlags, PresenceUpdateStatus, ThreadAutoArchiveDuration, ChannelType, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { deployCommands, deployEvents } from './deploy.js';
import './installer-poppins.js'
import logs from './logsShared.js'

const supabase = getSupabaseClient()

// Function to add logs to the logs array (to be used for the last 10 seconds)
function addLog(message) {
    const timestamp = new Date().toISOString();
    logs.push({ timestamp, message });

    // Keep only logs from the last 10 seconds
    const tenSecondsAgo = Date.now() - 10000;
    while (logs.length && new Date(logs[0].timestamp).getTime() < tenSecondsAgo) {
        logs.shift();
    }
}

// Override console.log to capture new messages
(function(oldLog) {
    console.log = function(arg) {
        addLog(arg);
        return oldLog.apply(console, arguments);
    };
})(console.log);

// Main async initialization function
async function initialization() {
    const client = new Client({ 
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildVoiceStates
        ] 
    });
    
    client.commands = new Collection();

    try {
        await deployCommands(client);

        await deployEvents(client);

        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error('Erreur en initialisant le bot', error);
    }
}

// Call the main function to start everything
initialization().catch(error => {
    console.error(`Erreur pendant l'initialisation: `, error);
});
