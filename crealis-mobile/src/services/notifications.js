// src/services/notifications.js
import { Platform } from 'react-native';

// Vérifier si on est sur web
const isWeb = Platform.OS === 'web';

// Importer conditionnellement les modules natifs (uniquement sur mobile)
let Notifications = null;
let Device = null;

if (!isWeb) {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
}

// Configuration des notifications (uniquement sur mobile)
if (!isWeb && Notifications) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}

// Demander la permission
export async function registerForPushNotificationsAsync() {
    if (isWeb) {
        console.log('📱 Notifications push non disponibles sur le web');
        return null;
    }

    let token;

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }

        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Push token:', token);
    } else {
        console.log('Must use physical device for Push Notifications');
        return null;
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return token;
}

// Envoyer une notification locale
export async function sendLocalNotification(title, body, data = {}) {
    if (isWeb) {
        console.log(`🔔 [SIMULATION] ${title}: ${body}`);
        return;
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: true,
        },
        trigger: null, // Notification immédiate
    });
}

// Notification de recharge
export function notifyRechargeSuccess(amount, newBalance) {
    if (isWeb) {
        console.log(`🔔 Recharge: ${amount.toLocaleString()} FCFA - Nouveau solde: ${newBalance.toLocaleString()} FCFA`);
        return;
    }

    sendLocalNotification(
        '✅ Recharge réussie',
        `${amount.toLocaleString()} FCFA ont été ajoutés à votre wallet. Nouveau solde: ${newBalance.toLocaleString()} FCFA`,
        { type: 'recharge', amount, newBalance }
    );
}

// Notification de paiement
export function notifyPurchaseSuccess(amount, merchantName, newBalance) {
    if (isWeb) {
        console.log(`🔔 Paiement: ${amount.toLocaleString()} FCFA chez ${merchantName} - Nouveau solde: ${newBalance.toLocaleString()} FCFA`);
        return;
    }

    sendLocalNotification(
        '💳 Paiement effectué',
        `${amount.toLocaleString()} FCFA ont été débités chez ${merchantName}. Nouveau solde: ${newBalance.toLocaleString()} FCFA`,
        { type: 'purchase', amount, merchantName, newBalance }
    );
}

// Notification de cashback
export function notifyCashbackReceived(amount, newBalance) {
    if (isWeb) {
        console.log(`🔔 Cashback: ${amount.toLocaleString()} FCFA - Nouveau solde: ${newBalance.toLocaleString()} FCFA`);
        return;
    }

    sendLocalNotification(
        '⭐ Cashback reçu',
        `${amount.toLocaleString()} FCFA de cashback ont été crédités. Nouveau solde: ${newBalance.toLocaleString()} FCFA`,
        { type: 'cashback', amount, newBalance }
    );
}
