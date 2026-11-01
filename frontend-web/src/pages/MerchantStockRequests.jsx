// frontend-web/src/pages/MerchantStockRequests.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import toast from 'react-hot-toast';

function MerchantStockRequests() {
    const [activeTab, setActiveTab] = useState('available');
    const [availableProducts, setAvailableProducts] = useState([]);
    const [myStock, setMyStock] = useState([]);
    const [requests, setRequests] = useState([]);
    const [supplyHistory, setSupplyHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [requestQuantity, setRequestQuantity] = useState(1);
    const [requestNote, setRequestNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const filteredMyStock = showLowStockOnly
        ? myStock.filter(p => (p.stock || 0) <= (p.minStockAlert || 10))
        : myStock;

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'available') {
                const warehouseResponse = await api.get('/warehouse/stock');
                const warehouseStocks = warehouseResponse.data.stocks || [];
                const myProductsResponse = await api.get('/products');
                const myProducts = myProductsResponse.data.products || [];
                const myProductIds = new Set(myProducts.map(p => p.id));

                const available = warehouseStocks
                    .filter(s => !myProductIds.has(s.productId) && s.quantity > 0)
                    .map(s => ({
                        id: s.productId,
                        name: s.product?.name,
                        price: s.product?.price,
                        availableStock: s.quantity,
                        minOrder: 1,
                        maxOrder: s.quantity,
                        image_url: s.product?.image_url
                    }));

                setAvailableProducts(available);
            } else if (activeTab === 'myStock') {
                const response = await api.get('/products');
                setMyStock(response.data.products || []);
            } else if (activeTab === 'requests') {
                const response = await api.get('/merchant-stock/requests');
                setRequests(response.data || []);
            } else if (activeTab === 'history') {
                const response = await api.get('/notifications/supply-history');
                setSupplyHistory(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestStock = async () => {
        if (!selectedProduct) return;
        if (!requestQuantity || requestQuantity < 1) {
            toast.error('Veuillez entrer une quantité valide');
            return;
        }
        if (requestQuantity > selectedProduct.availableStock) {
            toast.error(`Stock disponible insuffisant. Maximum: ${selectedProduct.availableStock}`);
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/merchant-stock/requests', {
                productId: selectedProduct.id,
                quantity: requestQuantity,
                note: requestNote
            });
            toast.success('Demande de réapprovisionnement envoyée');
            setShowRequestModal(false);
            setSelectedProduct(null);
            setRequestQuantity(1);
            setRequestNote('');
            fetchData();
        } catch (error) {
            console.error('Error requesting stock:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de la demande');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReceiveTransfer = async (requestId) => {
        try {
            await api.post(`/merchant-stock/requests/${requestId}/receive`);
            toast.success('Stock reçu avec succès');
            fetchData();
        } catch (error) {
            console.error('Error receiving stock:', error);
            toast.error('Erreur lors de la réception du stock');
        }
    };

    const getStatusBadge = (status) => {
        const statuses = {
            pending: { label: 'En attente', class: 'badge-warning', icon: '⏳' },
            approved: { label: 'Approuvée', class: 'badge-info', icon: '✅' },
            shipped: { label: 'Expédiée', class: 'badge-primary', icon: '📦' },
            received: { label: 'Reçue', class: 'badge-success', icon: '🎉' },
            cancelled: { label: 'Annulée', class: 'badge-danger', icon: '❌' }
        };
        const s = statuses[status] || statuses.pending;
        return <span className={`badge ${s.class}`}>{s.icon} {s.label}</span>;
    };

    if (loading) {
        return (
            <Layout>
                <div className="spinner-container"><div className="spinner"></div></div>
            </Layout>
        );
    }

    // ✅ CORRECTION ICI : Ajout des balises <Layout> et </Layout> qui manquaient
    return (
        <Layout>
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">📦 Réapprovisionnement</h1>
                        <p className="page-subtitle">Gérez vos demandes de stock depuis l'entrepôt central</p>
                    </div>
                </div>

                <div className="stock-tabs">
                    <button className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`} onClick={() => setActiveTab('available')}>
                        <span className="tab-icon">🏭</span><span>Disponible à l'entrepôt</span>
                    </button>
                    <button className={`tab-btn ${activeTab === 'myStock' ? 'active' : ''}`} onClick={() => setActiveTab('myStock')}>
                        <span className="tab-icon">📦</span><span>Mon stock actuel</span>
                    </button>
                    <button className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
                        <span className="tab-icon">📋</span><span>Mes demandes</span>
                    </button>
                    <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                        <span className="tab-icon">📜</span><span>Historique</span>
                    </button>
                </div>

                {activeTab === 'available' && (
                    <div className="available-products">
                        <div className="info-box">
                            <span className="info-icon">ℹ️</span>
                            <span>Produits disponibles dans l'entrepôt central. Faites une demande pour réapprovisionner votre boutique.</span>
                        </div>
                        <div className="products-grid">
                            {availableProducts.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">🏭</div>
                                    <div className="empty-state-text">Aucun produit disponible à l'entrepôt</div>
                                </div>
                            ) : (
                                availableProducts.map((product) => (
                                    <div key={product.id} className="stock-product-card">
                                        <div className="product-image">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="product-img" />
                                            ) : (
                                                <div className="product-image-placeholder">📦</div>
                                            )}
                                        </div>
                                        <div className="product-info">
                                            <h3 className="product-name">{product.name}</h3>
                                            <p className="product-price">{product.price?.toLocaleString()} FCFA</p>
                                            <div className="product-stock">
                                                <span className={`stock-badge ${product.availableStock > 50 ? 'high' : product.availableStock > 10 ? 'medium' : 'low'}`}>
                                                    Stock: {product.availableStock} unités
                                                </span>
                                            </div>
                                        </div>
                                        <button className="btn btn-primary" onClick={() => { setSelectedProduct(product); setRequestQuantity(1); setShowRequestModal(true); }}>
                                            📦 Demander
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'myStock' && (
                    <div className="my-stock">
                        <div className="stats-grid-mini">
                            <div className="stat-card-mini">
                                <div className="stat-value">{myStock.length}</div>
                                <div className="stat-label">Produits</div>
                            </div>
                            <div className="stat-card-mini">
                                <div className="stat-value">{myStock.reduce((sum, p) => sum + (p.stock || 0), 0).toLocaleString()}</div>
                                <div className="stat-label">Unités totales</div>
                            </div>
                            <div className="stat-card-mini">
                                <div className="stat-value">{myStock.filter(p => (p.stock || 0) <= (p.minStockAlert || 10)).length}</div>
                                <div className="stat-label">Stock faible</div>
                            </div>
                        </div>
                        <div className="stock-summary">
                            <div className="summary-item">
                                <span className="summary-label">Stock total:</span>
                                <span className="summary-value">{myStock.reduce((sum, p) => sum + (p.stock || 0), 0)} unités</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Valeur totale:</span>
                                <span className="summary-value">{myStock.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0).toLocaleString()} FCFA</span>
                            </div>
                            <div className="summary-item">
                                <label className="checkbox-label">
                                    <input type="checkbox" checked={showLowStockOnly} onChange={(e) => setShowLowStockOnly(e.target.checked)} />
                                    <span>⚠️ Afficher uniquement les produits en stock faible</span>
                                </label>
                            </div>
                        </div>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Produit</th>
                                        <th>Prix</th>
                                        <th>Stock</th>
                                        <th>Seuil d'alerte</th>
                                        <th>Statut</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMyStock.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center">Aucun produit dans votre inventaire</td></tr>
                                    ) : (
                                        filteredMyStock.map((product) => (
                                            <tr key={product.id}>
                                                <td>
                                                    <div className="product-cell">
                                                        <span className="product-icon">📦</span>
                                                        <span>{product.name}</span>
                                                    </div>
                                                </td>
                                                <td>{product.price?.toLocaleString()} FCFA</td>
                                                <td className={product.stock <= (product.minStockAlert || 10) ? 'text-warning' : ''}>
                                                    {product.stock || 0} unités
                                                </td>
                                                <td>{product.minStockAlert || 10}</td>
                                                <td>
                                                    {(product.stock || 0) === 0 ? (
                                                        <span className="badge badge-danger">🔴 Rupture</span>
                                                    ) : (product.stock || 0) <= (product.minStockAlert || 10) ? (
                                                        <span className="badge badge-warning">🟡 Stock faible</span>
                                                    ) : (
                                                        <span className="badge badge-success">🟢 Normal</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline" onClick={() => {
                                                        setSelectedProduct({ id: product.product_id || product.id, name: product.name, availableStock: 1000 });
                                                        setRequestQuantity(product.reorderQuantity || 50);
                                                        setShowRequestModal(true);
                                                    }}>
                                                        📦 Réapprovisionner
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="my-requests">
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Produit</th>
                                        <th>Quantité</th>
                                        <th>Statut</th>
                                        <th>Note</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center">Aucune demande de réapprovisionnement</td></tr>
                                    ) : (
                                        requests.map((request) => (
                                            <tr key={request.id}>
                                                <td>{new Date(request.created_at).toLocaleDateString()}</td>
                                                <td>{request.product?.name || request.productName}</td>
                                                <td>{request.quantity} unités</td>
                                                <td>{getStatusBadge(request.status)}</td>
                                                <td>{request.note || '-'}</td>
                                                <td>
                                                    {request.status === 'shipped' && (
                                                        <button className="btn btn-sm btn-success" onClick={() => handleReceiveTransfer(request.id)}>
                                                            ✅ Confirmer réception
                                                        </button>
                                                    )}
                                                    {request.status === 'received' && <span className="badge badge-success">✓ Reçu</span>}
                                                    {request.status === 'pending' && <span className="badge badge-warning">En attente</span>}
                                                    {request.status === 'approved' && <span className="badge badge-info">Approuvée</span>}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="supply-history">
                        <div className="info-box">
                            <span className="info-icon">📜</span>
                            <span>Historique complet de vos réapprovisionnements</span>
                        </div>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Produit</th>
                                        <th>Quantité</th>
                                        <th>Stock avant</th>
                                        <th>Stock après</th>
                                        <th>Type</th>
                                        <th>Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {supplyHistory.length === 0 ? (
                                        <tr><td colSpan="7" className="text-center">Aucun historique de réapprovisionnement</td></tr>
                                    ) : (
                                        supplyHistory.map((record) => (
                                            <tr key={record.id}>
                                                <td>{new Date(record.created_at).toLocaleString()}</td>
                                                <td>{record.product?.name || '-'}</td>
                                                <td className="text-success">+{record.quantity} unités</td>
                                                <td>{record.previous_stock} unités</td>
                                                <td className="text-primary">{record.new_stock} unités</td>
                                                <td>
                                                    <span className={`badge ${record.source_type === 'direct' ? 'badge-info' : 'badge-warning'}`}>
                                                        {record.source_type === 'direct' ? 'Direct' : 'Demande'}
                                                    </span>
                                                </td>
                                                <td>{record.note || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {showRequestModal && selectedProduct && (
                    <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">📦 Demande de réapprovisionnement</h3>
                                <button className="modal-close" onClick={() => setShowRequestModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="request-product-info">
                                    <div className="product-detail">
                                        <span className="label">Produit:</span>
                                        <span className="value">{selectedProduct.name}</span>
                                    </div>
                                    <div className="product-detail">
                                        <span className="label">Stock disponible entrepôt:</span>
                                        <span className={`value ${selectedProduct.availableStock < 50 ? 'text-warning' : ''}`}>
                                            {selectedProduct.availableStock} unités
                                        </span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Quantité demandée *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={requestQuantity}
                                        onChange={(e) => setRequestQuantity(parseInt(e.target.value))}
                                        min="1"
                                        max={selectedProduct.availableStock}
                                    />
                                    <small className="form-hint">Maximum: {selectedProduct.availableStock} unités</small>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Note (optionnel)</label>
                                    <textarea
                                        className="form-textarea"
                                        rows="3"
                                        value={requestNote}
                                        onChange={(e) => setRequestNote(e.target.value)}
                                        placeholder="Ajoutez une note pour l'entrepôt..."
                                    />
                                </div>
                                <div className="info-box">
                                    <span className="info-icon">📋</span>
                                    <span>Votre demande sera traitée par l'entrepôt. Vous serez notifié dès que le stock sera expédié.</span>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-outline" onClick={() => setShowRequestModal(false)}>Annuler</button>
                                <button className="btn btn-primary" onClick={handleRequestStock} disabled={submitting}>
                                    {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .stock-tabs { display: flex; gap: 10px; margin-bottom: 24px; border-bottom: 1px solid var(--gray-200); padding-bottom: 12px; }
                .stock-tabs .tab-btn { padding: 8px 20px; background: none; border: none; font-size: 14px; font-weight: 500; color: var(--gray-600); cursor: pointer; border-radius: 20px; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
                .stock-tabs .tab-btn:hover { background: var(--gray-100); color: var(--primary); }
                .stock-tabs .tab-btn.active { background: var(--primary); color: white; }
                .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 20px; }
                .stock-product-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; }
                .stock-product-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
                .stock-product-card .product-image { width: 100%; height: 150px; background: var(--gray-100); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
                .stock-product-card .product-img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
                .stock-product-card .product-image-placeholder { font-size: 48px; }
                .stock-product-card .product-info { margin-bottom: 12px; }
                .stock-product-card .product-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
                .stock-product-card .product-price { color: var(--primary); font-weight: 600; margin-bottom: 8px; }
                .stock-badge { display: inline-block; padding: 4px 8px; border-radius: 20px; font-size: 12px; font-weight: 500; }
                .stock-badge.high { background: #d1fae5; color: #065f46; }
                .stock-badge.medium { background: #fed7aa; color: #92400e; }
                .stock-badge.low { background: #fee2e2; color: #991b1b; }
                .stats-grid-mini { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
                .stat-card-mini { background: white; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .stat-card-mini .stat-value { font-size: 28px; font-weight: bold; color: var(--primary); }
                .stat-card-mini .stat-label { font-size: 12px; color: var(--gray-500); margin-top: 4px; }
                .stock-summary { background: white; border-radius: 12px; padding: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
                .summary-item { display: flex; align-items: center; gap: 8px; }
                .summary-label { font-size: 13px; color: var(--gray-600); }
                .summary-value { font-size: 16px; font-weight: 600; color: var(--gray-800); }
                .product-cell { display: flex; align-items: center; gap: 8px; }
                .product-icon { font-size: 20px; }
                .text-warning { color: var(--warning); font-weight: 600; }
                .text-success { color: #10b981; font-weight: 600; }
                .text-primary { color: #2563eb; font-weight: 600; }
                .text-center { text-align: center; }
                .request-product-info { background: var(--gray-50); padding: 12px; border-radius: 8px; margin-bottom: 16px; }
                .product-detail { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--gray-200); }
                .product-detail:last-child { border-bottom: none; }
                .product-detail .label { font-weight: 500; color: var(--gray-600); }
                .product-detail .value { font-weight: 600; color: var(--gray-800); }
                .info-box { display: flex; align-items: center; gap: 12px; background: #e0e7ff; padding: 12px; border-radius: 8px; margin-top: 16px; font-size: 13px; color: #1e40af; }
                .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
            `}</style>
        </Layout>
    );
}

export default MerchantStockRequests;
