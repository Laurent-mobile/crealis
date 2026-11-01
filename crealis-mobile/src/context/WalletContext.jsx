// crealis-mobile/src/context/WalletContext.jsx
import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import api from '../api/client';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
    const [balance, setBalance] = useState(0);
    const [points, setPoints] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);
    const isRefreshing = useRef(false);

    const refreshWallet = useCallback(async (force = false) => {
        // Éviter les appels simultanés
        if (isRefreshing.current) {
            console.log('⚠️ Rafraîchissement déjà en cours, ignoré');
            return;
        }

        isRefreshing.current = true;

        try {
            console.log('🔄 Rafraîchissement du wallet (force=' + force + ')');
            const response = await api.get('/customers/me');
            const newBalance = response.data.walletBalance || 0;
            const newPoints = response.data.loyaltyPoints || 0;
            const newTotalSpent = response.data.totalSpent || 0;

            console.log('📊 Nouvelles valeurs API:', {
                balance: newBalance,
                points: newPoints,
                totalSpent: newTotalSpent
            });

            setBalance(newBalance);
            setPoints(newPoints);
            setTotalSpent(newTotalSpent);

            return { balance: newBalance, points: newPoints, totalSpent: newTotalSpent };
        } catch (error) {
            console.error('❌ Erreur rafraîchissement wallet:', error);
            // Ne pas réinitialiser en cas d'erreur 401
            if (error.response?.status !== 401) {
                throw error;
            }
        } finally {
            isRefreshing.current = false;
        }
    }, []);

    const updateAfterPayment = ({ newBalance, pointsEarned, amount }) => {
        console.log('💳 Mise à jour après paiement:', { newBalance, pointsEarned, amount });
        setBalance(newBalance);
        setPoints(prev => prev + pointsEarned);
        setTotalSpent(prev => prev + amount);
    };

    const updateAfterRecharge = ({ newBalance }) => {
        console.log('💰 Mise à jour après recharge:', { newBalance });
        setBalance(newBalance);
    };

    return (
        <WalletContext.Provider value={{
            balance,
            points,
            totalSpent,
            setBalance,
            setPoints,
            setTotalSpent,
            refreshWallet,
            updateAfterPayment,
            updateAfterRecharge
        }}>
            {children}
        </WalletContext.Provider>
    );
};
