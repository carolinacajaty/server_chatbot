require('dotenv').config();
const { GoogleGenAI } = require('@google/generative-ai');  // Chargement du module externe via l'API Modules de CommonJS (require)

const targetModel = "gemini-2.5-flash";
const userMessage = "Hi, how are you?";

// Instanciation du client Gemini
const llmClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Utilisation de async/await pour gérer l'asynchronisme de Node.js.
// Historiquement, Node.js utilise le pattern CPS (Continuation-passing style) avec des fonctions de rappel (callbacks),
// mais aujourd'hui les Promesses et async/await sont privilégiées pour un code plus déclaratif.
async function run() {
    console.log(`Envoi du message au modèle ${targetModel}...\n`);
    const startTimeStamp = Date.now();

    try {
        // Opération d'entrée/sortie (E/S) asynchrone non-bloquante vers l'API Gemini
        const r = await llmClient.models.generateContent({
            model: targetModel,
            contents: userMessage
        });

        const endTimeStamp = Date.now();
        const durationSeconds = (endTimeStamp - startTimeStamp) / 1000;

        console.log(`--- Réponse de ${targetModel} ---`);
        console.log(r.text);
        console.log(`------------------------------`);
        console.log(`Terminé en ${durationSeconds} secondes.`);

    } catch (error) {
        console.error("Échec de la communication avec l'API Gemini :");
        console.error(error);
    }
}

run();