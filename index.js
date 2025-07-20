import { getDopplerClient } from './utility/doppler.js';
const doppler = await getDopplerClient()
import { getSupabaseClient } from './utility/supabase.js'
import { Client, Events, GatewayIntentBits, Collection, MessageFlags, PresenceUpdateStatus, ThreadAutoArchiveDuration, ChannelType, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { deployCommands } from './deploy-commands.js';
import express from 'express';
import cors from 'cors';

const supabase = getSupabaseClient()

let server = 0;
const logs = []; // Array to store logs

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

        client.on(Events.InteractionCreate, async interaction => {
            if (interaction.isChatInputCommand()) {

                const command = client.commands.get(interaction.commandName);
                if (!command) {
                    console.error(`Aucune commande avec le nom ${interaction.commandName} a été trouvée.`);
                    try {
                        await interaction.reply({
                            content: '# Oups\n\nCette commande n\'existe pas.',
                            flags: MessageFlags.Ephemeral
                        });
                    } catch (error) {
                        console.error('Il y a eu une erreur en envoyant la réponse:', error);
                    }
                    return;
                }
                
                try {
                    await command.execute(interaction);
                } catch (error) {
                    console.error(`Il y a eu une erreur lors de l'exécution de la commande ${interaction.commandName}:`, error);

                    try {
                        const errorMessage = {
                            content: '# Oups\n\nUne erreur est survenue lors de l\'exécution de cette commande.',
                            flags: MessageFlags.Ephemeral
                        };

                        if (!interaction.deferred && !interaction.replied) {
                            await interaction.reply(errorMessage);
                        } else if (interaction.deferred) {
                            await interaction.editReply(errorMessage);
                        } else {
                            await interaction.followUp(errorMessage);
                        }
                    } catch (followUpError) {
                        console.error('Il y a eu une erreur en envoyant la réponse:', followUpError);
                    }
                }
            } else if (interaction.isButton()) {
                if (interaction.customId == "create-ticket") {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral})
                    const { countError, count } = await supabase
                        .from('tickets')
                        .select('*', { count: 'exact' })
                    const thread = await interaction.channel.threads.create({
                        name: `ticket-${count + 1}-${interaction.user.globalName}`,
                        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                        reason: 'Nouveau ticket pour l\'utilisateur ' + interaction.user.username,
                        type: ChannelType.PrivateThread
                    })

                    const transcripts = interaction.guild.channels.cache.find(channel => channel.name.includes("transcripts"))

                    thread.members.add(interaction.user.id)
                    thread.members.add(client.user.id)

                    const welcome = new EmbedBuilder()
                        .setColor("5e34eb")
                        .setTitle("Bienvenue " + interaction.user.displayName)
                        .setDescription(`Veuillez décrire votre situation, nous viendrons à vous dans quelques moments.`)

                    const delete_with_reason = new ButtonBuilder()
                        .setCustomId("delete-ticket-" + (count + 1))
                        .setLabel("Fermer")
                        .setEmoji("❌")
                        .setStyle(ButtonStyle.Primary)

                    const actions = new ActionRowBuilder()
                        .addComponents(delete_with_reason)

                    thread.send({ embeds: [welcome], components: [actions] })

                    const embed = new EmbedBuilder()
                        .setColor("5e34eb")
                        .setTitle("Ticket crée - " + interaction.user.displayName)
                        .setDescription(`Cliquez ci-dessous pour le rejoindre.`)
                    
                    const join = new ButtonBuilder()
                        .setCustomId("join-ticket-" + (count + 1))
                        .setLabel("Rejoindre")
                        .setEmoji("🚪")
                        .setStyle(ButtonStyle.Primary)

                    const row = new ActionRowBuilder()
                        .addComponents(join)

                    transcripts.send( { embeds: [embed], components: [row] } )

                    const { error } = await supabase
                        .from('tickets')
                        .upsert({ user_id: interaction.user.id, ticket_id: (count + 1), closed: false })
                    
                    if (error) {
                        console.error(`❌ Impossible d'insérer ticket pour l'utilisateur ${interaction.user.id}:`, error.message);
                        return;
                    }

                    interaction.editReply({ flags: MessageFlags.Ephemeral, content: 'Ticket crée dans <#' + thread.id + '>!' })
                } else if (interaction.customId.startsWith("join-ticket-")) {
                    interaction.deferReply({flags: MessageFlags.Ephemeral})
                    const threadId = parseInt(interaction.customId.replace("join-ticket-", ""))

                    const ticketChannel = interaction.guild.channels.cache.find(
                        channel => channel.name.includes("créer-un-ticket")
                    );
                    
                    if (!ticketChannel) {
                        console.log("Le salon 'créer-un-ticket' est introuvable.");
                        return;
                    }
                    
                    // Fetch active threads
                    const activeThreads = await ticketChannel.threads.fetchActive();
                    let thread = activeThreads.threads.find(t => t.name.startsWith(`ticket-${threadId}`));
                    
                    if (!thread) {
                        console.log("Thread introuvable.");
                        return;
                    }
                    
                    await thread.members.add(interaction.user.id);       
                    await interaction.editReply({content: 'Vous avez été ajouté au ticket.', flags: MessageFlags.Ephemeral})
                } else if (interaction.customId.startsWith("delete-ticket-")) {
                    const threadId = parseInt(interaction.customId.replace("delete-ticket-", ""))

                    const ticketChannel = interaction.guild.channels.cache.find(
                        channel => channel.name.includes("créer-un-ticket")
                    );
                    
                    if (!ticketChannel) {
                        console.log("Le salon 'créer-un-ticket' est introuvable.");
                        return;
                    }
                    
                    // Fetch active threads
                    const activeThreads = await ticketChannel.threads.fetchActive();
                    let thread = activeThreads.threads.find(t => t.name.startsWith(`ticket-${threadId}`));
                    
                    if (!thread) {
                        console.log("Thread introuvable.");
                        return;
                    }

                    const modal = new ModalBuilder()
                        .setCustomId('reason')
                        .setTitle("Raison de la fermeture")

                    const reasonInput = new TextInputBuilder()
                        .setCustomId("reason-input")
                        .setLabel("Raison")
                        .setStyle(TextInputStyle.Paragraph)
                    
                    const row = new ActionRowBuilder()
                        .addComponents(reasonInput)

                    modal.addComponents(row)

                    await interaction.showModal(modal)

                    const modalSubmitInteraction = await interaction.awaitModalSubmit({
                        filter: (i) => i.customId === 'reason' && i.user.id === interaction.user.id,
                        time: 3600000
                    });

                    modalSubmitInteraction.deferReply({flags: MessageFlags.Ephemeral})
                    
                    const raison = modalSubmitInteraction.fields.getTextInputValue("reason-input")

                    if (raison == "") {
                        raison = "Aucune raison définie."
                    }

                    await thread.send({ content: 'Ce ticket a été fermé par ' + interaction.user.displayName + ' pour la raison: ' + raison })

                    await thread.setLocked(true);
                    await thread.setArchived(true);

                    // update closed to true in supabase
                    const { error } = await supabase
                        .from('tickets')
                        .update({ closed: true })
                        .eq('ticket_id', threadId)

                    if (error) {
                        console.error(`❌ Impossible de mettre à jour le ticket ${threadId} en base de données`, error.message);
                        return;
                    }

                    modalSubmitInteraction.editReply({content: "Ticket fermé", flags: MessageFlags.Ephemeral})
                    const transcripts = interaction.guild.channels.cache.find(channel => channel.name.includes("transcripts"))

                    const embed = new EmbedBuilder()
                        .setColor("5e34eb")
                        .setTitle("Ticket fermé - " + interaction.user.displayName)
                        .setDescription(`Fermé par: ` + interaction.user.displayName + "\nRaison: " + raison)

                    transcripts.send( { embeds: [embed] } )
                }
            }
        });

        client.once(Events.ClientReady, readyClient => {
            console.log(`Connecté en tant que ${readyClient.user.tag}`);
            client.user.setPresence({ activities: [{ name: 'version 0.1.5' }], status: PresenceUpdateStatus.Online });
            initServer(8080, client);
        });

        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error('Erreur en initialisant le bot', error);
    }
}

