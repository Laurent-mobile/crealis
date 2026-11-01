// crealis-mobile/src/api/client.js
import axios from 'axios';
import { Platform } from 'react-native';

// Stockage simple en mémoire
let authToken = null;

// 🔧 Détection automatique de l'environnement
const isWeb = Platform.OS === 'web';

// 🔧 URL qui change selon la plateforme
const API_URL = isWeb
    ? 'http://localhost:5000/api'  // Web : backend local
    : 'http://bidentate-shandra-unidentically.ngrok-free.dev/api'; // Mobile : ngrok

console.log('🌐 API URL:', API_URL, '| Platform:', Platform.OS);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Fonction pour définir le token
export const setAuthToken = (token) => {
    authToken = token;
};

// Intercepteur pour ajouter le token + header ngrok si nécessaire
api.interceptors.request.use(
    (config) => {
        if (authToken) {
            config.headers['x-auth-token'] = authToken;
        }
        // Ajouter le header ngrok uniquement sur mobile
        if (!isWeb) {
            config.headers['ngrok-skip-browser-warning'] = 'true';
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            authToken = null;
        }
        return Promise.reject(error);
    }
);

export default api;
