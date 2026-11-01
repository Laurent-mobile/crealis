// src/services/notifications.native.js
import { Platform, Alert } from 'react-native';

const isExpoGo = !__DEV__ || true; // Simplification

export async function registerForPushNotificationsAsync() {
    console.log('⚠️ Notifications désactivées pour les tests');
    return null;
}

export async function sendLocalNotification(title, body, data = {}) {
    console.log(`🔔 ${title}: ${body}`);
    // Afficher une alerte simple à la place
    Alert.alert(title, body);
}

export function notifyRechargeSuccess(amount, newBalance) {
    sendLocalNotification(
        '✅ Recharge réussie',
        `${amount.toLocaleString()} FCFA ajoutés. Nouveau solde: ${newBalance.toLocaleString()} FCFA`
    );
}

export function notifyPurchaseSuccess(amount, merchantName, newBalance) {
    sendLocalNotification(
        '💳 Paiement effectué',
        `${amount.toLocaleString()} FCFA débités chez ${merchantName}`
    );
}

export function notifyCashbackReceived(amount, newBalance) {
    sendLocalNotification(
        '⭐ Cashback reçu',
        `${amount.toLocaleString()} FCFA de cashback crédités`
    );
}
