// frontend-web/src/pages/AdminMerchants.jsx
import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Icône personnalisée pour le marqueur
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Composant pour la recherche d'adresse
const AddressSearch = ({ onLocationFound }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const searchAddress = async (value) => {
        if (value.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value + ', Burkina Faso')}&limit=5&countrycodes=bf`
            );
            const data = await response.json();
            setSuggestions(data);
        } catch (error) {
            console.error('Erreur de recherche:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (place) => {
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        onLocationFound({ lat, lon, displayName: place.display_name });
        setQuery(place.display_name);
        setSuggestions([]);
    };

    return (
        <div className="address-search">
            <div className="search-input-wrapper">
                <input
                    type="text"
                    className="form-input"
                    placeholder="Rechercher une adresse, un quartier, une ville..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        searchAddress(e.target.value);
                    }}
                />
                {loading && <span className="search-spinner">⏳</span>}
            </div>
            {suggestions.length > 0 && (
                <ul className="suggestions-list">
                    {suggestions.map((place, index) => (
                        <li key={index} onClick={() => handleSelect(place)}>
                            <span className="suggestion-icon">📍</span>
                            <span className="suggestion-text">{place.display_name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// Composant pour cliquer sur la carte
const MapClickHandler = ({ onMapClick }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
};

// Composant pour recentrer la carte - CORRIGÉ
const MapCenter = ({ center }) => {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.flyTo(center, 15);
        }
    }, [center, map]);

    return null;
};

// Composant pour le marqueur déplaçable - CORRIGÉ
const DraggableMarker = ({ position, onPositionChange }) => {
    const markerRef = useRef(null);

    const eventHandlers = {
        dragend() {
            const marker = markerRef.current;
            if (marker != null) {
                const latlng = marker.getLatLng();
                onPositionChange(latlng);
            }
        },
    };

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        />
    );
};

function AdminMerchants() {
    const [merchants, setMerchants] = useState([]);
    const [selectedMerchant, setSelectedMerchant] = useState(null);
    const [products, setProducts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('merchants');
    const [showMerchantModal, setShowMerchantModal] = useState(false);
    const [editingMerchant, setEditingMerchant] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState({ lat: 12.3714, lng: -1.5197 });
    const [mapCenter, setMapCenter] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        verified: 0,
        totalRevenue: 0,
        totalTransactions: 0
    });

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: 'Ouagadougou',
        category: 'general',
        cashback_percent: 2.5,
        is_active: true,
        is_verified: false,
        subscription_plan: 'basic',
        latitude: null,
        longitude: null
    });

    useEffect(() => {
        fetchMerchants();
    }, []);

    const fetchMerchants = async () => {
        try {
            const response = await api.get('/merchants');
            const merchantsData = response.data || [];
            setMerchants(merchantsData);

            setStats({
                total: merchantsData.length,
                active: merchantsData.filter(m => m.is_active).length,
                verified: merchantsData.filter(m => m.is_verified).length,
                totalRevenue: merchantsData.reduce((sum, m) => sum + (m.totalSales || 0), 0),
                totalTransactions: merchantsData.reduce((sum, m) => sum + (m.transactionCount || 0), 0)
            });
        } catch (error) {
            console.error('Error fetching merchants:', error);
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const fetchMerchantDetails = async (merchant) => {
        setSelectedMerchant(merchant);
        setActiveTab('products');

        try {
            const productsRes = await api.get(`/products?merchantId=${merchant.id}`);
            setProducts(productsRes.data.products || []);

            const transactionsRes = await api.get(`/transactions?merchantId=${merchant.id}`);
            setTransactions(transactionsRes.data || []);
        } catch (error) {
            console.error('Error fetching merchant details:', error);
            toast.error('Erreur lors du chargement des détails');
        }
    };

    const handleCreateMerchant = async (e) => {
        e.preventDefault();
        try {
            const merchantData = {
                ...formData,
                cashback_percent: parseFloat(formData.cashback_percent),
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                commissionRate: parseFloat(formData.cashback_percent) || 2.5
            };

            if (editingMerchant) {
                await api.put(`/merchants/${editingMerchant.id}`, merchantData);
                toast.success('Commerçant modifié avec succès');
            } else {
                await api.post('/merchants', merchantData);
                toast.success('Commerçant créé avec succès');
            }
            setShowMerchantModal(false);
            resetForm();
            fetchMerchants();
        } catch (error) {
            console.error('Error saving merchant:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de l\'opération');
        }
    };

    const handleDeleteMerchant = async (id) => {
        if (window.confirm('Supprimer ce commerçant ?')) {
            try {
                await api.delete(`/merchants/${id}`);
                toast.success('Commerçant supprimé');
                fetchMerchants();
                if (selectedMerchant?.id === id) {
                    setSelectedMerchant(null);
                    setActiveTab('merchants');
                }
            } catch (error) {
                toast.error('Erreur lors de la suppression');
            }
        }
    };

    const handleVerifyMerchant = async (id, verified) => {
        try {
            await api.put(`/merchants/${id}/verify`, { isVerified: verified });
            toast.success(verified ? 'Commerçant vérifié' : 'Vérification annulée');
            fetchMerchants();
            if (selectedMerchant?.id === id) {
                setSelectedMerchant({ ...selectedMerchant, is_verified: verified });
            }
        } catch (error) {
            toast.error('Erreur lors de la vérification');
        }
    };

    const resetForm = () => {
        setEditingMerchant(null);
        setFormData({
            name: '',
            phone: '',
            email: '',
            address: '',
            city: 'Ouagadougou',
            category: 'general',
            cashback_percent: 2.5,
            is_active: true,
            is_verified: false,
            subscription_plan: 'basic',
            latitude: null,
            longitude: null
        });
        setSelectedLocation({ lat: 12.3714, lng: -1.5197 });
    };

    const handleEdit = (merchant) => {
        setEditingMerchant(merchant);
        setFormData({
            name: merchant.name || '',
            phone: merchant.phone || '',
            email: merchant.email || '',
            address: merchant.address || '',
            city: merchant.city || 'Ouagadougou',
            category: merchant.category || 'general',
            cashback_percent: merchant.cashback_percent || 2.5,
            is_active: merchant.is_active !== undefined ? merchant.is_active : true,
            is_verified: merchant.is_verified || false,
            subscription_plan: merchant.subscription_plan || 'basic',
            latitude: merchant.latitude || null,
            longitude: merchant.longitude || null
        });

        if (merchant.latitude && merchant.longitude) {
            setSelectedLocation({
                lat: parseFloat(merchant.latitude),
                lng: parseFloat(merchant.longitude)
            });
            setMapCenter({ lat: parseFloat(merchant.latitude), lng: parseFloat(merchant.longitude) });
        } else {
            setSelectedLocation({ lat: 12.3714, lng: -1.5197 });
            setMapCenter(null);
        }

        setShowMerchantModal(true);
    };

    const handleLocationSelect = (latlng) => {
        setSelectedLocation({ lat: latlng.lat, lng: latlng.lng });
        setFormData({
            ...formData,
            latitude: latlng.lat,
            longitude: latlng.lng
        });
        setMapCenter({ lat: latlng.lat, lng: latlng.lng });
    };

    const handleAddressFound = (location) => {
        setSelectedLocation({ lat: location.lat, lng: location.lon });
        setFormData({
            ...formData,
            latitude: location.lat,
            longitude: location.lon,
            address: location.displayName || formData.address
        });
        setMapCenter({ lat: location.lat, lng: location.lon });
    };

    const openMapModal = () => {
        setShowMapModal(true);
        if (formData.latitude && formData.longitude) {
            setMapCenter({ lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) });
        } else {
            setMapCenter({ lat: 12.3714, lng: -1.5197 });
        }
    };

    const filteredMerchants = merchants.filter(m =>
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone?.includes(searchTerm) ||
        m.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
             <>
                <div className="spinner-container"><div className="spinner"></div></div>
            </>
        );
    }

        return (
        <>
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">🏪 Gestion des Commerçants</h1>
                        <p className="page-subtitle">Gérez les commerçants, leurs produits et transactions</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowMerchantModal(true); }}>
                        + Nouveau Commerçant
                    </button>
                </div>

                {/* Statistiques */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total commerçants</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.active}</div>
                        <div className="stat-label">Actifs</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.verified}</div>
                        <div className="stat-label">Vérifiés</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalRevenue.toLocaleString()} FCFA</div>
                        <div className="stat-label">CA total</div>
                    </div>
                </div>

                {/* Barre de recherche */}
                <div className="search-bar">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Rechercher un commerçant..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Liste des commerçants */}
                <div className="merchants-grid">
                    {filteredMerchants.map(merchant => (
                        <div key={merchant.id} className="merchant-card" onClick={() => fetchMerchantDetails(merchant)}>
                            <div className="merchant-card-header">
                                <div className="merchant-icon">🏪</div>
                                <div className="merchant-info">
                                    <h3 className="merchant-name">{merchant.name}</h3>
                                    <p className="merchant-location">📍 {merchant.city || 'Ouagadougou'}</p>
                                    {merchant.latitude && merchant.longitude && (
                                        <p className="merchant-coords">🌐 {merchant.latitude.toFixed(6)}, {merchant.longitude.toFixed(6)}</p>
                                    )}
                                </div>
                                <div className="merchant-status">
                                    {merchant.is_verified ? (
                                        <span className="badge badge-success">✓ Vérifié</span>
                                    ) : (
                                        <span className="badge badge-warning">⏳ En attente</span>
                                    )}
                                </div>
                            </div>
                            <div className="merchant-card-body">
                                <div className="merchant-detail">
                                    <span className="detail-icon">📞</span>
                                    <span>{merchant.phone || 'Non renseigné'}</span>
                                </div>
                                <div className="merchant-detail">
                                    <span className="detail-icon">✉️</span>
                                    <span>{merchant.email || 'Non renseigné'}</span>
                                </div>
                                <div className="merchant-detail">
                                    <span className="detail-icon">⭐</span>
                                    <span>Cashback {merchant.cashback_percent || 2.5}%</span>
                                </div>
                                {merchant.latitude && merchant.longitude && (
                                    <div className="merchant-detail">
                                        <span className="detail-icon">🗺️</span>
                                        <span
                                            className="coords-link"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(`https://www.openstreetmap.org/?mlat=${merchant.latitude}&mlon=${merchant.longitude}&zoom=15`, '_blank');
                                            }}
                                        >
                                            Voir sur la carte
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="merchant-card-footer">
                                <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); handleEdit(merchant); }}>
                                    ✏️ Modifier
                                </button>
                                <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); handleVerifyMerchant(merchant.id, !merchant.is_verified); }}>
                                    {merchant.is_verified ? '🔓 Annuler vérif' : '✅ Vérifier'}
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDeleteMerchant(merchant.id); }}>
                                    🗑️ Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal Ajout/Modification commerçant */}
                {showMerchantModal && (
                    <div className="modal-overlay" onClick={() => setShowMerchantModal(false)}>
                        <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingMerchant ? 'Modifier le commerçant' : 'Nouveau commerçant'}</h3>
                                <button className="modal-close" onClick={() => setShowMerchantModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleCreateMerchant}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Nom de l'enseigne *</label>
                                        <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Téléphone</label>
                                            <input type="tel" className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Email</label>
                                            <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Ville</label>
                                            <select className="form-select" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}>
                                                <option value="Ouagadougou">Ouagadougou</option>
                                                <option value="Bobo-Dioulasso">Bobo-Dioulasso</option>
                                                <option value="Koudougou">Koudougou</option>
                                                <option value="Banfora">Banfora</option>
                                                <option value="Ouahigouya">Ouahigouya</option>
                                                <option value="Kaya">Kaya</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Catégorie</label>
                                            <select className="form-select" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                                <option value="supermarket">Supermarché</option>
                                                <option value="restaurant">Restaurant</option>
                                                <option value="boutique">Boutique</option>
                                                <option value="pharmacy">Pharmacie</option>
                                                <option value="electronics">Électronique</option>
                                                <option value="general">Général</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Adresse</label>
                                        <textarea className="form-textarea" rows="2" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                                    </div>

                                    {/* SECTION GÉOLOCALISATION */}
                                    <div className="form-section geo-section">
                                        <div className="section-header">
                                            <h4>📍 Géolocalisation</h4>
                                            <p className="section-desc">Sélectionnez l'emplacement du commerce sur la carte</p>
                                        </div>

                                        <div className="geo-inputs">
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Latitude</label>
                                                    <input
                                                        type="number"
                                                        step="0.000001"
                                                        className="form-input"
                                                        value={formData.latitude || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value ? parseFloat(e.target.value) : null;
                                                            setFormData({ ...formData, latitude: val });
                                                            if (val) {
                                                                setSelectedLocation({ ...selectedLocation, lat: val });
                                                            }
                                                        }}
                                                        placeholder="12.3714"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Longitude</label>
                                                    <input
                                                        type="number"
                                                        step="0.000001"
                                                        className="form-input"
                                                        value={formData.longitude || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value ? parseFloat(e.target.value) : null;
                                                            setFormData({ ...formData, longitude: val });
                                                            if (val) {
                                                                setSelectedLocation({ ...selectedLocation, lng: val });
                                                            }
                                                        }}
                                                        placeholder="-1.5197"
                                                    />
                                                </div>
                                            </div>
                                            <button type="button" className="btn btn-outline" onClick={openMapModal}>
                                                🗺️ Choisir sur la carte
                                            </button>
                                            {formData.latitude && formData.longitude && (
                                                <div className="geo-preview">
                                                    <span className="geo-badge">📍 Position définie</span>
                                                    <a
                                                        href={`https://www.openstreetmap.org/?mlat=${formData.latitude}&mlon=${formData.longitude}&zoom=15`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="geo-link"
                                                    >
                                                        Voir sur OpenStreetMap
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Cashback (%)</label>
                                            <input type="number" step="0.5" className="form-input" value={formData.cashback_percent} onChange={(e) => setFormData({ ...formData, cashback_percent: parseFloat(e.target.value) })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Plan d'abonnement</label>
                                            <select className="form-select" value={formData.subscription_plan} onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })}>
                                                <option value="basic">Basic</option>
                                                <option value="premium">Premium</option>
                                                <option value="enterprise">Enterprise</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <label className="checkbox-label">
                                            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                                            <span>Actif</span>
                                        </label>
                                        <label className="checkbox-label">
                                            <input type="checkbox" checked={formData.is_verified} onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })} />
                                            <span>Vérifié</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowMerchantModal(false)}>Annuler</button>
                                    <button type="submit" className="btn btn-primary">{editingMerchant ? 'Modifier' : 'Créer'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Carte */}
                {showMapModal && (
                    <div className="modal-overlay" onClick={() => setShowMapModal(false)}>
                        <div className="modal modal-lg map-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>🗺️ Sélectionner l'emplacement</h3>
                                <button className="modal-close" onClick={() => setShowMapModal(false)}>×</button>
                            </div>
                            <div className="modal-body map-body">
                                <AddressSearch onLocationFound={handleAddressFound} />
                                <div className="map-container">
                                    <MapContainer
                                        center={mapCenter || [12.3714, -1.5197]}
                                        zoom={13}
                                        style={{ height: '400px', width: '100%', borderRadius: '12px' }}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <MapClickHandler onMapClick={handleLocationSelect} />
                                        <DraggableMarker
                                            position={[selectedLocation.lat, selectedLocation.lng]}
                                            onPositionChange={handleLocationSelect}
                                        />
                                        {mapCenter && <MapCenter center={mapCenter} />}
                                    </MapContainer>
                                </div>
                                <div className="map-coords-info">
                                    <div className="coord-display">
                                        <span className="coord-label">Latitude:</span>
                                        <span className="coord-value">{selectedLocation.lat.toFixed(6)}</span>
                                    </div>
                                    <div className="coord-display">
                                        <span className="coord-label">Longitude:</span>
                                        <span className="coord-value">{selectedLocation.lng.toFixed(6)}</span>
                                    </div>
                                </div>
                                <div className="map-actions">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                latitude: selectedLocation.lat,
                                                longitude: selectedLocation.lng
                                            });
                                            setShowMapModal(false);
                                            toast.success('Position enregistrée');
                                        }}
                                    >
                                        ✅ Confirmer la position
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Détails du commerçant */}
                {selectedMerchant && (
                    <div className="modal-overlay" onClick={() => { setSelectedMerchant(null); setActiveTab('merchants'); }}>
                        <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">🏪 {selectedMerchant.name}</h3>
                                <button className="modal-close" onClick={() => { setSelectedMerchant(null); setActiveTab('merchants'); }}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="merchant-info-section">
                                    <div className="info-row">
                                        <span className="info-label">Téléphone:</span>
                                        <span>{selectedMerchant.phone || '-'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Email:</span>
                                        <span>{selectedMerchant.email || '-'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Adresse:</span>
                                        <span>{selectedMerchant.address || '-'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Ville:</span>
                                        <span>{selectedMerchant.city || '-'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Cashback:</span>
                                        <span>{selectedMerchant.cashback_percent || 2.5}%</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Statut:</span>
                                        <span>{selectedMerchant.is_verified ? '✅ Vérifié' : '⏳ En attente'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Coordonnées:</span>
                                        <span>
                                            {selectedMerchant.latitude && selectedMerchant.longitude ? (
                                                <a
                                                    href={`https://www.openstreetmap.org/?mlat=${selectedMerchant.latitude}&mlon=${selectedMerchant.longitude}&zoom=15`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="geo-link"
                                                >
                                                    {selectedMerchant.latitude.toFixed(6)}, {selectedMerchant.longitude.toFixed(6)} 🗺️
                                                </a>
                                            ) : (
                                                'Non défini'
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="merchant-tabs">
                                    <button
                                        className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('products')}
                                    >
                                        📦 Produits ({products.length})
                                    </button>
                                    <button
                                        className={`tab-btn ${activeTab === 'merchant-transactions' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('merchant-transactions')}
                                    >
                                        💰 Transactions ({transactions.length})
                                    </button>
                                </div>

                                {activeTab === 'products' && (
                                    <div className="products-list">
                                        {products.length === 0 ? (
                                            <div className="empty-state">Aucun produit pour ce commerçant</div>
                                        ) : (
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Produit</th>
                                                        <th>Prix</th>
                                                        <th>Stock</th>
                                                        <th>Catégorie</th>
                                                        <th>Statut</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {products.map(p => (
                                                        <tr key={p.id}>
                                                            <td>{p.name}</td>
                                                            <td>{p.price?.toLocaleString()} FCFA</td>
                                                            <td className={p.stock === 0 ? 'text-danger' : ''}>{p.stock || 0}</td>
                                                            <td>{p.category || '-'}</td>
                                                            <td>{p.isActive ? '✅ Actif' : '❌ Inactif'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'merchant-transactions' && (
                                    <div className="transactions-list">
                                        {transactions.length === 0 ? (
                                            <div className="empty-state">Aucune transaction pour ce commerçant</div>
                                        ) : (
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Client</th>
                                                        <th>Montant</th>
                                                        <th>Type</th>
                                                        <th>Points</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {transactions.map(t => (
                                                        <tr key={t.id}>
                                                            <td>{new Date(t.created_at).toLocaleDateString()}</td>
                                                            <td>{t.customer_name || t.customer?.name || '-'}</td>
                                                            <td className="amount">{t.amount?.toLocaleString()} FCFA</td>
                                                            <td>{t.type === 'purchase' ? 'Achat' : t.type}</td>
                                                            <td>{t.points_earned || 0}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-primary" onClick={() => { setSelectedMerchant(null); setActiveTab('merchants'); }}>Fermer</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .merchants-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .merchant-card {
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid #e2e8f0;
                }
                .merchant-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
                }
                .merchant-card-header {
                    padding: 16px;
                    background: linear-gradient(135deg, #2563eb, #1e40af);
                    color: white;
                    display: flex;
                    gap: 12px;
                }
                .merchant-icon {
                    font-size: 40px;
                }
                .merchant-info {
                    flex: 1;
                }
                .merchant-name {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                }
                .merchant-location {
                    font-size: 12px;
                    opacity: 0.8;
                    margin: 4px 0 0;
                }
                .merchant-coords {
                    font-size: 10px;
                    opacity: 0.7;
                    margin: 2px 0 0;
                    font-family: monospace;
                }
                .merchant-status {
                    align-self: flex-start;
                }
                .merchant-card-body {
                    padding: 16px;
                }
                .merchant-detail {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 0;
                    border-bottom: 1px solid #f0f0f0;
                    font-size: 13px;
                }
                .merchant-detail:last-child {
                    border-bottom: none;
                }
                .detail-icon {
                    width: 24px;
                    font-size: 14px;
                }
                .coords-link {
                    color: #2563eb;
                    cursor: pointer;
                    text-decoration: underline;
                    font-size: 12px;
                }
                .merchant-card-footer {
                    padding: 12px 16px;
                    background: #f8fafc;
                    display: flex;
                    gap: 8px;
                    border-top: 1px solid #e2e8f0;
                }
                .merchant-info-section {
                    background: #f8fafc;
                    padding: 16px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                }
                .info-row {
                    display: flex;
                    gap: 12px;
                }
                .info-label {
                    font-weight: 600;
                    color: #64748b;
                    width: 120px;
                }
                .geo-link {
                    color: #2563eb;
                    text-decoration: none;
                    font-weight: 500;
                }
                .geo-link:hover {
                    text-decoration: underline;
                }
                .merchant-tabs {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 12px;
                }
                .merchant-tabs .tab-btn {
                    padding: 8px 20px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-weight: 500;
                    color: #64748b;
                }
                .merchant-tabs .tab-btn.active {
                    color: #2563eb;
                    border-bottom: 2px solid #2563eb;
                    background: none;
                }
                .search-bar {
                    margin: 20px 0;
                }
                .search-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 14px;
                }
                .text-danger {
                    color: #dc2626;
                    font-weight: 600;
                }
                .amount {
                    font-weight: 600;
                    color: #10b981;
                }
                .modal-lg {
                    max-width: 700px;
                }
                .modal-xl {
                    max-width: 900px;
                }

                /* Géolocalisation - Styles */
                .geo-section {
                    margin-top: 16px;
                    padding: 16px;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                }
                .geo-section .section-header h4 {
                    margin: 0 0 4px 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #1e293b;
                }
                .geo-section .section-desc {
                    font-size: 12px;
                    color: #64748b;
                    margin: 0 0 12px 0;
                }
                .geo-inputs {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .geo-inputs .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }
                .geo-preview {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    background: #dbeafe;
                    border-radius: 8px;
                    margin-top: 8px;
                }
                .geo-badge {
                    font-size: 12px;
                    font-weight: 500;
                    color: #1e40af;
                }
                .geo-link {
                    font-size: 12px;
                    color: #2563eb;
                    text-decoration: none;
                }
                .geo-link:hover {
                    text-decoration: underline;
                }

                /* Map Modal */
                .map-modal .modal-body {
                    padding: 16px;
                }
                .map-body {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .map-container {
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                }
                .map-coords-info {
                    display: flex;
                    gap: 24px;
                    padding: 12px;
                    background: #f8fafc;
                    border-radius: 8px;
                }
                .coord-display {
                    display: flex;
                    gap: 8px;
                    font-size: 14px;
                }
                .coord-label {
                    font-weight: 600;
                    color: #64748b;
                }
                .coord-value {
                    font-family: monospace;
                    color: #1e293b;
                    font-weight: 500;
                }
                .map-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding-top: 8px;
                }

                /* Address Search */
                .address-search {
                    position: relative;
                    width: 100%;
                }
                .search-input-wrapper {
                    position: relative;
                }
                .search-input-wrapper .form-input {
                    padding-right: 40px;
                }
                .search-spinner {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .suggestions-list {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 1000;
                    list-style: none;
                    margin: 4px 0 0;
                    padding: 0;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .suggestions-list li {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 12px;
                    cursor: pointer;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 13px;
                    transition: background 0.15s;
                }
                .suggestions-list li:hover {
                    background: #f1f5f9;
                }
                .suggestions-list li:last-child {
                    border-bottom: none;
                }
                .suggestion-icon {
                    font-size: 16px;
                    color: #64748b;
                }
                .suggestion-text {
                    flex: 1;
                    color: #1e293b;
                }

                @media (max-width: 768px) {
                    .merchant-info-section {
                        grid-template-columns: 1fr;
                    }
                    .geo-inputs .form-row {
                        grid-template-columns: 1fr;
                    }
                    .map-coords-info {
                        flex-direction: column;
                        gap: 8px;
                    }
                }
            `}</style>
        </>
    );
}

export default AdminMerchants;