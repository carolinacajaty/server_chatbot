// npm install connect gemini dotenv
require('dotenv').config(); // Charge les variables depuis le fichier .env (ex: GEMINI_API_KEY)

const connect = require('connect') // Framework middleware, précurseur d'Express (cf. module 'connect' dans le cours)
const { GoogleGenerativeAI } = require('@google/generative-ai');  // Module NPM importé via l'API Modules de CommonJS
const url = require('url'); // Module natif de Node.js pour analyser les URLs

// Création de l'application basée sur un ensemble ordonné de middlewares
const app = connect();
const port = process.env.PORT || 8081;
const gemini = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

// const ollama_host = "localhost",
//    ollama_port = 11434,
//    ollama = new Ollama({ host: `http://${ollama_host}:${ollama_port}` });

const targetModel = "gemini-2.5-flash";

// Premier middleware : Logger basique
// (cf. Principe des middlewares : fonction exécutée avant de passer au 'next')
app.use(function (request, response, next) {
    console.log(`Requête ${request.method} reçue pour l'URL ${request.url}`);

    // Ajout des entêtes CORS pour autoriser les requêtes Fetch depuis le navigateur (Cross-Origin Resource Sharing)
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Gestion de la requête de pré-vérification CORS (preflight request)
    if (request.method === 'OPTIONS') {
        response.writeHead(200); // Définition du statut de la réponse
        response.end(); // Fin de la communication et envoi
        return;
    }

    next(); // Passage de contrôle inconditionnel au middleware suivant
});

// Deuxième middleware : Routage personnalisé (cf. Routage simple dans connect/express)
app.use(function (request, response, next) {
    if (request.method == "POST") {
        app.use(function (request, response, next) {
            if (request.url === "/") {
                response.writeHead(200, {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                });
                response.end('Serveur online');
            } else {
                next();
            }
        });
        if (request.url == "/chat") {
            if (request.headers['content-type'] == 'application/json') {
                response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                // Le corps de la requête est géré par l'API Événements (Event handlers) de Node.js
                // L'événement 'data' est déclenché quand des données arrivent dans le flux
                request.on('data', (d) => {
                    let data = JSON.parse(d);
                    // Utilisation d'une Promesse (alternative moderne aux fonctions de rappel CPS pures)
                    new Promise((finito) => {
                        let res = gemini.models.generateContent({
                            model: targetModel,
                            contents: data.prompt
                        })
                        finito(res)
                    }).then((res) => {
                        response.end(res.text); // Fin de la réponse HTTP
                    })
                })
            } else {
                response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf8' });
                response.end('Mauvais encodage de la requête');
            }
        } else {
            next()
        }
    } else if (request.method === "GET") {
        // Analyse de l'URL pour extraire les paramètres (query string)
        const queryParams = url.parse(request.url, true);
        const userPrompt = queryParams.query.query;

        if (queryParams.pathname === "/chat" && userPrompt) {
            response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });

            // Utilisation d'une fonction asynchrone non-bloquante pour contacter l'API REST de Gemini
            async function fetchGeminiResponse() {
                const aiReply = await gemini.models.generateContent({
                    model: targetModel,
                    contents: userPrompt
                });
                response.end(aiReply.text);
            }

            fetchGeminiResponse();
        } else {
            next();
        }
    } else {
        next();
    }
});

// Troisième middleware : Gestion des erreurs 404 (document introuvable)
app.use(function (request, response) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf8' });
    response.end('Erreur 404 - Introuvable');
});

// Démarrage de la boucle de gestion d'événements asynchrones
app.listen(port, () => {
    console.log(`Le serveur écoute sur http://localhost:${port}`);
});