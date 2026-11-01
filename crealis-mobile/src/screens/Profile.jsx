// src/screens/Profile.jsx
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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Profile() {
    const { user, logout } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put(`/users/${user.id}`, formData);
            Alert.alert('Succès', 'Profil mis à jour');
            setEditing(false);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Déconnexion', onPress: () => logout() },
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>👤 Mon Profil</Text>
            </View>

            <View style={styles.avatarSection}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {formData.firstName?.charAt(0)}{formData.lastName?.charAt(0)}
                    </Text>
                </View>
                <TouchableOpacity style={styles.editAvatarBtn}>
                    <Text style={styles.editAvatarText}>Changer photo</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Prénom</Text>
                    <TextInput
                        style={[styles.input, !editing && styles.inputDisabled]}
                        value={formData.firstName}
                        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                        editable={editing}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nom</Text>
                    <TextInput
                        style={[styles.input, !editing && styles.inputDisabled]}
                        value={formData.lastName}
                        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                        editable={editing}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, !editing && styles.inputDisabled]}
                        value={formData.email}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                        keyboardType="email-address"
                        editable={editing}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Téléphone</Text>
                    <TextInput
                        style={[styles.input, !editing && styles.inputDisabled]}
                        value={formData.phone}
                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                        keyboardType="phone-pad"
                        editable={editing}
                    />
                </View>

                {editing ? (
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                            <Text style={styles.cancelBtnText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Enregistrer</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                        <Text style={styles.editBtnText}>✏️ Modifier le profil</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutBtnText}>🚪 Se déconnecter</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { padding: 20, backgroundColor: '#8b5cf6' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    avatarSection: { alignItems: 'center', marginTop: -40, marginBottom: 20 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
    avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
    editAvatarBtn: { marginTop: 10 },
    editAvatarText: { fontSize: 12, color: '#8b5cf6' },
    form: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 15 },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '500', color: '#666', marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 16 },
    inputDisabled: { backgroundColor: '#f9f9f9', color: '#999' },
    buttonRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    editBtn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    editBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    saveBtn: { flex: 1, backgroundColor: '#10b981', padding: 15, borderRadius: 10, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    cancelBtn: { flex: 1, backgroundColor: '#ef4444', padding: 15, borderRadius: 10, alignItems: 'center' },
    cancelBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    logoutBtn: { marginTop: 20, padding: 15, alignItems: 'center' },
    logoutBtnText: { color: '#ef4444', fontSize: 16 },
});
