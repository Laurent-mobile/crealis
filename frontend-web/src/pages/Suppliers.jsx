//frontend-web/src/pages/Suppliers.jsx
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../api'
import toast from 'react-hot-toast'

function Suppliers() {
    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        contact_name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        category: '',
        tax_id: '',
        payment_terms: '',
        notes: '',
        is_active: true
    })

    useEffect(() => {
        fetchSuppliers()
    }, [])

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/suppliers')
            setSuppliers(response.data)
        } catch (error) {
            console.error('Error fetching suppliers:', error)
            toast.error('Erreur lors du chargement des fournisseurs')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingSupplier) {
                await api.put(`/suppliers/${editingSupplier.id}`, formData)
                toast.success('Fournisseur modifié avec succès')
            } else {
                await api.post('/suppliers', formData)
                toast.success('Fournisseur ajouté avec succès')
            }
            setShowModal(false)
            resetForm()
            fetchSuppliers()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'opération')
        }
    }

    const handleDelete = async (supplier) => {
        if (window.confirm(`Supprimer le fournisseur "${supplier.name}" ?`)) {
            try {
                await api.delete(`/suppliers/${supplier.id}`)
                toast.success('Fournisseur supprimé')
                fetchSuppliers()
            } catch (error) {
                toast.error('Erreur lors de la suppression')
            }
        }
    }

    const resetForm = () => {
        setEditingSupplier(null)
        setFormData({
            name: '',
            contact_name: '',
            phone: '',
            email: '',
            address: '',
            city: '',
            category: '',
            tax_id: '',
            payment_terms: '',
            notes: '',
            is_active: true
        })
    }

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier)
        setFormData(supplier)
        setShowModal(true)
    }

    if (loading) {
        return (
            <Layout>
                <div className="spinner-container"><div className="spinner"></div></div>
            </Layout>
        )
    }

    return (
        
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Gestion des Fournisseurs</h1>
                        <p className="page-subtitle">Gérez vos fournisseurs et partenaires commerciaux</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
                        + Nouveau Fournisseur
                    </button>
                </div>

                <div className="suppliers-grid">
                    {suppliers.map((supplier) => (
                        <div key={supplier.id} className="supplier-card">
                            <div className="supplier-card-header">
                                <div className="supplier-icon">🏭</div>
                                <div className="supplier-info">
                                    <div className="supplier-name">{supplier.name}</div>
                                    <div className="supplier-contact">{supplier.contact_name}</div>
                                </div>
                                <div className="supplier-status">
                                    {supplier.is_active ? (
                                        <span className="badge badge-success">Actif</span>
                                    ) : (
                                        <span className="badge badge-danger">Inactif</span>
                                    )}
                                </div>
                            </div>
                            <div className="supplier-details">
                                <div className="detail-item">
                                    <span className="detail-icon">📞</span>
                                    <span>{supplier.phone || 'Non renseigné'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">✉️</span>
                                    <span>{supplier.email || 'Non renseigné'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">📍</span>
                                    <span>{supplier.city || 'Non renseigné'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">🏷️</span>
                                    <span>{supplier.category || 'Toutes catégories'}</span>
                                </div>
                            </div>
                            <div className="supplier-actions">
                                <button className="btn btn-sm btn-outline" onClick={() => handleEdit(supplier)}>
                                    ✏️ Modifier
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(supplier)}>
                                    🗑️ Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal Fournisseur */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">
                                    {editingSupplier ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}
                                </h3>
                                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Nom du fournisseur *</label>
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
                                            <label className="form-label">Personne de contact</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.contact_name}
                                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Téléphone</label>
                                            <input
                                                type="tel"
                                                className="form-input"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Email</label>
                                            <input
                                                type="email"
                                                className="form-input"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Catégorie</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                placeholder="Ex: Alimentation, Électronique..."
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Ville</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">N° Identification fiscale</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.tax_id}
                                                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Adresse</label>
                                        <textarea
                                            className="form-textarea"
                                            rows="2"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Conditions de paiement</label>
                                            <select
                                                className="form-select"
                                                value={formData.payment_terms}
                                                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                                            >
                                                <option value="">Sélectionner</option>
                                                <option value="Net 15">Net 15 jours</option>
                                                <option value="Net 30">Net 30 jours</option>
                                                <option value="Net 45">Net 45 jours</option>
                                                <option value="Comptant">Comptant</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Statut</label>
                                            <select
                                                className="form-select"
                                                value={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                                            >
                                                <option value="true">Actif</option>
                                                <option value="false">Inactif</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Notes</label>
                                        <textarea
                                            className="form-textarea"
                                            rows="3"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Informations supplémentaires..."
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingSupplier ? 'Modifier' : 'Ajouter'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        
    )
}

export default Suppliers
