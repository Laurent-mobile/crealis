// crealis-mobile/src/screens/Purchase.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
    Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useWallet } from '../context/WalletContext';
import api from '../api/client';
import { getCurrentPosition, calculateDistance } from '../services/locationService';

export default function Purchase() {
    const navigation = useNavigation();
    const route = useRoute();
    const { merchant } = route.params;
    const { addToCart, cartCount } = useCart();
    const { balance: walletBalance, refreshWallet } = useWallet();

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loadingProducts, setLoadingProducts] = useState(true);

    // 🚚 États pour la livraison
    const [deliveryEnabled, setDeliveryEnabled] = useState(false);
    const [deliverySettings, setDeliverySettings] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [deliveryDistance, setDeliveryDistance] = useState(null);
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchDeliverySettings();
        getUserLocation();
        refreshWallet(true);
    }, []);

    // 🚚 Récupérer les paramètres de livraison depuis l'API
    const fetchDeliverySettings = async () => {
        try {
            const response = await api.get('/settings');
            const data = response.data;
            setDeliverySettings({
                prix_par_km: parseFloat(data.prix_par_km) || 200,
                distance_max: parseFloat(data.distance_max) || 20,
                frais_min: parseFloat(data.frais_min) || 500,
                frais_max: parseFloat(data.frais_max) || 5000,
                frais_fixes: parseFloat(data.frais_fixes) || 300,
                commande_min: parseFloat(data.commande_min) || 2000,
                delai_livraison: parseFloat(data.delai_livraison) || 45,
                delai_express: parseFloat(data.delai_express) || 20,
                supplement_express: parseFloat(data.supplement_express) || 1000,
                livraison_gratuite_des: parseFloat(data.livraison_gratuite_des) || 50000,
                heure_debut: data.heure_debut || '08:00',
                heure_fin: data.heure_fin || '20:00',
                jours_livraison: data.jours_livraison || 'Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi',
            });
        } catch (error) {
            console.error('Erreur chargement paramètres livraison:', error);
            // Valeurs par défaut si l'API échoue
            setDeliverySettings({
                prix_par_km: 200,
                distance_max: 20,
                frais_min: 500,
                frais_max: 5000,
                frais_fixes: 300,
                commande_min: 2000,
                delai_livraison: 45,
                delai_express: 20,
                supplement_express: 1000,
                livraison_gratuite_des: 50000,
            });
        }
    };

    // 🚚 Obtenir la position de l'utilisateur
    const getUserLocation = async () => {
        try {
            const position = await getCurrentPosition();
            setUserLocation(position);

            // Calculer la distance jusqu'au commerçant
            if (position && merchant.latitude && merchant.longitude) {
                const distance = calculateDistance(
                    position.latitude,
                    position.longitude,
                    merchant.latitude,
                    merchant.longitude
                );
                setDeliveryDistance(distance);
            }
        } catch (error) {
            console.error('Erreur géolocalisation:', error);
        }
    };

    // 🚚 Calculer les frais de livraison
    const calculateDeliveryFee = () => {
        if (!deliverySettings || !deliveryDistance) return 0;

        const { prix_par_km, frais_min, frais_max, frais_fixes, distance_max } = deliverySettings;

        // Vérifier si la distance est dans la limite
        if (deliveryDistance > distance_max) return -1; // -1 = trop loin

        // Calcul : frais fixes + (prix par km × distance)
        let fee = frais_fixes + (prix_par_km * deliveryDistance);

        // Appliquer le minimum et maximum
        fee = Math.max(fee, frais_min);
        fee = Math.min(fee, frais_max);

        return Math.round(fee);
    };

    // 🚚 Vérifier si la livraison est disponible maintenant
    const isDeliveryAvailableNow = () => {
        if (!deliverySettings) return false;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinutes;

        const [startHour, startMinute] = (deliverySettings.heure_debut || '08:00').split(':').map(Number);
        const [endHour, endMinute] = (deliverySettings.heure_fin || '20:00').split(':').map(Number);
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        // Vérifier le jour
        const jours = (deliverySettings.jours_livraison || '').split(',');
        const joursFrancais = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const todayName = joursFrancais[now.getDay()];

        if (!jours.includes(todayName)) return false;

        // Vérifier l'heure
        return currentTime >= startTime && currentTime <= endTime;
    };

    // 🚚 Vérifier si la livraison est gratuite
    const isDeliveryFree = (productPrice, quantity) => {
        if (!deliverySettings) return false;
        const totalAmount = productPrice * quantity;
        return totalAmount >= (deliverySettings.livraison_gratuite_des || 50000);
    };

    const fetchProducts = async () => {
        try {
            setLoadingProducts(true);
            const response = await api.get(`/products?merchantId=${merchant.id}`);
            const productsData = response.data.products || response.data || [];
            const availableProducts = productsData.filter(p => (p.stock || 0) > 0);
            setProducts(availableProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    // 🚚 Gérer l'activation/désactivation de la livraison
    const toggleDelivery = () => {
        if (!deliveryEnabled) {
            // Vérifier si la livraison est disponible
            const fee = calculateDeliveryFee();

            if (fee === -1) {
                Alert.alert(
                    'Livraison indisponible',
                    `La distance (${deliveryDistance?.toFixed(1)} km) dépasse la limite de ${deliverySettings?.distance_max || 20} km.`
                );
                return;
            }

            if (!isDeliveryAvailableNow()) {
                Alert.alert(
                    'Livraison indisponible',
                    `Les livraisons sont disponibles du ${deliverySettings?.heure_debut || '08:00'} au ${deliverySettings?.heure_fin || '20:00'}.`
                );
                return;
            }

            setDeliveryFee(fee);
        }
        setDeliveryEnabled(!deliveryEnabled);
    };

    const handleAddToCart = () => {
        if (!selectedProduct) {
            Alert.alert('Erreur', 'Veuillez sélectionner un produit');
            return;
        }

        const totalAmount = selectedProduct.price * quantity;

        // 🚚 Vérifier le minimum de commande si livraison activée
        if (deliveryEnabled && deliverySettings) {
            if (totalAmount < deliverySettings.commande_min) {
                Alert.alert(
                    'Montant minimum',
                    `Le montant minimum pour la livraison est de ${deliverySettings.commande_min.toLocaleString()} FCFA.`
                );
                return;
            }
        }

        // Construire l'objet produit avec les infos de livraison
        const productWithDelivery = {
            ...selectedProduct,
            delivery: deliveryEnabled,
            deliveryFee: deliveryEnabled ? deliveryFee : 0,
            deliveryFree: deliveryEnabled ? isDeliveryFree(selectedProduct.price, quantity) : false,
            deliveryDistance: deliveryEnabled ? deliveryDistance : null,
            deliveryTime: deliveryEnabled ? (deliverySettings?.delai_livraison || 45) : null,
        };

        addToCart(productWithDelivery, merchant, quantity);

        const message = deliveryEnabled
            ? `✅ ${quantity}x ${selectedProduct.name} ajouté au panier\n🚚 Livraison: ${deliveryFee.toLocaleString()} FCFA`
            : `✅ ${quantity}x ${selectedProduct.name} ajouté au panier`;

        Alert.alert('Ajouté au panier', message);
        setSelectedProduct(null);
        setQuantity(1);
        setDeliveryEnabled(false);
    };

    const goToCart = () => {
        navigation.navigate('Cart');
    };

    // Calculer le total avec livraison
    const getTotalWithDelivery = () => {
        if (!selectedProduct) return 0;
        let total = selectedProduct.price * quantity;
        if (deliveryEnabled) {
            total += isDeliveryFree(selectedProduct.price, quantity) ? 0 : deliveryFee;
        }
        return total;
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🛒 Achat</Text>
                <TouchableOpacity onPress={goToCart} style={styles.cartButton}>
                    <Text style={styles.cartIcon}>🛒</Text>
                    {cartCount > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{cartCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Carte commerçant */}
            <View style={styles.merchantCard}>
                <Text style={styles.merchantIcon}>🏪</Text>
                <View style={styles.merchantInfo}>
                    <Text style={styles.merchantName}>{merchant.name}</Text>
                    <Text style={styles.merchantCity}>{merchant.city || 'Ouagadougou'}</Text>
                    {deliveryDistance && (
                        <Text style={styles.merchantDistance}>
                            📍 À {deliveryDistance.toFixed(1)} km
                        </Text>
                    )}
                </View>
            </View>

            {/* Solde */}
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Votre solde</Text>
                <Text style={styles.balanceValue}>{walletBalance.toLocaleString()} FCFA</Text>
            </View>

            {/* 🚚 OPTION LIVRAISON - Visible en permanence */}
            <View style={styles.deliverySection}>
                <TouchableOpacity
                    style={[
                        styles.deliveryCard,
                        deliveryEnabled && styles.deliveryCardActive
                    ]}
                    onPress={toggleDelivery}
                    activeOpacity={0.8}
                >
                    <View style={styles.deliveryHeader}>
                        <View style={styles.deliveryTitleRow}>
                            <Text style={styles.deliveryIcon}>🚚</Text>
                            <View style={styles.deliveryTitleInfo}>
                                <Text style={styles.deliveryTitle}>Livraison à domicile</Text>
                                {deliveryDistance && (
                                    <Text style={styles.deliverySubtitle}>
                                        Distance : {deliveryDistance.toFixed(1)} km
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={[
                            styles.deliveryCheckbox,
                            deliveryEnabled && styles.deliveryCheckboxActive
                        ]}>
                            {deliveryEnabled && <Text style={styles.deliveryCheckmark}>✓</Text>}
                        </View>
                    </View>

                    {deliveryEnabled && (
                        <View style={styles.deliveryDetails}>
                            {/* Frais de livraison */}
                            <View style={styles.deliveryDetailRow}>
                                <Text style={styles.deliveryDetailLabel}>Frais de livraison</Text>
                                {isDeliveryFree(selectedProduct?.price || 0, quantity) ? (
                                    <View style={styles.freeDeliveryBadge}>
                                        <Text style={styles.freeDeliveryText}>🎁 GRATUIT</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.deliveryDetailValue}>
                                        {deliveryFee.toLocaleString()} FCFA
                                    </Text>
                                )}
                            </View>

                            {/* Délai estimé */}
                            <View style={styles.deliveryDetailRow}>
                                <Text style={styles.deliveryDetailLabel}>Délai estimé</Text>
                                <Text style={styles.deliveryDetailValue}>
                                    ⏱️ {deliverySettings?.delai_livraison || 45} min
                                </Text>
                            </View>

                            {/* Distance */}
                            <View style={styles.deliveryDetailRow}>
                                <Text style={styles.deliveryDetailLabel}>Distance</Text>
                                <Text style={styles.deliveryDetailValue}>
                                    📍 {deliveryDistance?.toFixed(1) || '?'} km
                                </Text>
                            </View>

                            {/* Horaires */}
                            <View style={styles.deliveryDetailRow}>
                                <Text style={styles.deliveryDetailLabel}>Horaires</Text>
                                <Text style={styles.deliveryDetailValue}>
                                    🕐 {deliverySettings?.heure_debut || '08:00'} - {deliverySettings?.heure_fin || '20:00'}
                                </Text>
                            </View>

                            {/* Détail du calcul */}
                            <TouchableOpacity
                                style={styles.deliveryInfoButton}
                                onPress={() => setShowDeliveryInfo(true)}
                            >
                                <Text style={styles.deliveryInfoButtonText}>
                                    ℹ️ Détail du calcul
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {!deliveryEnabled && (
                        <Text style={styles.deliveryHint}>
                            Appuyez pour activer la livraison 🚚
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Produits */}
            <View style={styles.form}>
                <Text style={styles.sectionTitle}>📦 Produits disponibles</Text>

                {loadingProducts ? (
                    <ActivityIndicator size="small" color="#2563eb" style={styles.productsLoader} />
                ) : products.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsList}>
                        {products.map((product) => (
                            <TouchableOpacity
                                key={product.id}
                                style={[
                                    styles.productCard,
                                    selectedProduct?.id === product.id && styles.productCardActive
                                ]}
                                onPress={() => {
                                    setSelectedProduct(product);
                                    setQuantity(1);
                                }}
                            >
                                {product.image_url ? (
                                    <Image
                                        source={{ uri: product.image_url }}
                                        style={styles.productImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.productImagePlaceholder}>
                                        <Text style={styles.productImagePlaceholderText}>📦</Text>
                                    </View>
                                )}
                                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                                <Text style={styles.productPrice}>
                                    {parseInt(product.price).toLocaleString()} FCFA
                                </Text>
                                <Text style={styles.productStock}>Stock: {product.stock}</Text>
                                {selectedProduct?.id === product.id && (
                                    <View style={styles.selectedBadge}>
                                        <Text style={styles.selectedBadgeText}>✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.noProductsContainer}>
                        <Text style={styles.noProductsIcon}>🏪</Text>
                        <Text style={styles.noProductsTitle}>Aucun produit disponible</Text>
                        <Text style={styles.noProductsText}>
                            Ce commerçant n'a pas encore de produits en stock.
                        </Text>
                    </View>
                )}

                {/* Sélecteur de quantité et résumé */}
                {selectedProduct && (
                    <>
                        <Text style={styles.sectionTitle}>🔢 Quantité</Text>
                        <View style={styles.quantityContainer}>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                                <Text style={styles.quantityButtonText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.quantityValue}>{quantity}</Text>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                            >
                                <Text style={styles.quantityButtonText}>+</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Résumé du prix */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Sous-total</Text>
                                <Text style={styles.summaryValue}>
                                    {(selectedProduct.price * quantity).toLocaleString()} FCFA
                                </Text>
                            </View>

                            {deliveryEnabled && (
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Livraison</Text>
                                    {isDeliveryFree(selectedProduct.price, quantity) ? (
                                        <Text style={styles.summaryFree}>Gratuit 🎁</Text>
                                    ) : (
                                        <Text style={styles.summaryValue}>
                                            {deliveryFee.toLocaleString()} FCFA
                                        </Text>
                                    )}
                                </View>
                            )}

                            <View style={[styles.summaryRow, styles.summaryTotal]}>
                                <Text style={styles.summaryTotalLabel}>Total</Text>
                                <Text style={styles.summaryTotalValue}>
                                    {getTotalWithDelivery().toLocaleString()} FCFA
                                </Text>
                            </View>
                        </View>

                        {/* Bouton Ajouter au panier */}
                        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
                            <Text style={styles.addToCartButtonText}>
                                {deliveryEnabled ? '🛒🚚' : '🛒'} Ajouter au panier
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Modal d'information livraison */}
            <Modal visible={showDeliveryInfo} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>📊 Détail des frais de livraison</Text>

                        <View style={styles.modalDetailRow}>
                            <Text style={styles.modalDetailLabel}>Frais fixes</Text>
                            <Text style={styles.modalDetailValue}>
                                {deliverySettings?.frais_fixes?.toLocaleString() || 0} FCFA
                            </Text>
                        </View>
                        <View style={styles.modalDetailRow}>
                            <Text style={styles.modalDetailLabel}>
                                Prix/km ({deliveryDistance?.toFixed(1)} km)
                            </Text>
                            <Text style={styles.modalDetailValue}>
                                {deliverySettings?.prix_par_km?.toLocaleString() || 200} FCFA/km
                            </Text>
                        </View>
                        <View style={styles.modalDetailRow}>
                            <Text style={styles.modalDetailLabel}>Minimum</Text>
                            <Text style={styles.modalDetailValue}>
                                {deliverySettings?.frais_min?.toLocaleString() || 500} FCFA
                            </Text>
                        </View>
                        <View style={styles.modalDetailRow}>
                            <Text style={styles.modalDetailLabel}>Maximum</Text>
                            <Text style={styles.modalDetailValue}>
                                {deliverySettings?.frais_max?.toLocaleString() || 5000} FCFA
                            </Text>
                        </View>
                        <View style={[styles.modalDetailRow, styles.modalDetailTotal]}>
                            <Text style={styles.modalDetailTotalLabel}>Total calculé</Text>
                            <Text style={styles.modalDetailTotalValue}>
                                {deliveryFee.toLocaleString()} FCFA
                            </Text>
                        </View>
                        <View style={styles.modalDetailRow}>
                            <Text style={styles.modalDetailLabel}>Livraison gratuite dès</Text>
                            <Text style={styles.modalDetailValue}>
                                {deliverySettings?.livraison_gratuite_des?.toLocaleString() || 50000} FCFA
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setShowDeliveryInfo(false)}
                        >
                            <Text style={styles.modalCloseButtonText}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Espace en bas */}
            <View style={{ height: 50 }} />
        </ScrollView>
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
    cartButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    cartIcon: { fontSize: 24, color: '#fff' },
    cartBadge: {
        position: 'absolute', top: 0, right: 0,
        backgroundColor: '#ef4444', borderRadius: 10,
        minWidth: 18, height: 18, justifyContent: 'center',
        alignItems: 'center', paddingHorizontal: 4,
    },
    cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    // Merchant
    merchantCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', margin: 15, padding: 15,
        borderRadius: 12, gap: 12,
    },
    merchantIcon: { fontSize: 40 },
    merchantInfo: { flex: 1 },
    merchantName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    merchantCity: { fontSize: 12, color: '#666', marginTop: 2 },
    merchantDistance: { fontSize: 12, color: '#2563eb', marginTop: 4, fontWeight: '500' },

    // Balance
    balanceCard: {
        backgroundColor: '#2563eb', margin: 15, marginTop: 0,
        padding: 15, borderRadius: 12, alignItems: 'center',
    },
    balanceLabel: { color: '#fff', fontSize: 12, opacity: 0.9 },
    balanceValue: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 5 },

    // 🚚 Delivery Section
    deliverySection: { marginHorizontal: 15, marginBottom: 10 },
    deliveryCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    deliveryCardActive: {
        borderColor: '#f59e0b',
        backgroundColor: '#fffdf5',
    },
    deliveryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    deliveryTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    deliveryIcon: { fontSize: 28 },
    deliveryTitleInfo: {},
    deliveryTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
    deliverySubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
    deliveryCheckbox: {
        width: 28, height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deliveryCheckboxActive: {
        backgroundColor: '#f59e0b',
        borderColor: '#f59e0b',
    },
    deliveryCheckmark: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    deliveryHint: {
        fontSize: 12, color: '#999',
        textAlign: 'center', marginTop: 8,
    },

    // Delivery Details
    deliveryDetails: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    deliveryDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    deliveryDetailLabel: { fontSize: 13, color: '#666' },
    deliveryDetailValue: { fontSize: 14, fontWeight: '600', color: '#333' },
    freeDeliveryBadge: {
        backgroundColor: '#d1fae5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    freeDeliveryText: { fontSize: 12, fontWeight: '600', color: '#059669' },
    deliveryInfoButton: {
        marginTop: 10,
        paddingVertical: 8,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    deliveryInfoButtonText: { fontSize: 12, color: '#2563eb' },

    // Products
    form: {
        backgroundColor: '#fff', margin: 15, padding: 15,
        borderRadius: 12, marginBottom: 10,
    },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10, marginTop: 15 },
    productsList: { flexDirection: 'row', marginBottom: 5 },
    productsLoader: { padding: 20 },
    productCard: {
        width: 150, backgroundColor: '#f5f5f5',
        borderRadius: 12, padding: 12, marginRight: 10,
        alignItems: 'center', position: 'relative',
    },
    productCardActive: {
        backgroundColor: '#d1fae5',
        borderWidth: 1, borderColor: '#10b981',
    },
    productImage: { width: 80, height: 80, borderRadius: 10, marginBottom: 8 },
    productImagePlaceholder: {
        width: 80, height: 80, borderRadius: 10,
        backgroundColor: '#e0e0e0', alignItems: 'center',
        justifyContent: 'center', marginBottom: 8,
    },
    productImagePlaceholderText: { fontSize: 32 },
    productName: { fontSize: 12, fontWeight: '500', color: '#333', textAlign: 'center' },
    productPrice: { fontSize: 14, fontWeight: 'bold', color: '#10b981', marginTop: 5 },
    productStock: { fontSize: 10, color: '#666', marginTop: 2 },
    selectedBadge: {
        position: 'absolute', top: 5, right: 5,
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center',
    },
    selectedBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    noProductsContainer: {
        alignItems: 'center', padding: 30,
        backgroundColor: '#f9f9f9', borderRadius: 12, marginTop: 10,
    },
    noProductsIcon: { fontSize: 48, marginBottom: 10, opacity: 0.5 },
    noProductsTitle: { fontSize: 16, fontWeight: '500', color: '#666', marginBottom: 5 },
    noProductsText: { fontSize: 12, color: '#999', textAlign: 'center' },

    // Quantity
    quantityContainer: {
        flexDirection: 'row', alignItems: 'center',
        marginTop: 10, gap: 15,
    },
    quantityButton: {
        width: 40, height: 40, backgroundColor: '#f0f0f0',
        borderRadius: 20, justifyContent: 'center', alignItems: 'center',
    },
    quantityButtonText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    quantityValue: { fontSize: 18, fontWeight: 'bold', color: '#333', minWidth: 40, textAlign: 'center' },

    // Summary
    summaryCard: {
        marginTop: 20,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 15,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    summaryLabel: { fontSize: 14, color: '#666' },
    summaryValue: { fontSize: 14, fontWeight: '600', color: '#333' },
    summaryFree: { fontSize: 14, fontWeight: '600', color: '#10b981' },
    summaryTotal: {
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        marginTop: 6,
        paddingTop: 10,
    },
    summaryTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    summaryTotalValue: { fontSize: 18, fontWeight: 'bold', color: '#10b981' },

    // Add to cart button
    addToCartButton: {
        backgroundColor: '#f59e0b',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    addToCartButtonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '90%',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 15,
    },
    modalDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalDetailLabel: { fontSize: 14, color: '#666' },
    modalDetailValue: { fontSize: 14, fontWeight: '500', color: '#333' },
    modalDetailTotal: {
        borderBottomWidth: 2,
        borderBottomColor: '#f59e0b',
    },
    modalDetailTotalLabel: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    modalDetailTotalValue: { fontSize: 18, fontWeight: 'bold', color: '#f59e0b' },
    modalCloseButton: {
        backgroundColor: '#2563eb',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
    },
    modalCloseButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
