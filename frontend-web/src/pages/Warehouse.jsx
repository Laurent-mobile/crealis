// frontend-web/src/pages/Warehouse.jsx
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../api'
import toast from 'react-hot-toast'

function Warehouse() {
    const [warehouse, setWarehouse] = useState(null)
    const [stocks, setStocks] = useState([])
    const [products, setProducts] = useState([])
    const [merchants, setMerchants] = useState([])
    const [stats, setStats] = useState({})
    const [movements, setMovements] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('stock')
    const [showSupplyModal, setShowSupplyModal] = useState(false)
    const [showAddStockModal, setShowAddStockModal] = useState(false)
    const [showReceiveModal, setShowReceiveModal] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [suppliers, setSuppliers] = useState([])
    const [warehouseRequests, setWarehouseRequests] = useState([])
    const [supplyData, setSupplyData] = useState({
        merchantId: '',
        productId: '',
        quantity: '',
        reason: ''
    })
    const [addStockData, setAddStockData] = useState({
        productId: '',
        quantity: '',
        reason: '',
        supplier: ''
    })
    const [receiveData, setReceiveData] = useState({
        productId: '',
        quantity: '',
        reference: '',
        supplier: '',
        notes: ''
    })

    // Fonctions de gestion des demandes
    const fetchWarehouseRequests = async () => {
        try {
            const response = await api.get('/warehouse/requests');
            setWarehouseRequests(response.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    const handleApproveRequest = async (requestId) => {
        try {
            await api.put(`/warehouse/requests/${requestId}/approve`);
            toast.success('Demande approuvée');
            fetchWarehouseRequests();
        } catch (error) {
            toast.error('Erreur lors de l\'approbation');
        }
    };

    const handleRejectRequest = async (requestId) => {
        if (window.confirm('Annuler cette demande ?')) {
            try {
                await api.put(`/warehouse/requests/${requestId}/reject`);
                toast.success('Demande annulée');
                fetchWarehouseRequests();
            } catch (error) {
                toast.error('Erreur lors de l\'annulation');
            }
        }
    };

    const handleShipRequest = async (requestId) => {
        try {
            await api.put(`/warehouse/requests/${requestId}/ship`);
            toast.success('Stock expédié au commerçant');
            fetchWarehouseRequests();
        } catch (error) {
            toast.error('Erreur lors de l\'expédition');
        }
    };

    const getRequestStatusBadge = (status) => {
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

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/suppliers')
            setSuppliers(response.data)
        } catch (error) {
            console.error('Error fetching suppliers:', error)
        }
    }

    useEffect(() => {
        fetchWarehouseData()
        fetchProducts()
        fetchMerchants()
        fetchSuppliers()
        fetchMovements()
    }, [])

    const fetchWarehouseData = async () => {
        try {
            const [warehouseRes, stockRes, statsRes] = await Promise.all([
                api.get('/warehouse/main'),
                api.get('/warehouse/stock'),
                api.get('/warehouse/stats')
            ])
            setWarehouse(warehouseRes.data)
            setStocks(stockRes.data.stocks || [])
            setStats(statsRes.data)
        } catch (error) {
            console.error('Error fetching warehouse:', error)
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products')
            setProducts(response.data.products || response.data || [])
        } catch (error) {
            console.error('Error fetching products:', error)
        }
    }

    const fetchMerchants = async () => {
        try {
            const response = await api.get('/merchants')
            setMerchants(response.data)
        } catch (error) {
            console.error('Error fetching merchants:', error)
            toast.error('Erreur lors du chargement des commerçants')
        }
    }

    const fetchMovements = async () => {
        try {
            const response = await api.get('/warehouse/movements?limit=20')
            setMovements(response.data)
        } catch (error) {
            console.error('Error fetching movements:', error)
        }
    }

    const handleAddStock = async () => {
        if (!addStockData.productId || !addStockData.quantity) {
            toast.error('Veuillez remplir tous les champs')
            return
        }
        try {
            await api.post('/warehouse/stock/add', addStockData)
            toast.success(`${addStockData.quantity} unités ajoutées au stock`)
            setShowAddStockModal(false)
            setAddStockData({ productId: '', quantity: '', reason: '', supplier: '' })
            fetchWarehouseData()
            fetchMovements()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur')
        }
    }

    const handleReceiveStock = async () => {
        if (!receiveData.productId || !receiveData.quantity || receiveData.quantity <= 0) {
            toast.error('Veuillez sélectionner un produit et entrer une quantité valide')
            return
        }
        try {
            const response = await api.post('/warehouse/stock/receive', receiveData)
            toast.success(response.data.message || `Réception de ${receiveData.quantity} unités enregistrée`)
            setShowReceiveModal(false)
            setReceiveData({ productId: '', quantity: '', reference: '', supplier: '', notes: '' })
            fetchWarehouseData()
            fetchMovements()
        } catch (error) {
            console.error('Error receiving stock:', error)
            toast.error(error.response?.data?.message || 'Erreur lors de la réception')
        }
    }

    const handleSupplyMerchant = async () => {
        if (!supplyData.merchantId || !supplyData.productId || !supplyData.quantity) {
            toast.error('Veuillez remplir tous les champs')
            return
        }
        try {
            const response = await api.post('/warehouse/supply-merchant', supplyData)
            toast.success(`${response.data.quantity} unités livrées à ${response.data.merchant}`)
            setShowSupplyModal(false)
            setSupplyData({ merchantId: '', productId: '', quantity: '', reason: '' })
            fetchWarehouseData()
            fetchMovements()
            fetchProducts()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur')
        }
    }

    const getStockStatus = (stock) => {
        if (stock.quantity === 0) return { status: 'rupture', label: 'Rupture de stock', color: '#ef4444' }
        if (stock.quantity <= stock.minStock) return { status: 'low', label: 'Stock faible', color: '#f59e0b' }
        if (stock.quantity >= stock.maxStock) return { status: 'high', label: 'Surstock', color: '#06b6d4' }
        return { status: 'normal', label: 'Stock normal', color: '#10b981' }
    }

    const getStockPercentage = (stock) => {
        return Math.min((stock.quantity / stock.maxStock) * 100, 100)
    }

    const lowStockItems = stocks.filter(s => s.quantity <= s.minStock && s.quantity > 0)
    const outOfStockItems = stocks.filter(s => s.quantity === 0)

    if (loading) {
        return (
            <>
                <div className="spinner-container"><div className="spinner"></div></div>
            </>
        )
    }

    return (
        
            <div className="warehouse-container">
                {/* En-tête */}
                <div className="page-header">
                    <div className="page-header-content">
                        <div className="page-badge">
                            <span className="page-badge-icon">🏭</span>
                            <span className="page-badge-text">Gestion d'entrepôt</span>
                        </div>
                        <h1 className="page-title">Entrepôt Principal</h1>
                        <p className="page-subtitle">Gestion des stocks et approvisionnement</p>
                    </div>
                </div>

                {/* Cartes d'information entrepôt */}
                <div className="warehouse-stats-grid">
                    <div className="warehouse-stat-card">
                        <div className="stat-icon">📦</div>
                        <div className="stat-info">
                            <div className="stat-title">Produits en stock</div>
                            <div className="stat-value">{stats.totalProducts || 0}</div>
                        </div>
                    </div>
                    <div className="warehouse-stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                            <div className="stat-title">Stock total (unités)</div>
                            <div className="stat-value">{stats.totalQuantity?.toLocaleString() || 0}</div>
                        </div>
                    </div>
                    <div className="warehouse-stat-card">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-info">
                            <div className="stat-title">Alertes stock</div>
                            <div className="stat-value">{stats.lowStock || 0}</div>
                            <div className="stat-trend">{outOfStockItems.length} en rupture</div>
                        </div>
                    </div>
                    <div className="warehouse-stat-card">
                        <div className="stat-icon">🔄</div>
                        <div className="stat-info">
                            <div className="stat-title">Mouvements (30j)</div>
                            <div className="stat-value">{stats.recentMovements || 0}</div>
                        </div>
                    </div>
                </div>

                {/* Alertes stock */}
                {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
                    <div className="stock-alerts">
                        <div className="alert-header">
                            <span className="alert-icon">⚠️</span>
                            <span className="alert-title">Alertes stock</span>
                        </div>
                        <div className="alert-list">
                            {outOfStockItems.map(item => (
                                <div key={item.id} className="alert-item critical">
                                    <span className="alert-status">🔴</span>
                                    <span className="alert-product">{item.product?.name}</span>
                                    <span className="alert-message">Rupture de stock</span>
                                    <button className="btn btn-sm btn-primary" onClick={() => setShowAddStockModal(true)}>
                                        Réapprovisionner
                                    </button>
                                </div>
                            ))}
                            {lowStockItems.map(item => (
                                <div key={item.id} className="alert-item warning">
                                    <span className="alert-status">🟡</span>
                                    <span className="alert-product">{item.product?.name}</span>
                                    <span className="alert-message">Stock faible: {item.quantity} unités</span>
                                    <button className="btn btn-sm btn-outline" onClick={() => setShowAddStockModal(true)}>
                                        Commander
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions rapides */}
                <div className="quick-actions-grid">
                    <div className="quick-action" onClick={() => setShowReceiveModal(true)}>
                        <div className="action-icon">📥</div>
                        <div className="action-title">Réception</div>
                        <div className="action-desc">Enregistrer une livraison</div>
                    </div>
                    <div className="quick-action" onClick={() => setShowAddStockModal(true)}>
                        <div className="action-icon">➕</div>
                        <div className="action-title">Ajouter stock</div>
                        <div className="action-desc">Ajouter manuellement</div>
                    </div>
                    <div className="quick-action" onClick={() => setShowSupplyModal(true)}>
                        <div className="action-icon">📤</div>
                        <div className="action-title">Approvisionner</div>
                        <div className="action-desc">Livrer un commerçant</div>
                    </div>
                    <div className="quick-action" onClick={() => setActiveTab('movements')}>
                        <div className="action-icon">📜</div>
                        <div className="action-title">Historique</div>
                        <div className="action-desc">Voir les mouvements</div>
                    </div>
                </div>

                {/* Onglets */}
                <div className="warehouse-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stock')}
                    >
                        <span className="tab-icon">📦</span>
                        <span>Stock Entrepôt</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'movements' ? 'active' : ''}`}
                        onClick={() => setActiveTab('movements')}
                    >
                        <span className="tab-icon">🔄</span>
                        <span>Historique</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('requests');
                            fetchWarehouseRequests();
                        }}
                    >
                        <span className="tab-icon">📋</span>
                        <span>Demandes commerçants</span>
                    </button>
                </div>

                {/* Stock Entrepôt */}
                {activeTab === 'stock' && (
                    <div className="stock-grid">
                        {stocks.map((stock) => {
                            const status = getStockStatus(stock)
                            const percentage = getStockPercentage(stock)
                            return (
                                <div key={stock.id} className="stock-card">
                                    <div className="stock-card-header">
                                        <div className="stock-product-info">
                                            <div className="stock-product-name">{stock.product?.name}</div>
                                            <div className="stock-product-sku">SKU: {stock.product?.sku || 'N/A'}</div>
                                        </div>
                                        <div className="stock-status" style={{ backgroundColor: status.color + '20', color: status.color }}>
                                            {status.label}
                                        </div>
                                    </div>
                                    <div className="stock-card-body">
                                        <div className="stock-quantity">
                                            <span className="quantity-value" style={{ color: status.color }}>{stock.quantity}</span>
                                            <span className="quantity-unit">{stock.product?.unit || 'unités'}</span>
                                        </div>
                                        <div className="stock-progress">
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${percentage}%`, backgroundColor: status.color }}></div>
                                            </div>
                                            <div className="progress-labels">
                                                <span>Min: {stock.minStock}</span>
                                                <span>Réapro: {stock.reorderPoint}</span>
                                                <span>Max: {stock.maxStock}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="stock-card-footer">
                                        <button className="btn btn-sm btn-primary" onClick={() => {
                                            setSupplyData({ ...supplyData, productId: stock.productId })
                                            setShowSupplyModal(true)
                                        }}>
                                            📤 Approvisionner
                                        </button>
                                        <button className="btn btn-sm btn-outline" onClick={() => {
                                            setAddStockData({ ...addStockData, productId: stock.productId })
                                            setShowAddStockModal(true)
                                        }}>
                                            📥 Ajouter stock
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Historique des mouvements */}
                {activeTab === 'movements' && (
                    <div className="movements-timeline">
                        {movements.map((movement) => (
                            <div key={movement.id} className={`movement-item ${movement.type === 'inbound' ? 'inbound' : 'outbound'}`}>
                                <div className="movement-icon">
                                    {movement.type === 'inbound' ? '📥' : '📤'}
                                </div>
                                <div className="movement-content">
                                    <div className="movement-title">
                                        {movement.type === 'inbound' ? 'Entrée de stock' : 'Sortie de stock'}
                                    </div>
                                    <div className="movement-product">{movement.product?.name}</div>
                                    <div className="movement-details">
                                        <span className="movement-quantity">
                                            {movement.type === 'inbound' ? '+' : '-'}{movement.quantity} unités
                                        </span>
                                        <span className="movement-merchant">
                                            {movement.merchant?.name || movement.supplier || 'Entrepôt'}
                                        </span>
                                        <span className="movement-date">
                                            {new Date(movement.createdAt).toLocaleString('fr-FR')}
                                        </span>
                                    </div>
                                    {movement.reason && (
                                        <div className="movement-reason">📝 {movement.reason}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {movements.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <div className="empty-state-text">Aucun mouvement pour le moment</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Demandes des commerçants */}
                {activeTab === 'requests' && (
                    <div className="warehouse-requests">
                        <div className="requests-header">
                            <h3>📋 Demandes de réapprovisionnement</h3>
                            <p>Gérez les demandes des commerçants partenaires</p>
                        </div>

                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Commerçant</th>
                                        <th>Produit</th>
                                        <th>Quantité</th>
                                        <th>Statut</th>
                                        <th>Note</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {warehouseRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center">Aucune demande en attente</td>
                                        </tr>
                                    ) : (
                                        warehouseRequests.map((request) => (
                                            <tr key={request.id}>
                                                <td>{new Date(request.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="merchant-info">
                                                        <strong>{request.merchant?.name}</strong>
                                                        <small>{request.merchant?.city}</small>
                                                    </div>
                                                </td>
                                                <td>{request.product?.name}</td>
                                                <td className="quantity-cell">{request.quantity} unités</td>
                                                <td>{getRequestStatusBadge(request.status)}</td>
                                                <td>{request.note || '-'}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        {request.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    className="btn btn-sm btn-success"
                                                                    onClick={() => handleApproveRequest(request.id)}
                                                                >
                                                                    ✅ Approuver
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => handleRejectRequest(request.id)}
                                                                >
                                                                    ❌ Rejeter
                                                                </button>
                                                            </>
                                                        )}
                                                        {request.status === 'approved' && (
                                                            <button
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => handleShipRequest(request.id)}
                                                            >
                                                                📦 Expédier
                                                            </button>
                                                        )}
                                                        {request.status === 'shipped' && (
                                                            <span className="badge badge-info">📦 Expédiée</span>
                                                        )}
                                                        {request.status === 'received' && (
                                                            <span className="badge badge-success">✅ Reçue</span>
                                                        )}
                                                        {request.status === 'cancelled' && (
                                                            <span className="badge badge-danger">❌ Annulée</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Modal Réception stock */}
                {showReceiveModal && (
                    <div className="modal-overlay" onClick={() => setShowReceiveModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">📥 Réception de marchandises</h3>
                                <button className="modal-close" onClick={() => setShowReceiveModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Produit *</label>
                                    <select
                                        className="form-select"
                                        value={receiveData.productId}
                                        onChange={(e) => setReceiveData({ ...receiveData, productId: e.target.value })}
                                        required
                                    >
                                        <option value="">Sélectionner un produit</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} (Stock actuel: {p.stock || 0})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Quantité *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={receiveData.quantity}
                                            onChange={(e) => setReceiveData({ ...receiveData, quantity: parseInt(e.target.value) })}
                                            placeholder="Nombre d'unités"
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Fournisseur</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={receiveData.supplier}
                                            onChange={(e) => setReceiveData({ ...receiveData, supplier: e.target.value })}
                                            placeholder="Nom du fournisseur"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">N° Bon de livraison</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={receiveData.reference}
                                        onChange={(e) => setReceiveData({ ...receiveData, reference: e.target.value })}
                                        placeholder="Référence"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        className="form-textarea"
                                        rows="2"
                                        value={receiveData.notes}
                                        onChange={(e) => setReceiveData({ ...receiveData, notes: e.target.value })}
                                        placeholder="Informations supplémentaires..."
                                    />
                                </div>
                                {receiveData.productId && receiveData.quantity && (
                                    <div className="info-box">
                                        📊 Aperçu: {receiveData.quantity} unités seront ajoutées au stock
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-outline" onClick={() => setShowReceiveModal(false)}>Annuler</button>
                                <button className="btn btn-primary" onClick={handleReceiveStock}>Valider la réception</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Ajout Stock */}
                {showAddStockModal && (
                    <div className="modal-overlay" onClick={() => setShowAddStockModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">➕ Ajouter du stock</h3>
                                <button className="modal-close" onClick={() => setShowAddStockModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Produit</label>
                                    <select className="form-select" value={addStockData.productId} onChange={(e) => setAddStockData({ ...addStockData, productId: e.target.value })}>
                                        <option value="">Sélectionner un produit</option>
                                        {stocks.map(s => <option key={s.productId} value={s.productId}>{s.product?.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Quantité</label>
                                        <input type="number" className="form-input" value={addStockData.quantity} onChange={(e) => setAddStockData({ ...addStockData, quantity: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Fournisseur</label>
                                        <input type="text" className="form-input" value={addStockData.supplier} onChange={(e) => setAddStockData({ ...addStockData, supplier: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Raison</label>
                                    <textarea className="form-textarea" rows="2" value={addStockData.reason} onChange={(e) => setAddStockData({ ...addStockData, reason: e.target.value })} placeholder="Ex: Réapprovisionnement" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-outline" onClick={() => setShowAddStockModal(false)}>Annuler</button>
                                <button className="btn btn-primary" onClick={handleAddStock}>Ajouter</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Approvisionnement */}
                {showSupplyModal && (
                    <div className="modal-overlay" onClick={() => setShowSupplyModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">📤 Approvisionner un commerçant</h3>
                                <button className="modal-close" onClick={() => setShowSupplyModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Commerçant *</label>
                                    <select
                                        className="form-select"
                                        value={supplyData.merchantId}
                                        onChange={(e) => setSupplyData({ ...supplyData, merchantId: e.target.value })}
                                        required
                                    >
                                        <option value="">Sélectionner un commerçant</option>
                                        {merchants.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} - {m.city}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Produit</label>
                                    <select className="form-select" value={supplyData.productId} onChange={(e) => setSupplyData({ ...supplyData, productId: e.target.value })}>
                                        <option value="">Sélectionner un produit</option>
                                        {stocks.map(s => (
                                            <option key={s.productId} value={s.productId}>
                                                {s.product?.name} (Stock: {s.quantity})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Quantité</label>
                                        <input type="number" className="form-input" value={supplyData.quantity} onChange={(e) => setSupplyData({ ...supplyData, quantity: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Raison</label>
                                        <input type="text" className="form-input" value={supplyData.reason} onChange={(e) => setSupplyData({ ...supplyData, reason: e.target.value })} placeholder="Réapprovisionnement" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-outline" onClick={() => setShowSupplyModal(false)}>Annuler</button>
                                <button className="btn btn-primary" onClick={handleSupplyMerchant}>Approvisionner</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        
    )
}

export default Warehouse