function initServer(port, client) {
    if (server !== 0) {
        console.log('Serveur déjà en cours!');
        return;
    }

    server = express();

    // CORS configuration for the client to fetch
    server.use(cors({
        origin: '*', // Allow all origins or set to specific origins like: 'http://localhost:3000'
        methods: ['GET', 'POST'], // Allow only GET and POST requests
        allowedHeaders: ['Content-Type', 'Authorization']
    }));

    server.use(express.static('panel'));

    server.get('/', (req, res) => {
        res.sendFile('panel/index.html', { root: '.' }, err => {
            if (err) {
                console.error('Erreur:', err);
                res.status(err.status).end();
            }
        });
    });

    server.post('/api/restart', (req, res) => {
        client.destroy();
        initialization();
        res.send('Redémarrage du bot en cours...');
    });

    // Handle the logs request and return them as a table
    server.get('/api/console', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        const table = logs.map(log => `<tr><td>${log.timestamp}</td><td>${log.message}</td></tr>`).join('');
        res.send(`<table><tr><th>Temps</th><th>Message</th></tr>${table}</table>`);
    });

    server.listen(port, () => {
        console.log(`Serveur placé à http://localhost:${port}`);
    });
}

// Call the main function to start everything
initialization().catch(error => {
    console.error(`Erreur pendant l'initialisation: `, error);
});
