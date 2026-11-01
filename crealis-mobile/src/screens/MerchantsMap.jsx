//src/screens/MerchantsMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Modal,
    Platform,
    Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';
import { getCurrentPosition, calculateDistance, formatDistance } from '../services/locationService';
import MapViewComponent from '../components/MapView';
import { getRouteUrl } from '../services/locationService';
import { useWallet } from '../context/WalletContext';

export default function MerchantsMap() {
    const navigation = useNavigation();
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedMerchant, setSelectedMerchant] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'cashback' | 'name'
    const [deliveryFilter, setDeliveryFilter] = useState(false);
    const mapRef = useRef(null);
    const { refreshWallet } = useWallet();


    useEffect(() => {
        loadData();
        refreshWallet(true); // Rafraîchir le wallet
    }, []);

    const loadData = async () => {
        try {
            const position = await getCurrentPosition();
            setUserLocation(position);

            const response = await api.get('/merchants');
            let merchantsData = response.data.filter(
                m => m.is_active === true || m.is_active === undefined
            );

            // Ajouter des coordonnées simulées si absentes
            merchantsData = merchantsData.map((m, index) => ({
                ...m,
                latitude: m.latitude || 12.3714 + (index * 0.002 - 0.01),
                longitude: m.longitude || -1.5197 + (index * 0.003 - 0.01),
                deliveryAvailable: m.deliveryAvailable !== undefined ? m.deliveryAvailable : Math.random() > 0.5,
                deliveryFee: m.deliveryFee || 500,
                minOrderForDelivery: m.minOrderForDelivery || 2000,
            }));

            if (position) {
                merchantsData = merchantsData.map(m => ({
                    ...m,
                    distance: calculateDistance(
                        position.latitude,
                        position.longitude,
                        m.latitude,
                        m.longitude
                    ),
                }));
                merchantsData.sort((a, b) => a.distance - b.distance);
            }

            setMerchants(merchantsData);
        } catch (error) {
            console.error('Erreur chargement:', error);
            Alert.alert('Erreur', 'Impossible de charger les commerçants');
        } finally {
            setLoading(false);
        }
    };

    const handleMerchantPress = (merchant) => {
        setSelectedMerchant(merchant);
        setShowDetails(true);
    };

    const handlePurchase = () => {
        setShowDetails(false);
        navigation.navigate('Purchase', {
            merchant: selectedMerchant,
            deliveryAvailable: selectedMerchant.deliveryAvailable,
        });
    };

    const getSortedMerchants = () => {
        let sorted = [...merchants];

        if (deliveryFilter) {
            sorted = sorted.filter(m => m.deliveryAvailable);
        }

        switch (sortBy) {
            case 'distance':
                sorted.sort((a, b) => (a.distance || 999) - (b.distance || 999));
                break;
            case 'cashback':
                sorted.sort((a, b) => (b.cashback_percent || 0) - (a.cashback_percent || 0));
                break;
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }
        return sorted;
    };

    const getCategoryIcon = (category) => {
        const icons = {
            supermarket: '🛒', restaurant: '🍽️', boutique: '👕',
            pharmacy: '💊', electronics: '📱', beauty: '💄',
            sports: '⚽', general: '🏪',
        };
        return icons[category] || '🏪';
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Recherche des commerçants...</Text>
            </View>
        );
    }

    const sortedMerchants = getSortedMerchants();
    const markers = sortedMerchants.map(m => ({
        id: m.id,
        latitude: m.latitude,
        longitude: m.longitude,
        name: m.name,
        category: m.category,
        icon: getCategoryIcon(m.category),
    }));

    return (
        <View style={styles.container}>
            {/* Carte */}
            <View style={styles.mapContainer}>
                <MapViewComponent
                    markers={markers}
                    userLocation={userLocation}
                    onMarkerPress={handleMerchantPress}
                    mapRef={mapRef}
                />
                {userLocation && (
                    <View style={styles.locationBadge}>
                        <Text style={styles.locationBadgeText}>📍 Position trouvée</Text>
                    </View>
                )}
            </View>

            {/* Filtres */}
            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[styles.filterBtn, sortBy === 'distance' && styles.filterBtnActive]}
                        onPress={() => setSortBy('distance')}
                    >
                        <Text style={[styles.filterBtnText, sortBy === 'distance' && styles.filterBtnTextActive]}>
                            📍 Proximité
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterBtn, sortBy === 'cashback' && styles.filterBtnActive]}
                        onPress={() => setSortBy('cashback')}
                    >
                        <Text style={[styles.filterBtnText, sortBy === 'cashback' && styles.filterBtnTextActive]}>
                            ⭐ Cashback
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterBtn, sortBy === 'name' && styles.filterBtnActive]}
                        onPress={() => setSortBy('name')}
                    >
                        <Text style={[styles.filterBtnText, sortBy === 'name' && styles.filterBtnTextActive]}>
                            🔤 Nom
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterBtn, deliveryFilter && styles.filterBtnActive]}
                        onPress={() => setDeliveryFilter(!deliveryFilter)}
                    >
                        <Text style={[styles.filterBtnText, deliveryFilter && styles.filterBtnTextActive]}>
                            🚚 {deliveryFilter ? 'Livraison ✓' : 'Livraison'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Liste */}
            <ScrollView style={styles.list}>
                <Text style={styles.listTitle}>
                    {sortedMerchants.length} commerçant(s)
                    {deliveryFilter ? ' avec livraison' : ''}
                </Text>
                {sortedMerchants.map(merchant => (
                    <TouchableOpacity
                        key={merchant.id}
                        style={styles.merchantCard}
                        onPress={() => handleMerchantPress(merchant)}
                    >
                        <View style={styles.merchantIcon}>
                            <Text style={styles.merchantIconText}>{getCategoryIcon(merchant.category)}</Text>
                        </View>
                        <View style={styles.merchantInfo}>
                            <Text style={styles.merchantName}>{merchant.name}</Text>
                            <Text style={styles.merchantCategory}>{merchant.category || 'Général'}</Text>
                            <View style={styles.merchantTags}>
                                {merchant.distance !== undefined && (
                                    <View style={styles.tag}>
                                        <Text style={styles.tagText}>📍 {formatDistance(merchant.distance)}</Text>
                                    </View>
                                )}
                                {merchant.cashback_percent > 0 && (
                                    <View style={[styles.tag, styles.tagCashback]}>
                                        <Text style={[styles.tagText, styles.tagTextCashback]}>
                                            ⭐ {merchant.cashback_percent}%
                                        </Text>
                                    </View>
                                )}
                                {merchant.deliveryAvailable && (
                                    <View style={[styles.tag, styles.tagDelivery]}>
                                        <Text style={[styles.tagText, styles.tagTextDelivery]}>
                                            🚚 Livraison
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <Text style={styles.arrow}>→</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Modal détails */}
            <Modal visible={showDetails} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedMerchant && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalIcon}>{getCategoryIcon(selectedMerchant.category)}</Text>
                                    <Text style={styles.modalName}>{selectedMerchant.name}</Text>
                                    <TouchableOpacity onPress={() => setShowDetails(false)}>
                                        <Text style={styles.modalClose}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.modalBody}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Catégorie</Text>
                                        <Text style={styles.detailValue}>{selectedMerchant.category || 'Général'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Ville</Text>
                                        <Text style={styles.detailValue}>{selectedMerchant.city || 'Ouagadougou'}</Text>
                                    </View>
                                    {selectedMerchant.distance !== undefined && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Distance</Text>
                                            <Text style={styles.detailValue}>📍 {formatDistance(selectedMerchant.distance)}</Text>
                                        </View>
                                    )}
                                    {selectedMerchant.cashback_percent > 0 && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Cashback</Text>
                                            <Text style={[styles.detailValue, { color: '#10b981' }]}>
                                                ⭐ {selectedMerchant.cashback_percent}%
                                            </Text>
                                        </View>
                                    )}

                                    {/* Section livraison */}
                                    <View style={styles.deliverySection}>
                                        <Text style={styles.deliveryTitle}>🚚 Livraison</Text>
                                        {selectedMerchant.deliveryAvailable ? (
                                            <>
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>Frais</Text>
                                                    <Text style={styles.detailValue}>
                                                        {selectedMerchant.deliveryFee?.toLocaleString()} FCFA
                                                    </Text>
                                                </View>
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>Commande min.</Text>
                                                    <Text style={styles.detailValue}>
                                                        {selectedMerchant.minOrderForDelivery?.toLocaleString()} FCFA
                                                    </Text>
                                                </View>
                                            </>
                                        ) : (
                                            <Text style={styles.noDelivery}>Livraison non disponible</Text>
                                        )}
                                    </View>
                                </ScrollView>
                                <View style={styles.modalFooter}>
                                    <TouchableOpacity style={styles.purchaseBtn} onPress={handlePurchase}>
                                        <Text style={styles.purchaseBtnText}>🛒 Voir les produits</Text>
                                    </TouchableOpacity>
                                    {userLocation && selectedMerchant?.latitude && (
                                        <TouchableOpacity
                                            style={styles.routeBtn}
                                            onPress={() => {
                                                const url = getRouteUrl(
                                                    userLocation.latitude,
                                                    userLocation.longitude,
                                                    selectedMerchant.latitude,
                                                    selectedMerchant.longitude
                                                );
                                                Linking.openURL(url);
                                            }}
                                        >
                                            <Text style={styles.routeBtnText}>🗺️ Itinéraire</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#666' },
    mapContainer: { height: 250, position: 'relative' },
    locationBadge: {
        position: 'absolute', top: 10, right: 10,
        backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20,
    },
    locationBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    filtersContainer: {
        backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 10,
        borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
    },
    filterBtn: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#f0f0f0', marginRight: 8,
    },
    filterBtnActive: { backgroundColor: '#2563eb' },
    filterBtnText: { fontSize: 13, color: '#666', fontWeight: '500' },
    filterBtnTextActive: { color: '#fff' },
    list: { flex: 1, padding: 12 },
    listTitle: { fontSize: 14, color: '#666', marginBottom: 10, paddingLeft: 5 },
    merchantCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 14, padding: 14,
        marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
    },
    merchantIcon: {
        width: 55, height: 55, borderRadius: 28,
        backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    merchantIconText: { fontSize: 28 },
    merchantInfo: { flex: 1 },
    merchantName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    merchantCategory: { fontSize: 12, color: '#888', marginTop: 2 },
    merchantTags: { flexDirection: 'row', marginTop: 6, gap: 6, flexWrap: 'wrap' },
    tag: {
        backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    },
    tagText: { fontSize: 11, color: '#2563eb' },
    tagCashback: { backgroundColor: '#d1fae5' },
    tagTextCashback: { color: '#059669' },
    tagDelivery: { backgroundColor: '#fef3c7' },
    tagTextDelivery: { color: '#92400e' },
    arrow: { fontSize: 20, color: '#ccc', marginLeft: 8 },
    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center',
        padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    modalIcon: { fontSize: 30, marginRight: 12 },
    modalName: { fontSize: 18, fontWeight: 'bold', flex: 1 },
    modalClose: { fontSize: 24, color: '#999', padding: 5 },
    modalBody: { padding: 20 },
    detailRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
    },
    detailLabel: { fontSize: 14, color: '#666' },
    detailValue: { fontSize: 14, fontWeight: '500', color: '#333' },
    deliverySection: {
        marginTop: 20, padding: 15,
        backgroundColor: '#fef3c7', borderRadius: 12,
    },
    deliveryTitle: { fontSize: 16, fontWeight: 'bold', color: '#92400e', marginBottom: 10 },
    noDelivery: { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 5 },
    modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    purchaseBtn: {
        backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center',
    },
    purchaseBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    routeBtn: {
        backgroundColor: '#2563eb', padding: 12, borderRadius: 10,
        alignItems: 'center', marginTop: 10,
    },
    routeBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
