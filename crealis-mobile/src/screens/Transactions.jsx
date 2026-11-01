// src/screens/Transactions.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Transactions() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');

    useFocusEffect(
        useCallback(() => {
            fetchTransactions();
        }, [])
    );

    const fetchTransactions = async () => {
        try {
            console.log('📊 Chargement des transactions...');
            const response = await api.get('/transactions');
            setTransactions(response.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchTransactions();
    };

    const getFilteredTransactions = () => {
        if (filter === 'all') return transactions;
        return transactions.filter(t => t.type === filter);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'purchase': return '🛒';
            case 'recharge': return '💰';
            case 'cashback': return '⭐';
            case 'refund': return '↩️';
            default: return '💳';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'purchase': return '#ef4444';
            case 'recharge': return '#10b981';
            case 'cashback': return '#f59e0b';
            case 'refund': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Date inconnue';
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) {
            return `Aujourd'hui ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        } else if (d.toDateString() === yesterday.toDateString()) {
            return `Hier ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Statistiques
    const stats = {
        total: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        recharge: transactions.filter(t => t.type === 'recharge').reduce((sum, t) => sum + (t.amount || 0), 0),
        purchase: transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + (t.amount || 0), 0),
        cashback: transactions.filter(t => t.type === 'cashback').reduce((sum, t) => sum + (t.amount || 0), 0),
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📜 Transactions</Text>
                <Text style={styles.headerSubtitle}>{stats.total} transactions</Text>
            </View>

            {/* Cartes statistiques compactes */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
                <TouchableOpacity
                    style={[styles.statCardCompact, filter === 'all' && styles.statCardActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={styles.statIcon}>📊</Text>
                    <Text style={styles.statValue}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statCardCompact, filter === 'recharge' && styles.statCardActive]}
                    onPress={() => setFilter('recharge')}
                >
                    <Text style={styles.statIcon}>💰</Text>
                    <Text style={styles.statValue}>{stats.recharge.toLocaleString()} F</Text>
                    <Text style={styles.statLabel}>Recharges</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statCardCompact, filter === 'purchase' && styles.statCardActive]}
                    onPress={() => setFilter('purchase')}
                >
                    <Text style={styles.statIcon}>🛒</Text>
                    <Text style={styles.statValue}>{stats.purchase.toLocaleString()} F</Text>
                    <Text style={styles.statLabel}>Achats</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statCardCompact, filter === 'cashback' && styles.statCardActive]}
                    onPress={() => setFilter('cashback')}
                >
                    <Text style={styles.statIcon}>⭐</Text>
                    <Text style={styles.statValue}>{stats.cashback.toLocaleString()} F</Text>
                    <Text style={styles.statLabel}>Cashback</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Liste des transactions */}
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                style={styles.list}
                showsVerticalScrollIndicator={false}
            >
                {getFilteredTransactions().length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>Aucune transaction</Text>
                    </View>
                ) : (
                    getFilteredTransactions().map((item) => (
                        <View key={item.id} style={styles.transactionItem}>
                            <View style={styles.transactionIconContainer}>
                                <View style={[styles.transactionIcon, { backgroundColor: getTypeColor(item.type) + '15' }]}>
                                    <Text style={styles.transactionIconText}>{getTypeIcon(item.type)}</Text>
                                </View>
                            </View>
                            <View style={styles.transactionInfo}>
                                <Text style={styles.transactionType}>
                                    {item.type === 'purchase' ? 'Achat' :
                                        item.type === 'recharge' ? 'Recharge' :
                                            item.type === 'cashback' ? 'Cashback' : 'Transaction'}
                                </Text>
                                <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
                                {item.merchant_name && (
                                    <Text style={styles.transactionMerchant}>{item.merchant_name}</Text>
                                )}
                            </View>
                            <View style={styles.transactionAmountContainer}>
                                <Text style={[
                                    styles.transactionAmount,
                                    (item.type === 'recharge' || item.type === 'cashback') ? styles.positive : styles.negative
                                ]}>
                                    {(item.type === 'recharge' || item.type === 'cashback') ? '+' : '-'}{parseInt(item.amount).toLocaleString()} F
                                </Text>
                                <Text style={styles.transactionStatus}>
                                    {item.status === 'completed' ? '✓' :
                                        item.status === 'pending' ? '⏳' : '✗'}
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e' },
    headerSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
    statsScroll: { paddingHorizontal: 15, paddingVertical: 10, maxHeight: 90 },
    statCardCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30,
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statCardActive: { backgroundColor: '#2563eb' },
    statIcon: { fontSize: 16, marginRight: 6 },
    statValue: { fontSize: 14, fontWeight: 'bold', color: '#333', marginRight: 4 },
    statLabel: { fontSize: 11, color: '#666' },
    statCardActiveText: { color: '#fff' },
    list: { flex: 1, paddingHorizontal: 15 },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    transactionIconContainer: { marginRight: 12 },
    transactionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    transactionIconText: { fontSize: 22 },
    transactionInfo: { flex: 1 },
    transactionType: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
    transactionDate: { fontSize: 11, color: '#999', marginTop: 2 },
    transactionMerchant: { fontSize: 11, color: '#666', marginTop: 2 },
    transactionAmountContainer: { alignItems: 'flex-end' },
    transactionAmount: { fontSize: 15, fontWeight: 'bold' },
    positive: { color: '#10b981' },
    negative: { color: '#ef4444' },
    transactionStatus: { fontSize: 10, color: '#999', marginTop: 2 },
    emptyState: { alignItems: 'center', padding: 50 },
    emptyIcon: { fontSize: 60, opacity: 0.5, marginBottom: 10 },
    emptyText: { fontSize: 16, color: '#999' },
});
