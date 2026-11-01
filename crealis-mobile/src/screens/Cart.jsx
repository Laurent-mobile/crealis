//src/screens/Cart.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useWallet } from '../context/WalletContext';

export default function Cart() {
    const navigation = useNavigation();
    const { cartItems, cartTotal, cartCount, removeFromCart, updateQuantity, clearCart, getCartItemsByMerchant } = useCart();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const { balance: walletBalance, refreshWallet, updateAfterPayment } = useWallet(); // ✅ Utilise updateAfterPayment
    const [showSuccess, setShowSuccess] = useState(false);
    const [successData, setSuccessData] = useState(null);

    // Dans le useEffect qui charge le wallet
    useEffect(() => {
        console.log('🛒 Cart monté - Rafraîchissement forcé');
        refreshWallet(true);

        // Rafraîchir périodiquement
        const interval = setInterval(() => {
            refreshWallet(true);
        }, 20000);

        return () => clearInterval(interval);
    }, []);


    const handleCheckout = async () => {
        console.log('🛒 handleCheckout appelé !');
        if (loading) return;

        if (cartItems.length === 0) {
            console.log('📭 Panier vide');
            Alert.alert('Panier vide', 'Ajoutez des produits avant de valider');
            return;
        }

        // ✅ Vérifier le solde AVANT de demander confirmation
        const freshData = await refreshWallet(true);
        const currentBalance = freshData?.balance || walletBalance;

        if (cartTotal > currentBalance) {
            console.log('❌ Solde insuffisant:', { cartTotal, currentBalance });
            Alert.alert(
                'Solde insuffisant',
                `Il manque ${(cartTotal - currentBalance).toLocaleString()} FCFA`,
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Recharger', onPress: () => navigation.navigate('Recharge') },
                ]
            );
            return;
        }

        console.log('✅ Solde OK, demande confirmation...');
        Alert.alert(
            'Confirmer le paiement',
            `Payer ${cartTotal.toLocaleString()} FCFA ?\nSolde: ${currentBalance.toLocaleString()} FCFA`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: '✅ Payer',
                    onPress: async () => {
                        console.log('💳 Paiement confirmé !');
                        setLoading(true);
                        try {
                            const response = await api.post('/transactions/purchase', {
                                amount: cartTotal,
                                merchantId: cartItems[0].merchantId,
                                customerId: user?.id,
                                items: cartItems.map(item => ({
                                    productId: item.productId,
                                    quantity: item.quantity,
                                    price: item.price
                                })),
                                paymentMethod: 'wallet',
                            });

                            console.log('✅ Réponse API:', response.data);

                            if (response.data.success) {
                                const pointsEarned = Math.floor(cartTotal / 100);
                                const newBalance = response.data.transaction?.newBalance || currentBalance - cartTotal;

                                // ✅ Mise à jour locale immédiate
                                updateAfterPayment({
                                    newBalance: newBalance,
                                    pointsEarned: pointsEarned,
                                    amount: cartTotal
                                });

                                // ✅ Rafraîchir depuis l'API pour confirmer
                                setTimeout(async () => {
                                    console.log('🔄 Vérification post-paiement...');
                                    await refreshWallet(true);
                                }, 1000);

                                setSuccessData({
                                    total: cartTotal,
                                    count: cartCount,
                                    points: pointsEarned,
                                    newBalance: newBalance,
                                });
                                setShowSuccess(true);
                                clearCart();
                            } else {
                                Alert.alert('❌ Erreur', response.data.message || 'Paiement échoué');
                                // Rafraîchir le wallet en cas d'erreur
                                await refreshWallet(true);
                            }
                        } catch (error) {
                            console.error('❌ Erreur paiement:', error);
                            Alert.alert(
                                'Erreur',
                                error.response?.data?.message || 'Erreur lors du paiement'
                            );
                            // Rafraîchir le wallet après erreur
                            await refreshWallet(true);
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    if (cartItems.length === 0 && !showSuccess) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyTitle}>Panier vide</Text>
                <Text style={styles.emptyText}>Ajoutez des produits depuis une boutique</Text>
                <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('MerchantsMap')}>
                    <Text style={styles.shopButtonText}>🛍️ Voir les commerçants</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const merchants = getCartItemsByMerchant();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🛒 Mon Panier</Text>
                <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
                    <Text style={styles.clearButtonText}>🗑️</Text>
                </TouchableOpacity>
            </View>

            {/* Solde */}
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Votre solde</Text>
                <Text style={styles.balanceValue}>{walletBalance.toLocaleString()} FCFA</Text>
                {cartTotal > walletBalance && (
                    <TouchableOpacity
                        style={styles.rechargeBtn}
                        onPress={() => navigation.navigate('Recharge')}
                    >
                        <Text style={styles.rechargeBtnText}>⚠️ Solde insuffisant - Recharger</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.cartList}>
                {merchants.map((merchant) => (
                    <View key={merchant.merchantId} style={styles.merchantSection}>
                        <View style={styles.merchantHeader}>
                            <Text style={styles.merchantName}>🏪 {merchant.merchantName}</Text>
                            <Text style={styles.merchantTotal}>{merchant.total.toLocaleString()} FCFA</Text>
                        </View>

                        {merchant.items.map((item) => (
                            <View key={item.id} style={styles.cartItem}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.productName}</Text>
                                    <Text style={styles.itemPrice}>
                                        {item.productPrice.toLocaleString()} FCFA × {item.quantity}
                                    </Text>
                                </View>
                                <View style={styles.itemActions}>
                                    <TouchableOpacity
                                        style={styles.qtyBtn}
                                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                                    >
                                        <Text style={styles.qtyBtnText}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                                    <TouchableOpacity
                                        style={styles.qtyBtn}
                                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                                    >
                                        <Text style={styles.qtyBtnText}>+</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.removeBtn}
                                        onPress={() => removeFromCart(item.id)}
                                    >
                                        <Text style={styles.removeBtnText}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                ))}

                {/* Total */}
                <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{cartTotal.toLocaleString()} FCFA</Text>
                </View>

                {/* Bouton Payer */}
                <TouchableOpacity
                    style={[
                        styles.checkoutButton,
                        loading && styles.checkoutButtonDisabled,
                        { zIndex: 999 }
                    ]}
                    onPress={handleCheckout}
                    disabled={loading}
                    activeOpacity={0.7}
                >
                    {loading ? (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator color="#fff" size="small" />
                            <Text style={styles.checkoutButtonText}>  Paiement en cours...</Text>
                        </View>
                    ) : (
                        <Text style={styles.checkoutButtonText}>
                            💳 Payer {cartTotal.toLocaleString()} FCFA
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* Modal de succès */}
            <Modal visible={showSuccess} transparent animationType="fade">
                <View style={styles.successOverlay}>
                    <View style={styles.successCard}>
                        <Text style={styles.successIcon}>🎉</Text>
                        <Text style={styles.successTitle}>Paiement réussi !</Text>
                        <Text style={styles.successAmount}>
                            {successData?.total?.toLocaleString()} FCFA
                        </Text>
                        <Text style={styles.successItems}>
                            {successData?.count} article(s) acheté(s)
                        </Text>
                        {successData?.points > 0 && (
                            <View style={styles.successPoints}>
                                <Text style={styles.successPointsText}>
                                    ⭐ +{successData.points} points de fidélité
                                </Text>
                            </View>
                        )}
                        <View style={styles.successBalance}>
                            <Text style={styles.successBalanceLabel}>Nouveau solde</Text>
                            <Text style={styles.successBalanceValue}>
                                {walletBalance.toLocaleString()} FCFA
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.successButton}
                            onPress={() => {
                                setShowSuccess(false);
                                navigation.navigate('MerchantsMap');
                            }}
                        >
                            <Text style={styles.successButtonText}>🛍️ Continuer mes achats</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.successHomeButton}
                            onPress={() => {
                                setShowSuccess(false);
                                navigation.navigate('Home');
                            }}
                        >
                            <Text style={styles.successHomeText}>🏠 Retour à l'accueil</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        padding: 20, backgroundColor: '#10b981',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    backIcon: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    clearButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    clearButtonText: { fontSize: 20 },
    balanceCard: {
        backgroundColor: '#2563eb', margin: 15, padding: 15,
        borderRadius: 12, alignItems: 'center',
    },
    balanceLabel: { color: '#fff', fontSize: 12, opacity: 0.9 },
    balanceValue: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 5 },
    rechargeBtn: {
        marginTop: 10, backgroundColor: '#ef4444',
        paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20,
    },
    rechargeBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    cartList: { flex: 1, paddingHorizontal: 15 },
    merchantSection: {
        backgroundColor: '#fff', borderRadius: 12,
        marginBottom: 15, overflow: 'hidden',
    },
    merchantHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        padding: 12, backgroundColor: '#f8f9fa',
        borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
    },
    merchantName: { fontSize: 14, fontWeight: '600', color: '#333' },
    merchantTotal: { fontSize: 14, fontWeight: 'bold', color: '#10b981' },
    cartItem: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', padding: 12,
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '500', color: '#333' },
    itemPrice: { fontSize: 12, color: '#666', marginTop: 2 },
    itemActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    qtyBtn: {
        width: 28, height: 28, backgroundColor: '#f0f0f0',
        borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    },
    qtyBtnText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    qtyValue: { fontSize: 14, fontWeight: '500', minWidth: 25, textAlign: 'center' },
    removeBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    removeBtnText: { fontSize: 16 },
    totalSection: {
        flexDirection: 'row', justifyContent: 'space-between',
        backgroundColor: '#fff', padding: 15, borderRadius: 12,
        marginTop: 10, marginBottom: 15,
    },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    totalValue: { fontSize: 20, fontWeight: 'bold', color: '#10b981' },
    checkoutButton: {
        backgroundColor: '#10b981', padding: 18,
        borderRadius: 12, alignItems: 'center', marginBottom: 30,
    },
    checkoutButtonDisabled: { backgroundColor: '#9ca3af' },
    checkoutButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    loadingRow: { flexDirection: 'row', alignItems: 'center' },
    // Empty
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyIcon: { fontSize: 80, marginBottom: 20, opacity: 0.5 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    emptyText: { fontSize: 14, color: '#666', marginBottom: 30 },
    shopButton: { backgroundColor: '#10b981', padding: 15, borderRadius: 10 },
    shopButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    // Success Modal
    successOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', alignItems: 'center',
    },
    successCard: {
        backgroundColor: '#fff', borderRadius: 20,
        padding: 30, alignItems: 'center', width: '85%',
    },
    successIcon: { fontSize: 60, marginBottom: 10 },
    successTitle: { fontSize: 22, fontWeight: 'bold', color: '#10b981', marginBottom: 10 },
    successAmount: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    successItems: { fontSize: 14, color: '#666', marginBottom: 15 },
    successPoints: {
        backgroundColor: '#fef3c7', paddingHorizontal: 15,
        paddingVertical: 8, borderRadius: 20, marginBottom: 15,
    },
    successPointsText: { fontSize: 14, color: '#92400e', fontWeight: '600' },
    successBalance: {
        backgroundColor: '#f0fdf4', padding: 15,
        borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 20,
    },
    successBalanceLabel: { fontSize: 12, color: '#666' },
    successBalanceValue: { fontSize: 20, fontWeight: 'bold', color: '#10b981', marginTop: 5 },
    successButton: {
        backgroundColor: '#10b981', padding: 15,
        borderRadius: 10, width: '100%', alignItems: 'center',
    },
    successButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    successHomeButton: { marginTop: 10, padding: 10 },
    successHomeText: { color: '#666', fontSize: 14 },
});
