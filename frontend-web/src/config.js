// Configuration selon l'environnement
const isProduction = window.location.hostname.includes('ngrok-free.app') ||
    window.location.hostname.includes('ngrok-free.dev');

// URLs
const PRODUCTION_API_URL = 'https://bidentate-shandra-unidentically.ngrok-free.dev/api'; // Remplacez par votre URL ngrok
const DEVELOPMENT_API_URL = 'http://localhost:5000/api';

export const API_URL = isProduction ? PRODUCTION_API_URL : DEVELOPMENT_API_URL;
