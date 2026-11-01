// frontend-web/src/pages/Customers.jsx
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../api'
import toast from 'react-hot-toast'

function Customers() {
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [newCustomer, setNewCustomer] = useState({
        phoneNumber: '',
        firstName: '',
        lastName: '',
        email: '',
        password: 'password123'
    })

    useEffect(() => {
        fetchCustomers()
    }, [])

    const fetchCustomers = async () => {
        try {
            // Utiliser l'API loyalty/customers qui retourne les noms
            const response = await api.get('/loyalty/customers')
            setCustomers(response.data)
        } catch (error) {
            console.error('Error:', error)
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCustomer = async (e) => {
        e.preventDefault()
        try {
            await api.post('/auth/register', {
                phoneNumber: newCustomer.phoneNumber,
                firstName: newCustomer.firstName,
                lastName: newCustomer.lastName,
                email: newCustomer.email,
                password: newCustomer.password
            })
            toast.success('Client créé avec succès')
            setShowModal(false)
            fetchCustomers()
            setNewCustomer({ phoneNumber: '', firstName: '', lastName: '', email: '', password: 'password123' })
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de la création')
        }
    }

    const getVipBadge = (level) => {
        const levels = {
            bronze: { class: 'badge-secondary', label: 'Bronze' },
            silver: { class: 'badge-info', label: 'Silver' },
            gold: { class: 'badge-warning', label: 'Gold' },
            platinum: { class: 'badge-success', label: 'Platinum' }
        }
        const l = levels[level] || levels.bronze
        return <span className={`badge ${l.class}`}>{l.label}</span>
    }

    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>

    return (
        
            <div className="page-container">
                <div className="page-header">
                    <h1 className="page-title">Gestion des Clients</h1>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + Nouveau Client
                    </button>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-title">Total Clients</div>
                        <div className="stat-value">{customers.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-title">Points Fidélité</div>
                        <div className="stat-value">
                            {customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0).toLocaleString()}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-title">Wallet Total</div>
                        <div className="stat-value">
                            {customers.reduce((sum, c) => sum + (c.walletBalance || 0), 0).toLocaleString()} FCFA
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Email</th>
                                <th>Téléphone</th>
                                <th>Points</th>
                                <th>Wallet</th>
                                <th>Niveau VIP</th>
                                <th>Total dépensé</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td>
                                        <div className="customer-info">
                                            <div className="customer-avatar">
                                                {customer.firstName?.charAt(0) || customer.name?.charAt(0) || 'C'}
                                            </div>
                                            <div>
                                                <div className="customer-name">
                                                    {customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Client'}
                                                </div>
                                                {customer.source === 'user' && (
                                                    <span className="badge badge-info">Mobile</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{customer.email || '-'}</td>
                                    <td>{customer.phoneNumber || customer.phone || '-'}</td>
                                    <td><span className="badge badge-info">{customer.loyaltyPoints || 0} pts</span></td>
                                    <td>{customer.walletBalance?.toLocaleString() || 0} FCFA</td>
                                    <td>{getVipBadge(customer.vipLevel)}</td>
                                    <td>{customer.totalSpent?.toLocaleString() || 0} FCFA</td>
                                    <td>
                                        <button className="btn-icon" title="Ajouter des points">⭐</button>
                                        <button className="btn-icon" title="Recharger wallet">💰</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Modal Nouveau Client */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Nouveau Client</h3>
                                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleCreateCustomer}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Prénom *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={newCustomer.firstName}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Nom *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={newCustomer.lastName}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={newCustomer.email}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Téléphone *</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={newCustomer.phoneNumber}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Mot de passe</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={newCustomer.password}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, password: e.target.value })}
                                            defaultValue="password123"
                                        />
                                        <small className="form-hint">Par défaut: password123</small>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                                        Annuler
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Créer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        
    )
}

export default Customers
