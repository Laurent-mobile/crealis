//fronted-web/src/pages/Products/jsx
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../api'
import toast from 'react-hot-toast'

function Products() {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showStockModal, setShowStockModal] = useState(false)
    const [showAlertsModal, setShowAlertsModal] = useState(false)
    const [showReorderModal, setShowReorderModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [activeTab, setActiveTab] = useState('info')
    const [alerts, setAlerts] = useState([])
    const [reorderRecommendations, setReorderRecommendations] = useState([])
    const [imagePreview, setImagePreview] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [stats, setStats] = useState({
        total: 0,
        totalValue: 0,
        lowStock: 0,
        outOfStock: 0,
        needsReorder: 0
    })
    const [filters, setFilters] = useState({
        search: '',
        category: 'all',
        lowStock: false,
        needsReorder: false
    })
    const [stockUpdate, setStockUpdate] = useState({
        quantity: 0,
        operation: 'add',
        reason: ''
    })

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: 0,
        minStockAlert: 10,
        maxStockAlert: 500,
        reorderPoint: 20,
        reorderQuantity: 50,
        unit: 'pièce',
        category: '',
        brand: '',
        image_url: '',
        hasPromotion: false,
        promotionPercent: 0,
        description: ''
    })

    useEffect(() => {
        fetchProducts()
        fetchCategories()
        fetchStats()
        fetchAlerts()
        fetchReorderRecommendations()

        const interval = setInterval(() => {
            fetchAlerts()
            fetchReorderRecommendations()
        }, 30000)

        return () => clearInterval(interval)
    }, [filters])

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filters.search) params.append('search', filters.search)
            if (filters.category !== 'all') params.append('category', filters.category)
            params.append('limit', 100)

            const response = await api.get(`/products?${params.toString()}`)
            setProducts(response.data.products || [])
            if (response.data.stats) setStats(response.data.stats)
        } catch (error) {
            console.error('Error fetching products:', error)
            toast.error('Erreur lors du chargement des produits')
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const response = await api.get('/products/categories/all')
            setCategories(response.data)
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await api.get('/products/stats/dashboard')
            setStats(response.data)
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const fetchAlerts = async () => {
        try {
            const response = await api.get('/products/alerts/low-stock')
            setAlerts(response.data)
        } catch (error) {
            console.error('Error fetching alerts:', error)
        }
    }

    const fetchReorderRecommendations = async () => {
        try {
            const response = await api.get('/products/alerts/reorder')
            setReorderRecommendations(response.data)
        } catch (error) {
            console.error('Error fetching reorder recommendations:', error)
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Veuillez sélectionner une image')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('L\'image ne doit pas dépasser 5MB')
            return
        }

        setUploading(true)

        const formDataUpload = new FormData()
        formDataUpload.append('image', file)

        try {
            let response
            if (editingProduct) {
                response = await api.post(`/products/${editingProduct.id}/upload-image`, formDataUpload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                toast.success('Image uploadée avec succès')
                setImagePreview(response.data.imageUrl)
                setFormData({ ...formData, image_url: response.data.imageUrl })
                fetchProducts()
            } else {
                response = await api.post('/products/upload-image', formDataUpload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                setImagePreview(response.data.imageUrl)
                setFormData({ ...formData, image_url: response.data.imageUrl })
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Erreur lors de l\'upload de l\'image')
        } finally {
            setUploading(false)
        }
    }

    const handleDeleteImage = async () => {
        if (!editingProduct) {
            setImagePreview(null)
            setFormData({ ...formData, image_url: '' })
            return
        }

        try {
            await api.delete(`/products/${editingProduct.id}/image`)
            toast.success('Image supprimée avec succès')
            setImagePreview(null)
            setFormData({ ...formData, image_url: '' })
            fetchProducts()
        } catch (error) {
            toast.error('Erreur lors de la suppression')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const submitData = {
                name: formData.name,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock) || 0,
                minStockAlert: parseInt(formData.minStockAlert) || 10,
                maxStockAlert: parseInt(formData.maxStockAlert) || 500,
                reorderPoint: parseInt(formData.reorderPoint) || 20,
                reorderQuantity: parseInt(formData.reorderQuantity) || 50,
                unit: formData.unit,
                category: formData.category || null,
                brand: formData.brand || null,
                image_url: formData.image_url || null,
                hasPromotion: formData.hasPromotion,
                promotionPercent: parseFloat(formData.promotionPercent) || 0,
                description: formData.description || null
            }

            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, submitData)
                toast.success('Produit modifié avec succès')
            } else {
                await api.post('/products', submitData)
                toast.success('Produit ajouté avec succès')
            }
            setShowModal(false)
            resetForm()
            fetchProducts()
            fetchStats()
        } catch (error) {
            console.error('Error:', error)
            toast.error(error.response?.data?.message || 'Erreur lors de l\'opération')
        }
    }

    const handleStockUpdate = async () => {
        if (!selectedProduct) return
        try {
            await api.put(`/products/${selectedProduct.id}/stock`, {
                quantity: stockUpdate.quantity,
                operation: stockUpdate.operation,
                reason: stockUpdate.reason
            })
            toast.success('Stock mis à jour avec succès')
            setShowStockModal(false)
            fetchProducts()
            fetchAlerts()
            fetchReorderRecommendations()
            setStockUpdate({ quantity: 0, operation: 'add', reason: '' })
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du stock')
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
            try {
                await api.delete(`/products/${id}`)
                toast.success('Produit supprimé avec succès')
                fetchProducts()
                fetchStats()
            } catch (error) {
                toast.error('Erreur lors de la suppression')
            }
        }
    }

    const resetForm = () => {
        setEditingProduct(null)
        setActiveTab('info')
        setImagePreview(null)
        setFormData({
            name: '',
            price: '',
            stock: 0,
            minStockAlert: 10,
            maxStockAlert: 500,
            reorderPoint: 20,
            reorderQuantity: 50,
            unit: 'pièce',
            category: '',
            brand: '',
            image_url: '',
            hasPromotion: false,
            promotionPercent: 0,
            description: ''
        })
    }

    const handleEdit = (product) => {
        setEditingProduct(product)
        setActiveTab('info')
        setImagePreview(product.image_url)
        setFormData({
            name: product.name || '',
            price: product.price || '',
            stock: product.stock || 0,
            minStockAlert: product.minStockAlert || 10,
            maxStockAlert: product.maxStockAlert || 500,
            reorderPoint: product.reorderPoint || 20,
            reorderQuantity: product.reorderQuantity || 50,
            unit: product.unit || 'pièce',
            category: product.category || '',
            brand: product.brand || '',
            image_url: product.image_url || '',
            hasPromotion: product.hasPromotion || false,
            promotionPercent: product.promotionPercent || 0,
            description: product.description || ''
        })
        setShowModal(true)
    }

    const getStockStatusBadge = (product) => {
        if (product.stock === 0) {
            return <span className="badge badge-danger">🔴 Rupture</span>
        }
        if (product.stock <= (product.minStockAlert || 10)) {
            return <span className="badge badge-warning">🟡 Stock faible ({product.stock})</span>
        }
        return <span className="badge badge-success">🟢 Normal</span>
    }

    if (loading) {
        return (
            <>
                <div className="spinner-container"><div className="spinner"></div></div>
            </>
        )
    }

    return (
        
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Gestion des Produits</h1>
                        <p className="page-subtitle">Catalogue produits, gestion des stocks et alertes</p>
                    </div>
                    <div className="header-actions">
                        {(alerts.length > 0 || reorderRecommendations.length > 0) && (
                            <>
                                <button className="btn btn-warning" onClick={() => setShowAlertsModal(true)}>
                                    ⚠️ Alertes ({alerts.length})
                                </button>
                                <button className="btn btn-info" onClick={() => setShowReorderModal(true)}>
                                    📦 Réapprovisionnement ({reorderRecommendations.length})
                                </button>
                            </>
                        )}
                        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
                            + Nouveau Produit
                        </button>
                    </div>
                </div>

                {/* Cartes statistiques */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📦</div>
                        <div className="stat-content">
                            <div className="stat-title">Total Produits</div>
                            <div className="stat-value">{stats.total}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <div className="stat-title">Valeur stock</div>
                            <div className="stat-value">{stats.totalValue?.toLocaleString()} FCFA</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-content">
                            <div className="stat-title">Stock faible</div>
                            <div className="stat-value">{stats.lowStock}</div>
                            <div className="stat-change">{stats.outOfStock} en rupture</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🔄</div>
                        <div className="stat-content">
                            <div className="stat-title">À réapprovisionner</div>
                            <div className="stat-value">{stats.needsReorder}</div>
                        </div>
                    </div>
                </div>

                {/* Filtres */}
                <div className="filters-bar">
                    <div className="filter-group search-group">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Rechercher un produit..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && fetchProducts()}
                        />
                    </div>
                    <div className="filter-group">
                        <select
                            className="form-select"
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        >
                            <option value="all">Toutes catégories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <label className="checkbox-label">
                        <input type="checkbox" checked={filters.lowStock} onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })} />
                        <span>Stock faible uniquement</span>
                    </label>
                    <label className="checkbox-label">
                        <input type="checkbox" checked={filters.needsReorder} onChange={(e) => setFilters({ ...filters, needsReorder: e.target.checked })} />
                        <span>À réapprovisionner</span>
                    </label>
                    <button className="btn btn-secondary" onClick={() => setFilters({ search: '', category: 'all', lowStock: false, needsReorder: false })}>
                        Réinitialiser
                    </button>
                </div>

                {/* Liste des produits */}
                <div className="products-grid">
                    {products.filter(p => {
                        if (filters.lowStock && p.stock > (p.minStockAlert || 10)) return false
                        if (filters.needsReorder && p.stock > (p.reorderPoint || 20)) return false
                        return true
                    }).map((product) => (
                        <div key={product.id} className="product-card">
                            <div className="product-image">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="product-image-img" />
                                ) : (
                                    <div className="product-image-placeholder">
                                        {product.stock === 0 ? '⚠️' : '📦'}
                                    </div>
                                )}
                            </div>
                            <div className="product-info">
                                <div className="product-name">{product.name}</div>
                                <div className="product-price">{parseFloat(product.price).toLocaleString()} FCFA</div>
                                <div className="product-stock">
                                    Stock: {product.stock} {product.unit || 'unités'}
                                </div>
                                {getStockStatusBadge(product)}
                                {product.hasPromotion && (
                                    <div className="product-promotion">-{product.promotionPercent}% PROMO</div>
                                )}
                            </div>
                            <div className="product-actions">
                                <button className="btn-icon" onClick={() => { setSelectedProduct(product); setShowStockModal(true) }} title="Gérer stock">
                                    📦
                                </button>
                                <button className="btn-icon" onClick={() => handleEdit(product)} title="Modifier">
                                    ✏️
                                </button>
                                <button className="btn-icon" onClick={() => handleDelete(product.id)} title="Supprimer">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal Produit */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">{editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}</h3>
                                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {/* Onglets */}
                                    <div className="form-tabs">
                                        <button type="button" className={`form-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
                                            📋 Informations
                                        </button>
                                        <button type="button" className={`form-tab ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>
                                            📦 Stock & Alertes
                                        </button>
                                        <button type="button" className={`form-tab ${activeTab === 'image' ? 'active' : ''}`} onClick={() => setActiveTab('image')}>
                                            🖼️ Image
                                        </button>
                                        <button type="button" className={`form-tab ${activeTab === 'promo' ? 'active' : ''}`} onClick={() => setActiveTab('promo')}>
                                            🏷️ Promotion
                                        </button>
                                    </div>

                                    {/* Onglet Informations */}
                                    {activeTab === 'info' && (
                                        <div className="form-tab-content active">
                                            <div className="form-group">
                                                <label className="form-label">Nom du produit *</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label className="form-label">Prix (FCFA) *</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={formData.price}
                                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Catégorie</label>
                                                    <select
                                                        className="form-select"
                                                        value={formData.category}
                                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                    >
                                                        <option value="">Sélectionner une catégorie</option>
                                                        {categories.map(cat => (
                                                            <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label className="form-label">Marque</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={formData.brand}
                                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Unité</label>
                                                    <select
                                                        className="form-select"
                                                        value={formData.unit}
                                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                                    >
                                                        <option value="pièce">Pièce</option>
                                                        <option value="kg">Kilogramme</option>
                                                        <option value="litre">Litre</option>
                                                        <option value="paquet">Paquet</option>
                                                        <option value="boîte">Boîte</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Description</label>
                                                <textarea
                                                    className="form-textarea"
                                                    rows="3"
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Onglet Stock & Alertes */}
                                    {activeTab === 'stock' && (
                                        <div className="form-tab-content active">
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label className="form-label">Stock initial</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={formData.stock}
                                                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Unité</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={formData.unit}
                                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label className="form-label">Seuil d'alerte (min)</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={formData.minStockAlert}
                                                        onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) })}
                                                    />
                                                    <small className="text-muted">Alerte quand stock ≤ ce seuil</small>
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Seuil maximum</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={formData.maxStockAlert}
                                                        onChange={(e) => setFormData({ ...formData, maxStockAlert: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label className="form-label">Point de réapprovisionnement</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={formData.reorderPoint}
                                                        onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Quantité de réapprovisionnement</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={formData.reorderQuantity}
                                                        onChange={(e) => setFormData({ ...formData, reorderQuantity: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="info-box">
                                                💡 Le produit sera en alerte quand le stock sera inférieur ou égal au seuil d'alerte
                                            </div>
                                        </div>
                                    )}

                                    {/* Onglet Image */}
                                    {activeTab === 'image' && (
                                        <div className="form-tab-content active">
                                            <div className="image-upload-area">
                                                {imagePreview || formData.image_url ? (
                                                    <div className="image-preview-container">
                                                        <img
                                                            src={imagePreview || formData.image_url}
                                                            alt="Aperçu"
                                                            className="image-preview-img"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger btn-sm"
                                                            onClick={handleDeleteImage}
                                                        >
                                                            🗑️ Supprimer l'image
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="image-upload-placeholder">
                                                        <label className="image-upload-label">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleImageUpload}
                                                                disabled={uploading}
                                                                style={{ display: 'none' }}
                                                            />
                                                            <div className="upload-icon">📷</div>
                                                            <div className="upload-text">
                                                                {uploading ? 'Upload en cours...' : 'Cliquez ou glissez une image'}
                                                            </div>
                                                            <div className="upload-hint">PNG, JPG, GIF jusqu'à 5MB</div>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Onglet Promotion */}
                                    {activeTab === 'promo' && (
                                        <div className="form-tab-content active">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.hasPromotion}
                                                    onChange={(e) => setFormData({ ...formData, hasPromotion: e.target.checked })}
                                                />
                                                <span>Activer la promotion</span>
                                            </label>

                                            {formData.hasPromotion && (
                                                <>
                                                    <div className="form-group">
                                                        <label className="form-label">Pourcentage de réduction (%)</label>
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            value={formData.promotionPercent}
                                                            onChange={(e) => setFormData({ ...formData, promotionPercent: parseFloat(e.target.value) })}
                                                            min="0"
                                                            max="100"
                                                        />
                                                    </div>
                                                    <div className="info-box">
                                                        🏷️ Prix promotionnel: {(formData.price * (1 - formData.promotionPercent / 100)).toLocaleString()} FCFA
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                                    <button type="submit" className="btn btn-primary">{editingProduct ? 'Modifier' : 'Ajouter'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Gestion Stock */}
                {showStockModal && selectedProduct && (
                    <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Gestion du stock - {selectedProduct.name}</h3>
                                <button className="modal-close" onClick={() => setShowStockModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="stock-info">
                                    <p>Stock actuel: <strong>{selectedProduct.stock} {selectedProduct.unit || 'unités'}</strong></p>
                                    <p>Seuil d'alerte: {selectedProduct.minStockAlert || 10}</p>
                                    <p>Point de réapprovisionnement: {selectedProduct.reorderPoint || 20}</p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Opération</label>
                                    <select className="form-select" value={stockUpdate.operation} onChange={(e) => setStockUpdate({ ...stockUpdate, operation: e.target.value })}>
                                        <option value="add">➕ Ajouter</option>
                                        <option value="remove">➖ Retirer</option>
                                        <option value="set">📝 Définir</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Quantité</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={stockUpdate.quantity}
                                        onChange={(e) => setStockUpdate({ ...stockUpdate, quantity: parseInt(e.target.value) })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Raison</label>
                                    <textarea
                                        className="form-textarea"
                                        rows="2"
                                        value={stockUpdate.reason}
                                        onChange={(e) => setStockUpdate({ ...stockUpdate, reason: e.target.value })}
                                        placeholder="Ex: Réapprovisionnement, Vente, Perte..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-outline" onClick={() => setShowStockModal(false)}>Annuler</button>
                                <button className="btn btn-primary" onClick={handleStockUpdate}>Valider</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Alertes */}
                {showAlertsModal && (
                    <div className="modal-overlay" onClick={() => setShowAlertsModal(false)}>
                        <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Alertes stock faible</h3>
                                <button className="modal-close" onClick={() => setShowAlertsModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                {alerts.length === 0 ? (
                                    <p>Aucune alerte</p>
                                ) : (
                                    <div className="alerts-list">
                                        {alerts.map((alert, index) => (
                                            <div key={index} className={`alert-item ${alert.severity}`}>
                                                <div className="alert-icon">{alert.severity === 'critical' ? '🔴' : '🟡'}</div>
                                                <div className="alert-content">
                                                    <div className="alert-title">{alert.name}</div>
                                                    <div className="alert-message">{alert.message}</div>
                                                    <div className="alert-action">{alert.recommendedAction}</div>
                                                </div>
                                                <button className="btn btn-sm btn-primary" onClick={() => { setSelectedProduct(alert); setShowAlertsModal(false); setShowStockModal(true) }}>
                                                    Gérer
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Réapprovisionnement */}
                {showReorderModal && (
                    <div className="modal-overlay" onClick={() => setShowReorderModal(false)}>
                        <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Recommandations de réapprovisionnement</h3>
                                <button className="modal-close" onClick={() => setShowReorderModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                {reorderRecommendations.length === 0 ? (
                                    <p>Aucune recommandation</p>
                                ) : (
                                    <div className="reorder-list">
                                        {reorderRecommendations.map((rec, index) => (
                                            <div key={index} className="reorder-item">
                                                <div className="reorder-info">
                                                    <div className="reorder-name">{rec.name}</div>
                                                    <div className="reorder-details">
                                                        Stock actuel: {rec.currentStock} unités
                                                    </div>
                                                    <div className="reorder-recommendation">
                                                        Recommandation: Commander {rec.recommendedQuantity} unités
                                                    </div>
                                                </div>
                                                <button className="btn btn-sm btn-primary" onClick={() => { setSelectedProduct(rec); setShowReorderModal(false); setShowStockModal(true) }}>
                                                    Commander
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        
    )
}

export default Products
