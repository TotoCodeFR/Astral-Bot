import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import logs from './logsShared.js';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { deployCommands, deployEvents } from './deploy.js';
import 'dotenv/config'

let server = undefined;
let client; // Module-level client

const allowedUserIds = ['1127973768648728676', '817758821312495627'];

async function initialization() {
    if (client) {
        client.destroy();
    }
    client = new Client({
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

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated() && allowedUserIds.includes(req.user.id)) {
        return next();
    }

    if (req.isAuthenticated()) {
        // Log out user if they are authenticated but not allowed
        req.logout((err) => {
            if (err) { return next(err); }
            res.redirect('/');
        });
    } else {
        res.redirect('/auth/discord');
    }
}

export function initServer(port) {
    if (server) {
        console.log('Serveur déjà en cours!');
        return;
    }

    server = express();

    // Session middleware
    server.use(session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    }));

    // Passport middleware
    server.use(passport.initialize());
    server.use(passport.session());

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((obj, done) => {
        done(null, obj);
    });

    passport.use(new DiscordStrategy({
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: process.env.DISCORD_CALLBACK_URL,
        scope: ['identify'],
    }, (accessToken, refreshToken, profile, done) => {
        return done(null, allowedUserIds.includes(profile.id) ? profile : false);
    }));

    // CORS configuration for the client to fetch
    server.use(cors({
        origin: '*', // Allow all origins or set to specific origins like: 'http://localhost:8080'
        methods: ['GET', 'POST'], // Allow only GET and POST requests
        allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Auth routes
    server.get('/auth/discord', passport.authenticate('discord'));
    server.get('/auth/discord/callback', passport.authenticate('discord', {
        failureRedirect: '/',
    }), (req, res) => {
        res.redirect('/panel');
    });
    server.get('/auth/logout', (req, res, next) => {
        req.logout((err) => {
            if (err) { return next(err); }
            res.redirect('/');
        });
    });

    server.get('/', (req, res) => {
        if (req.isAuthenticated() && allowedUserIds.includes(req.user.id)) {
            res.redirect('/panel');
        } else {
            res.redirect('/auth/discord')
        }
    });

    server.get('/ping', (req, res) => {
        res.send('pong')
    });

    // Protected routes
    server.use('/panel', ensureAuthenticated, express.static('panel'));

    server.post('/api/restart', ensureAuthenticated, async (req, res) => {
        res.send('Redémarrage du bot en cours...');
        await initialization();
    });

    // Handle the logs request and return them as a table
    server.get('/api/console', ensureAuthenticated, (req, res) => {
        res.setHeader('Content-Type', 'text/html');
        const table = logs.map(log => `<tr><td>${log.timestamp}</td><td>${log.message}</td></tr>`).join('');
        res.send(`<table><tr><th>Temps</th><th>Message</th></tr>${table}</table>`);
    });

    server.listen(port, () => {
        console.log(`Serveur placé à http://localhost:${port}`);
    });
}