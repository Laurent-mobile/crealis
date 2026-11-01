//src/components/MapView.native.js
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';

export default function MapViewComponent({
    markers = [],
    userLocation,
    onMarkerPress,
    initialRegion,
    mapRef
}) {
    const lat = initialRegion?.latitude || 12.3714;
    const lng = initialRegion?.longitude || -1.5197;

    // Construire l'URL OpenStreetMap
    let markerParams = markers.map(m =>
        `&marker=${m.latitude},${m.longitude},${m.name || ''}`
    ).join('');

    if (userLocation) {
        markerParams += `&marker=${userLocation.latitude},${userLocation.longitude},Ma position`;
    }

    const mapHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                body { margin: 0; padding: 0; }
                #map { width: 100vw; height: 100vh; }
                .legend {
                    position: absolute; bottom: 10px; left: 10px;
                    background: rgba(255,255,255,0.9); padding: 8px;
                    border-radius: 8px; font-family: sans-serif; font-size: 12px;
                }
                .legend-item { display: flex; align-items: center; margin: 3px 0; }
                .legend-dot { width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <div class="legend">
                <div class="legend-item"><div class="legend-dot" style="background:#2563eb"></div> Commerçant</div>
                ${userLocation ? '<div class="legend-item"><div class="legend-dot" style="background:#10b981"></div> Ma position</div>' : ''}
            </div>
            <script>
                const map = L.map('map').setView([${lat}, ${lng}], 14);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; OpenStreetMap, &copy; CARTO',
                    subdomains: 'abcd',
                    maxZoom: 20
                }).addTo(map);

                // Ajouter les marqueurs commerçants
                const markers = [${markers.map(m => `{
                    lat: ${m.latitude},
                    lng: ${m.longitude},
                    name: "${(m.name || '').replace(/"/g, '\\"')}",
                    id: "${m.id}"
                }`).join(',')}];

                markers.forEach(function(m) {
                    const icon = L.divIcon({
                        className: 'custom-marker',
                        html: '<div style="background:#2563eb; border-radius:50%; padding:6px; border:2px solid white; font-size:16px;">🏪</div>',
                        iconSize: [35, 35],
                        popupAnchor: [0, -15]
                    });
                    L.marker([m.lat, m.lng], {icon: icon})
                        .addTo(map)
                        .bindPopup('<b>' + m.name + '</b>');
                });

                // Marqueur utilisateur
                ${userLocation ? `
                const userIcon = L.divIcon({
                    className: 'user-marker',
                    html: '<div style="background:#10b981; border-radius:50%; padding:5px; border:2px solid white; font-size:12px;">📍</div>',
                    iconSize: [28, 28]
                });
                L.marker([${userLocation.latitude}, ${userLocation.longitude}], {icon: userIcon})
                    .addTo(map)
                    .bindPopup('Ma position');
                ` : ''}
            </script>
        </body>
        </html>
    `;

    return (
        <View style={styles.container}>
            <WebView
                source={{ html: mapHtml }}
                style={styles.map}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
});
