// src/screens/Recharge.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';
import { notifyRechargeSuccess } from '../services/notifications';
import { useWallet } from '../context/WalletContext';

console.log('🔧 Composant Recharge chargé');

export default function Recharge() {
    const navigation = useNavigation();
    const { updateAfterRecharge, refreshWallet } = useWallet();
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('orange');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSimulationModal, setShowSimulationModal] = useState(false);
    const [simulationData, setSimulationData] = useState(null);

    const paymentMethods = [
        { id: 'orange', name: 'Orange Money', icon: '📱', color: '#ff6600', code: 'orange_money' },
        { id: 'wave', name: 'Wave', icon: '🌊', color: '#1a73e8', code: 'wave' },
        { id: 'moov', name: 'Moov Money', icon: '📱', color: '#00a651', code: 'moov_money' },
        { id: 'telecel', name: 'Telecel Money', icon: '📱', color: '#e30613', code: 'telecel_money' },
    ];

    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log('Token présent:', token ? 'Oui' : 'Non');
        if (token) {
            console.log('Token (début):', token.substring(0, 20) + '...');
        }
    }, []);

    const handleRecharge = async () => {
        console.log('🔴 BOUTON CLIQUE !');
        console.log('💰 Montant:', amount);
        console.log('📱 Méthode:', method);
        console.log('📞 Téléphone:', phoneNumber);

        const amountValue = parseInt(amount);

        // Validation du montant
        if (!amountValue || amountValue < 100) {
            console.log('❌ Erreur validation: Montant invalide', amountValue);
            Alert.alert('Erreur', 'Montant minimum : 100 FCFA');
            return;
        }

        if (amountValue > 500000) {
            console.log('❌ Erreur validation: Montant trop élevé', amountValue);
            Alert.alert('Erreur', 'Montant maximum : 500 000 FCFA');
            return;
        }

        // Validation du numéro de téléphone
        if (!phoneNumber || phoneNumber.length < 9) {
            console.log('❌ Erreur validation: Téléphone invalide', phoneNumber);
            Alert.alert('Erreur', 'Numéro de téléphone invalide (minimum 9 chiffres)');
            return;
        }

        console.log('✅ Validations passées');
        setLoading(true);

        try {
            const response = await api.post('/transactions/recharge-simulate', {
                amount: amountValue,
                method: method,
                phoneNumber: phoneNumber,
            });

            if (response.data.success) {
                const newBalance = response.data.transaction?.newBalance;

                // ✅ Mise à jour locale immédiate
                updateAfterRecharge({ newBalance });

                // ✅ Rafraîchir depuis l'API pour confirmer
                setTimeout(async () => {
                    console.log('🔄 Vérification post-recharge...');
                    await refreshWallet(true);
                }, 1000);

                await notifyRechargeSuccess(amountValue, newBalance);

                Alert.alert(
                    '✅ Recharge effectuée !',
                    `${amountValue.toLocaleString()} FCFA ont été ajoutés à votre wallet.\n\nNouveau solde: ${newBalance?.toLocaleString()} FCFA`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                setAmount('');
                                setPhoneNumber('');
                                navigation.goBack();
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('❌ Erreur complète:', error);
            console.error('❌ Message erreur:', error.message);
            console.error('❌ Réponse erreur:', error.response);
            console.error('❌ Status erreur:', error.response?.status);
            console.error('❌ Data erreur:', error.response?.data);

            let errorMessage = 'Erreur de connexion au serveur';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Erreur', errorMessage);
        } finally {
            console.log('🏁 Fin de la requête, loading=false');
            setLoading(false);
        }
    };

    const confirmSimulation = async () => {
        setShowSimulationModal(false);

        try {
            const response = await api.post('/transactions/recharge', {
                amount: simulationData.amount,
                method: simulationData.method.code,
                phoneNumber: simulationData.phoneNumber,
            });
            console.log('Recharge response:', response.data);

            // Notification push pour la simulation
            await notifyRechargeSuccess(simulationData.amount, response.data.transaction?.newBalance);

            Alert.alert(
                '✅ Recharge effectuée !',
                `${simulationData.amount.toLocaleString()} FCFA ont été ajoutés à votre wallet.\n\nTransaction: ${simulationData.transactionId}`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setAmount('');
                            setPhoneNumber('');
                            navigation.goBack();
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Simulation error:', error);
            Alert.alert('Erreur', 'La recharge a échoué. Veuillez réessayer.');
        }
    };

    const cancelSimulation = () => {
        setShowSimulationModal(false);
        setSimulationData(null);
    };

    const getMethodPlaceholder = () => {
        switch (method) {
            case 'orange': return 'Ex: 70000000';
            case 'wave': return 'Ex: 77000000';
            case 'moov': return 'Ex: 05000000';
            case 'telecel': return 'Ex: 06000000';
            default: return 'Numéro de téléphone (9-10 chiffres)';
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>💰 Recharger mon Wallet</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Montant (FCFA)</Text>
                    <TextInput
                        style={styles.amountInput}
                        placeholder="Ex: 1000"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />
                    <Text style={styles.minAmount}>Minimum : 100 FCFA | Maximum : 500 000 FCFA</Text>
                </View>

                <View style={styles.phoneCard}>
                    <Text style={styles.phoneLabel}>Numéro de téléphone</Text>
                    <TextInput
                        style={styles.phoneInput}
                        placeholder={getMethodPlaceholder()}
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                    />
                    <Text style={styles.phoneHint}>Entrez le numéro sans espaces (ex: 70000000)</Text>
                </View>

                <Text style={styles.methodTitle}>Méthode de paiement</Text>
                {paymentMethods.map((m) => (
                    <TouchableOpacity
                        key={m.id}
                        style={[styles.methodCard, method === m.id && styles.methodCardActive]}
                        onPress={() => setMethod(m.id)}
                    >
                        <Text style={styles.methodIcon}>{m.icon}</Text>
                        <Text style={styles.methodName}>{m.name}</Text>
                        {method === m.id && <Text style={styles.checkIcon}>✓</Text>}
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    style={styles.rechargeButton}
                    onPress={handleRecharge}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.rechargeButtonText}>Recharger maintenant</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.infoBox}>
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <Text style={styles.infoText}>
                        La recharge est instantanée. Les frais de transaction sont offerts par CREALIS.
                    </Text>
                </View>

                <View style={styles.simulationBox}>
                    <Text style={styles.simulationIcon}>🎮</Text>
                    <Text style={styles.simulationText}>
                        Mode simulation activé. Les recharges sont simulées pour les tests.
                    </Text>
                </View>
            </View>

            {/* Modal de confirmation de simulation */}
            <Modal
                visible={showSimulationModal}
                transparent={true}
                animationType="slide"
                onRequestClose={cancelSimulation}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalIcon}>💳</Text>
                            <Text style={styles.modalTitle}>Simulation de recharge</Text>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={styles.modalAmount}>
                                {simulationData?.amount?.toLocaleString()} FCFA
                            </Text>
                            <Text style={styles.modalMethod}>
                                via {simulationData?.method?.name}
                            </Text>
                            <Text style={styles.modalPhone}>
                                📞 {simulationData?.phoneNumber}
                            </Text>
                            <View style={styles.modalDivider} />
                            <Text style={styles.modalInfo}>
                                Ceci est une simulation. Aucun débit réel ne sera effectué.
                            </Text>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={cancelSimulation}>
                                <Text style={styles.modalCancelText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmSimulation}>
                                <Text style={styles.modalConfirmText}>Confirmer la simulation</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        padding: 20,
        backgroundColor: '#f59e0b',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    backIcon: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
    content: { padding: 20 },
    amountCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 15 },
    amountLabel: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#333' },
    amountInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 18, backgroundColor: '#fff' },
    minAmount: { fontSize: 12, color: '#999', marginTop: 8 },
    phoneCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 20 },
    phoneLabel: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#333' },
    phoneInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#fff' },
    phoneHint: { fontSize: 11, color: '#999', marginTop: 5 },
    methodTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#333' },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    methodCardActive: { borderColor: '#f59e0b', backgroundColor: '#fef3c7' },
    methodIcon: { fontSize: 24, marginRight: 15 },
    methodName: { flex: 1, fontSize: 16 },
    checkIcon: { fontSize: 20, color: '#10b981' },
    rechargeButton: { backgroundColor: '#f59e0b', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 20 },
    rechargeButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    infoBox: { flexDirection: 'row', backgroundColor: '#e0e7ff', padding: 15, borderRadius: 10, marginTop: 20 },
    infoIcon: { fontSize: 20, marginRight: 10 },
    infoText: { flex: 1, fontSize: 12, color: '#1e40af' },
    simulationBox: { flexDirection: 'row', backgroundColor: '#fef3c7', padding: 15, borderRadius: 10, marginTop: 10, marginBottom: 30 },
    simulationIcon: { fontSize: 20, marginRight: 10 },
    simulationText: { flex: 1, fontSize: 12, color: '#92400e' },
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, width: '85%', overflow: 'hidden' },
    modalHeader: { backgroundColor: '#f59e0b', padding: 20, alignItems: 'center' },
    modalIcon: { fontSize: 40, marginBottom: 10 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    modalBody: { padding: 20, alignItems: 'center' },
    modalAmount: { fontSize: 32, fontWeight: 'bold', color: '#f59e0b', marginBottom: 5 },
    modalMethod: { fontSize: 16, color: '#666', marginBottom: 10 },
    modalPhone: { fontSize: 14, color: '#999', marginBottom: 15 },
    modalDivider: { width: '100%', height: 1, backgroundColor: '#e0e0e0', marginVertical: 15 },
    modalInfo: { fontSize: 12, color: '#999', textAlign: 'center' },
    modalFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
    modalCancelBtn: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: '#f5f5f5' },
    modalCancelText: { color: '#ef4444', fontWeight: '600' },
    modalConfirmBtn: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: '#f59e0b' },
    modalConfirmText: { color: '#fff', fontWeight: '600' },
});
