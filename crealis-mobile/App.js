// crealis-mobile/App.js
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import { WalletProvider } from './src/context/WalletContext';

export default function App() {
  useEffect(() => {
    const initNotifications = async () => {
      if (Platform.OS !== 'web') {
        const { registerForPushNotificationsAsync } = await import('./src/services/notifications');
        registerForPushNotificationsAsync();
      }
    };
    initNotifications();
  }, []);

  return (
    <AuthProvider>
      <WalletProvider>
        <CartProvider>
          <AppNavigator />
        </CartProvider>
      </WalletProvider>
    </AuthProvider>
  );
}
