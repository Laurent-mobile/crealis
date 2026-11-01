//crealis-mobile/src/components/MapView.web.js
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export default function MapView({
    markers = [],
    userLocation,
    onMarkerPress,
    initialRegion
}) {
    const lat = initialRegion?.latitude || 12.3714;
    const lng = initialRegion?.longitude || -1.5197;
    const zoom = 14;

    // Construire les marqueurs pour l'URL
    let markerParams = markers.map(m =>
        `${m.latitude},${m.longitude},marker-${m.id}`
    ).join('|');

    // Marqueur utilisateur
    if (userLocation) {
        markerParams += (markerParams ? '|' : '') +
            `${userLocation.latitude},${userLocation.longitude},user-location`;
    }

    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}&layer=mapnik`;

    return (
        <View style={styles.container}>
            <iframe
                src={mapUrl}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '0',
                }}
                title="Carte des commerçants"
            />

            {/* Légende */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
                    <Text style={styles.legendText}>Commerçants</Text>
                </View>
                {userLocation && (
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                        <Text style={styles.legendText}>Ma position</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    legend: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 10,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    legendText: {
        fontSize: 11,
        color: '#333',
    },
});
