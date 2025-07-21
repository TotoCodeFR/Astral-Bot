import express from 'express';
import cors from 'cors';

let server = undefined

export function initServer(port, client) {
    if (server) {
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