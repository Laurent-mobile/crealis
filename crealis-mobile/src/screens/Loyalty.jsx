// src/screens/Loyalty.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import api from '../api/client';
import { useWallet } from '../context/WalletContext';

export default function Loyalty() {
    const [loyaltyData, setLoyaltyData] = useState({
        points: 0,
        vipLevel: 'bronze',
        nextLevel: 'silver',
        pointsToNext: 1000,
        totalSpent: 0,
        cashbackEarned: 0,
        history: [],
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { points: loyaltyPoints, totalSpent } = useWallet();

    useEffect(() => {
        fetchLoyaltyData();
    }, []);

    const fetchLoyaltyData = async () => {
        try {
            const response = await api.get('/loyalty/stats');
            const customerResponse = await api.get('/customers/me');

            setLoyaltyData({
                points: loyaltyPoints,
                vipLevel: customerResponse.data.vipLevel || 'bronze',
                nextLevel: getNextLevel(customerResponse.data.vipLevel),
                pointsToNext: getPointsToNext(customerResponse.data.vipLevel, loyaltyPoints),
                totalSpent: totalSpent, // ✅ du contexte
                cashbackEarned: (totalSpent * 0.02) || 0, // ✅ calculé avec totalSpent du contexte
                history: response.data.recentTransactions || [],
            });
        } catch (error) {
            console.error('Error fetching loyalty data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getNextLevel = (currentLevel) => {
        switch (currentLevel) {
            case 'bronze': return 'silver';
            case 'silver': return 'gold';
            case 'gold': return 'platinum';
            default: return 'platinum';
        }
    };

    const getPointsToNext = (level, currentPoints) => {
        switch (level) {
            case 'bronze': return Math.max(0, 1000 - currentPoints);
            case 'silver': return Math.max(0, 5000 - currentPoints);
            case 'gold': return Math.max(0, 10000 - currentPoints);
            default: return 0;
        }
    };

    const getLevelIcon = (level) => {
        switch (level) {
            case 'platinum': return '💎';
            case 'gold': return '🥇';
            case 'silver': return '🥈';
            default: return '🥉';
        }
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'platinum': return '#8b5cf6';
            case 'gold': return '#f59e0b';
            case 'silver': return '#9ca3af';
            default: return '#cd7f32';
        }
    };

    const getProgressPercentage = () => {
        if (loyaltyData.vipLevel === 'platinum') return 100;
        const max = loyaltyData.vipLevel === 'bronze' ? 1000 : loyaltyData.vipLevel === 'silver' ? 5000 : 10000;
        return (loyaltyData.points / max) * 100;
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchLoyaltyData();
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>⭐ Fidélité</Text>
            </View>

            {/* Carte VIP */}
            <View style={[styles.vipCard, { backgroundColor: getLevelColor(loyaltyData.vipLevel) + '20' }]}>
                <View style={styles.vipHeader}>
                    <Text style={styles.vipIcon}>{getLevelIcon(loyaltyData.vipLevel)}</Text>
                    <Text style={styles.vipLevel}>{loyaltyData.vipLevel.toUpperCase()}</Text>
                </View>
                <Text style={styles.pointsValue}>{loyaltyPoints.toLocaleString()}</Text>
                <Text style={styles.pointsLabel}>Points fidélité</Text>

                {loyaltyData.vipLevel !== 'platinum' && (
                    <>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
                        </View>
                        <Text style={styles.nextLevelText}>
                            Plus que {loyaltyData.pointsToNext} points pour atteindre {loyaltyData.nextLevel}
                        </Text>
                    </>
                )}
            </View>

            {/* Statistiques */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>💰</Text>
                    <Text style={styles.statValue}>{loyaltyData.totalSpent.toLocaleString()} FCFA</Text>
                    <Text style={styles.statLabel}>Total dépensé</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>⭐</Text>
                    <Text style={styles.statValue}>{loyaltyData.cashbackEarned.toLocaleString()} FCFA</Text>
                    <Text style={styles.statLabel}>Cashback gagné</Text>
                </View>
            </View>

            {/* Avantages VIP */}
            <View style={styles.benefitsSection}>
                <Text style={styles.sectionTitle}>✨ Avantages VIP</Text>
                <View style={styles.benefitsGrid}>
                    <View style={styles.benefitCard}>
                        <Text style={styles.benefitIcon}>💳</Text>
                        <Text style={styles.benefitValue}>2%</Text>
                        <Text style={styles.benefitLabel}>Cashback</Text>
                    </View>
                    <View style={styles.benefitCard}>
                        <Text style={styles.benefitIcon}>🎁</Text>
                        <Text style={styles.benefitValue}>200</Text>
                        <Text style={styles.benefitLabel}>Points anniversaire</Text>
                    </View>
                    <View style={styles.benefitCard}>
                        <Text style={styles.benefitIcon}>🚀</Text>
                        <Text style={styles.benefitValue}>Priorité</Text>
                        <Text style={styles.benefitLabel}>Support client</Text>
                    </View>
                </View>
            </View>

            {/* Historique des points */}
            <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>📜 Historique des points</Text>
                {loyaltyData.history.length === 0 ? (
                    <Text style={styles.emptyText}>Aucun historique</Text>
                ) : (
                    loyaltyData.history.slice(0, 5).map((item, index) => (
                        <View key={index} style={styles.historyItem}>
                            <Text style={styles.historyDesc}>{item.description || 'Transaction'}</Text>
                            <Text style={styles.historyPoints}>+{item.points || 0} pts</Text>
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
    header: { padding: 20, backgroundColor: '#10b981' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    vipCard: { margin: 20, padding: 20, borderRadius: 15, alignItems: 'center' },
    vipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    vipIcon: { fontSize: 32, marginRight: 10 },
    vipLevel: { fontSize: 18, fontWeight: 'bold' },
    pointsValue: { fontSize: 48, fontWeight: 'bold', marginVertical: 10 },
    pointsLabel: { fontSize: 14, color: '#666' },
    progressBar: { width: '100%', height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginTop: 15, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 4 },
    nextLevelText: { fontSize: 12, color: '#666', marginTop: 10 },
    statsGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 15, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 12, alignItems: 'center' },
    statIcon: { fontSize: 24, marginBottom: 8 },
    statValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    statLabel: { fontSize: 11, color: '#999', marginTop: 4 },
    benefitsSection: { paddingHorizontal: 20, marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    benefitsGrid: { flexDirection: 'row', gap: 15 },
    benefitCard: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 12, alignItems: 'center' },
    benefitIcon: { fontSize: 28, marginBottom: 8 },
    benefitValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    benefitLabel: { fontSize: 11, color: '#999', marginTop: 4 },
    historySection: { paddingHorizontal: 20, paddingBottom: 30 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#fff', borderRadius: 10, marginBottom: 8 },
    historyDesc: { fontSize: 14, color: '#333' },
    historyPoints: { fontSize: 14, fontWeight: 'bold', color: '#10b981' },
    emptyText: { textAlign: 'center', color: '#999', padding: 20 },
});
