//src/services/locationService.js
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';
import api from '../api/client';

export async function requestLocationPermission() {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Erreur permission localisation:', error);
        return false;
    }
}

export async function getCurrentPosition() {
    try {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
            Alert.alert(
                'Localisation refusée',
                'Activez la localisation pour trouver les commerçants proches.'
            );
            return null;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
    } catch (error) {
        console.error('Erreur position:', error);
        return null;
    }
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export function getRouteUrl(startLat, startLng, endLat, endLng) {
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${startLat}%2C${startLng}%3B${endLat}%2C${endLng}`;
}
export async function getDeliveryFee(merchantLat, merchantLng, cartTotal) {
    const position = await getCurrentPosition();
    if (!position) return { available: false, fee: 0, distance: 0 };

    const distance = calculateDistance(
        position.latitude, position.longitude,
        merchantLat, merchantLng
    );

    try {
        // Récupérer les paramètres de livraison depuis l'API        const response = await api.get('/settings/livraison');
        const config = response.data;

        const distanceMax = config.distance_max || 20;
        const prixParKm = config.prix_par_km || 200;
        const fraisMin = config.frais_min || 500;
        const fraisMax = config.frais_max || 3000;
        const commandeMin = config.commande_min || 2000;

        // Vérifier si la livraison est possible
        if (distance > distanceMax) {
            return {
                available: false,
                fee: 0,
                distance: Math.round(distance * 10) / 10,
                reason: `Distance trop grande (max ${distanceMax} km)`
            };
        }

        if (cartTotal < commandeMin) {
            return {
                available: false,
                fee: 0,
                distance: Math.round(distance * 10) / 10,
                reason: `Commande minimum ${commandeMin.toLocaleString()} FCFA`
            };
        }

        // Calculer les frais
        let fee = Math.round(distance * prixParKm);
        if (fee < fraisMin) fee = fraisMin;
        if (fee > fraisMax) fee = fraisMax;

        return {
            available: true,
            fee,
            distance: Math.round(distance * 10) / 10,
        };
    } catch (error) {
        // Fallback si l'API est indisponible
        const fee = Math.round(distance * 200);
        return {
            available: true,
            fee: Math.max(500, Math.min(fee, 3000)),
            distance: Math.round(distance * 10) / 10,
        };
    }
}
export function formatDistance(km) {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}
