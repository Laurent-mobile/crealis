// src/screens/QRScanner.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../api/client';

export default function QRScanner() {
    const navigation = useNavigation();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        requestPermission();
    }, []);

    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned || loading) return;
        setScanned(true);
        Vibration.vibrate();

        try {
            // Analyser le QR code (format attendu: merchantId|amount|description)
            const qrData = JSON.parse(data);
            const { merchantId, amount, description, productId } = qrData;

            setLoading(true);

            // Confirmer le paiement
            Alert.alert(
                'Confirmation de paiement',
                `Payer ${parseInt(amount).toLocaleString()} FCFA à ${description || 'commerçant'} ?`,
                [
                    { text: 'Annuler', style: 'cancel', onPress: () => setScanned(false) },
                    {
                        text: 'Payer',
                        onPress: async () => {
                            try {
                                const response = await api.post('/transactions/purchase', {
                                    amount: parseInt(amount),
                                    merchantId: merchantId,
                                    productId: productId || null,
                                    description: description || 'Paiement par QR code',
                                    paymentMethod: 'qr_code',
                                });

                                if (response.data.success) {
                                    Alert.alert(
                                        '✅ Paiement effectué',
                                        `${parseInt(amount).toLocaleString()} FCFA ont été débités de votre wallet.`,
                                        [{ text: 'OK', onPress: () => navigation.goBack() }]
                                    );
                                }
                            } catch (error) {
                                Alert.alert('Erreur', error.response?.data?.message || 'Paiement échoué');
                                setScanned(false);
                            } finally {
                                setLoading(false);
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            // Format texte simple
            Alert.alert(
                'Paiement',
                `Payer ${data} ?`,
                [
                    { text: 'Annuler', style: 'cancel', onPress: () => setScanned(false) },
                    {
                        text: 'Payer', onPress: () => {
                            Alert.alert('Information', 'QR code invalide. Utilisez un QR code CREALIS valide.');
                            setScanned(false);
                        }
                    },
                ]
            );
        }
    };

    if (!permission) {
        return (
            <View style={styles.center}>
                <Text>Demande d'accès à la caméra...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Text style={styles.permissionText}>Accès à la caméra refusé</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr', 'pdf417'],
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.scanArea} />
                    <Text style={styles.scanText}>Scannez le QR code du commerçant</Text>
                </View>
            </CameraView>

            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Traitement en cours...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    camera: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    scanArea: { width: 250, height: 250, borderWidth: 2, borderColor: '#fff', borderRadius: 20, backgroundColor: 'transparent' },
    scanText: { marginTop: 30, color: '#fff', fontSize: 16, textAlign: 'center' },
    closeButton: { position: 'absolute', top: 50, right: 20, width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    closeButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#fff', fontSize: 16 },
    permissionText: { fontSize: 16, color: '#666', marginBottom: 20 },
    permissionButton: { backgroundColor: '#2563eb', padding: 15, borderRadius: 10 },
    permissionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
