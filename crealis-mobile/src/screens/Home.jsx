//src/screens/Home.jsx
import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Ticker from '../components/Ticker';
import { useWallet } from '../context/WalletContext';

export default function Home({ navigation }) {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { balance: walletBalance, points: loyaltyPoints, totalSpent, refreshWallet } = useWallet(); // ✅ Utilise refreshWallet
    const [vipLevel, setVipLevel] = useState('bronze');
    const [recentTransactions, setRecentTransactions] = useState([]);

    useFocusEffect(
        useCallback(() => {
            console.log('🏠 Home focus - Rafraîchissement forcé');
            refreshWallet(true); // Force refresh
            fetchDashboardData();

            // Rafraîchir périodiquement
            const interval = setInterval(() => {
                refreshWallet(true);
            }, 30000); // Toutes les 30 secondes

            return () => clearInterval(interval);
        }, [])
    );

    const fetchDashboardData = async () => {
        try {
            // ✅ refreshWallet est déjà appelé dans useFocusEffect
            const transactionsResponse = await api.get('/transactions');
            setRecentTransactions(transactionsResponse.data.slice(0, 5) || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const handleLogout = () => {
        Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Déconnexion', onPress: () => logout() },
        ]);
    };

    const getVipIcon = (level) => {
        switch (level) {
            case 'platinum': return '💎';
            case 'gold': return '🥇';
            case 'silver': return '🥈';
            default: return '🥉';
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeText}>Bonjour,</Text>
                    <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>🚪</Text>
                </TouchableOpacity>
            </View>

            <Ticker />

            <TouchableOpacity style={styles.walletCard} onPress={() => navigation.navigate('Transactions')} activeOpacity={0.9}>
                <Text style={styles.walletTitle}>💰 Mon Wallet</Text>
                <Text style={styles.walletBalance}>{walletBalance.toLocaleString()} FCFA</Text>
                <TouchableOpacity style={styles.rechargeButton} onPress={() => navigation.navigate('Recharge')}>
                    <Text style={styles.rechargeButtonText}>Recharger →</Text>
                </TouchableOpacity>
            </TouchableOpacity>

            <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Loyalty')}>
                    <Text style={styles.statIcon}>⭐</Text>
                    <Text style={styles.statValue}>{loyaltyPoints}</Text>
                    <Text style={styles.statLabel}>Points fidélité</Text>
                </TouchableOpacity>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>{getVipIcon(vipLevel)}</Text>
                    <Text style={styles.statValue}>{vipLevel}</Text>
                    <Text style={styles.statLabel}>Niveau VIP</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>💰</Text>
                    <Text style={styles.statValue}>{totalSpent.toLocaleString()} FCFA</Text>
                    <Text style={styles.statLabel}>Total dépensé</Text>
                </View>
            </View>

            <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Transactions')}>
                    <Text style={styles.actionIcon}>📜</Text>
                    <Text style={styles.actionLabel}>Transactions</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Loyalty')}>
                    <Text style={styles.actionIcon}>⭐</Text>
                    <Text style={styles.actionLabel}>Fidélité</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MerchantsMap')}>
                    <Text style={styles.actionIcon}>🗺️</Text>
                    <Text style={styles.actionLabel}>Commerçants</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Profile')}>
                    <Text style={styles.actionIcon}>👤</Text>
                    <Text style={styles.actionLabel}>Profil</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.transactionsSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>📋 Dernières transactions</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
                        <Text style={styles.seeAllText}>Voir tout →</Text>
                    </TouchableOpacity>
                </View>
                {recentTransactions.length === 0 ? (
                    <Text style={styles.emptyText}>Aucune transaction récente</Text>
                ) : (
                    recentTransactions.map((item, index) => (
                        <View key={index} style={styles.transactionItem}>
                            <View>
                                <Text style={styles.transactionDesc}>
                                    {item.type === 'recharge' ? '💰 Recharge' : item.type === 'purchase' ? '🛒 Achat' : item.type === 'cashback' ? '⭐ Cashback' : '💳 Transaction'}
                                </Text>
                                <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
                            </View>
                            <Text style={[styles.transactionAmount, (item.type === 'recharge' || item.type === 'cashback') ? styles.positive : styles.negative]}>
                                {item.type === 'recharge' || item.type === 'cashback' ? '+' : '-'}{parseInt(item.amount).toLocaleString()} FCFA
                            </Text>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    welcomeText: { fontSize: 14, color: '#666' },
    userName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    logoutButton: { padding: 10 },
    logoutText: { fontSize: 20 },
    walletCard: { backgroundColor: '#2563eb', margin: 20, padding: 20, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    walletTitle: { color: '#fff', fontSize: 14, opacity: 0.9 },
    walletBalance: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginVertical: 10 },
    rechargeButton: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 10, alignItems: 'center' },
    rechargeButtonText: { color: '#fff', fontWeight: '600' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    statCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, alignItems: 'center', flex: 1, marginHorizontal: 5 },
    statIcon: { fontSize: 24, marginBottom: 5 },
    statValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    statLabel: { fontSize: 11, color: '#999', marginTop: 3 },
    actionsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, paddingHorizontal: 20, flexWrap: 'wrap', gap: 10 },
    actionCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, alignItems: 'center', width: '22%' },
    actionIcon: { fontSize: 28, marginBottom: 8 },
    actionLabel: { fontSize: 11, color: '#666', textAlign: 'center' },
    transactionsSection: { backgroundColor: '#fff', margin: 20, marginTop: 0, padding: 15, borderRadius: 12 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    seeAllText: { fontSize: 12, color: '#2563eb' },
    transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    transactionDesc: { fontSize: 14, color: '#333' },
    transactionDate: { fontSize: 11, color: '#999', marginTop: 2 },
    transactionAmount: { fontSize: 14, fontWeight: '600' },
    positive: { color: '#10b981' },
    negative: { color: '#ef4444' },
    emptyText: { textAlign: 'center', color: '#999', padding: 20 },
});
