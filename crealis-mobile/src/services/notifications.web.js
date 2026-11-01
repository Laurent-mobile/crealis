// src/services/notifications.web.js
// Version web - notifications désactivées

export async function registerForPushNotificationsAsync() {
    console.log('📱 Notifications push non disponibles sur le web');
    return null;
}

export async function sendLocalNotification(title, body, data = {}) {
    console.log(`🔔 [SIMULATION] ${title}: ${body}`);
}

export function notifyRechargeSuccess(amount, newBalance) {
    console.log(`🔔 Recharge: ${amount.toLocaleString()} FCFA - Nouveau solde: ${newBalance.toLocaleString()} FCFA`);
}

export function notifyPurchaseSuccess(amount, merchantName, newBalance) {
    console.log(`🔔 Paiement: ${amount.toLocaleString()} FCFA chez ${merchantName}`);
}

export function notifyCashbackReceived(amount, newBalance) {
    console.log(`🔔 Cashback: ${amount.toLocaleString()} FCFA - Nouveau solde: ${newBalance.toLocaleString()} FCFA`);
}
