import express from 'express';
import cors from 'cors';
import logs from './logsShared.js'
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { deployCommands, deployEvents } from './deploy.js';

let server = undefined

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

export function initServer(port, client) {
    if (server) {
        console.log('Serveur déjà en cours!');
        return;
    }

    server = express();

    // CORS configuration for the client to fetch
    server.use(cors({
        origin: '*', // Allow all origins or set to specific origins like: 'http://localhost:8080'
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

    server.get('/ping', (req, res) => {
        res.send('pong')
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