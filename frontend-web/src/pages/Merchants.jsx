//frontend-web/src/pages/Merchants.jsx
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../api'
import toast from 'react-hot-toast'

function Merchants() {
  const [merchants, setMerchants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingMerchant, setEditingMerchant] = useState(null)
  const [selectedMerchant, setSelectedMerchant] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPlan, setFilterPlan] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    premium: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    activePOS: 0
  })

  const [formData, setFormData] = useState({
    businessName: '',
    registrationNumber: '',
    phone: '',
    email: '',
    address: '',
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    category: 'supermarket',
    subscriptionPlan: 'basic',
    subscriptionStatus: 'active',
    commissionRate: 2.5,
    latitude: null,  // Changé: null au lieu de ''
    longitude: null, // Changé: null au lieu de ''
    openingHours: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '09:00', close: '13:00', closed: true }
    },
    bankInfo: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      rib: ''
    },
    contactPerson: {
      name: '',
      phone: '',
      email: '',
      position: ''
    }
  })

  useEffect(() => {
    fetchMerchants()
  }, [])

  const fetchMerchants = async () => {
    try {
      const response = await api.get('/merchants')
      setMerchants(response.data)
      calculateStats(response.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erreur lors du chargement des commerçants')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data) => {
    // Actifs = commerçants avec is_verified = true et subscription_status = 'active'
    const active = data.filter(m => m.is_verified === true && m.subscription_status === 'active').length
    // En attente = commerçants non vérifiés
    const pending = data.filter(m => !m.is_verified).length
    // Premium = commerçants avec subscription_plan = 'premium' ou 'enterprise'
    const premium = data.filter(m => m.subscription_plan === 'premium' || m.subscription_plan === 'enterprise').length

    const totalRevenue = data.reduce((sum, m) => sum + (m.totalSales || 0), 0)
    const totalTransactions = data.reduce((sum, m) => sum + (m.transactionCount || 0), 0)
    const activePOS = data.reduce((sum, m) => sum + (m.posDevices?.filter(p => p.status === 'active').length || 0), 0)

    setStats({
      total: data.length,
      active,
      pending,
      premium,
      totalRevenue,
      totalTransactions,
      activePOS
    })
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        name: formData.businessName,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        city: formData.city,
        category: formData.category || 'supermarket',
        subscription_plan: formData.subscriptionPlan,
        subscription_status: formData.subscriptionStatus,
        commission_rate: parseFloat(formData.commissionRate),
        cashback_percent: parseFloat(formData.commissionRate),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        registration_number: formData.registrationNumber || null
      }

      if (editingMerchant) {
        await api.put(`/merchants/${editingMerchant.id}`, submitData)
        toast.success('Commerçant modifié avec succès')
      } else {
        await api.post('/merchants', submitData)
        toast.success('Commerçant ajouté avec succès')
      }
      setShowModal(false)
      resetForm()
      fetchMerchants()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de l\'opération')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce commerçant ?')) {
      try {
        await api.delete(`/merchants/${id}`)
        toast.success('Commerçant supprimé avec succès')
        fetchMerchants()
      } catch (error) {
        toast.error('Erreur lors de la suppression')
      }
    }
  }

  const handleVerify = async (id, verified) => {
    try {
      await api.put(`/merchants/${id}/verify`, { isVerified: verified })
      toast.success(verified ? 'Commerçant vérifié' : 'Vérification annulée')
      await fetchMerchants()  // Attendre le rechargement
    } catch (error) {
      toast.error('Erreur lors de la vérification')
    }
  }

  const resetForm = () => {
    setEditingMerchant(null)
    setActiveTab('info')
    setFormData({
      businessName: '',
      registrationNumber: '',
      phone: '',
      email: '',
      address: '',
      city: 'Ouagadougou',
      country: 'Burkina Faso',
      category: 'supermarket',
      subscriptionPlan: 'basic',
      subscriptionStatus: 'active',
      commissionRate: 2.5,
      latitude: null,
      longitude: null,
      openingHours: {
        monday: { open: '08:00', close: '20:00', closed: false },
        tuesday: { open: '08:00', close: '20:00', closed: false },
        wednesday: { open: '08:00', close: '20:00', closed: false },
        thursday: { open: '08:00', close: '20:00', closed: false },
        friday: { open: '08:00', close: '20:00', closed: false },
        saturday: { open: '09:00', close: '18:00', closed: false },
        sunday: { open: '09:00', close: '13:00', closed: true }
      },
      bankInfo: {
        accountName: '',
        accountNumber: '',
        bankName: '',
        rib: ''
      },
      contactPerson: {
        name: '',
        phone: '',
        email: '',
        position: ''
      }
    })
  }

  const handleEdit = (merchant) => {
    console.log('📝 Modification du merchant:', merchant); // Pour déboguer

    setEditingMerchant(merchant)
    setActiveTab('info')
    setFormData({
      businessName: merchant.name || '',  // ← name au lieu de businessName
      registrationNumber: merchant.registration_number || '',
      phone: merchant.phone || '',
      email: merchant.email || '',
      address: merchant.address || '',
      city: merchant.city || 'Ouagadougou',
      country: merchant.country || 'Burkina Faso',
      category: merchant.category || 'supermarket',
      subscriptionPlan: merchant.subscription_plan || 'basic',
      subscriptionStatus: merchant.subscription_status || 'active',
      commissionRate: merchant.cashback_percent || merchant.commission_rate || 2.5,
      latitude: merchant.latitude || null,
      longitude: merchant.longitude || null,
      openingHours: merchant.openingHours || formData.openingHours,
      bankInfo: merchant.bankInfo || formData.bankInfo,
      contactPerson: merchant.contactPerson || formData.contactPerson
    })
    setShowModal(true)
  }

  const getPlanBadge = (plan) => {
    const plans = {
      basic: { label: 'Basic', class: 'badge-info' },
      premium: { label: 'Premium', class: 'badge-success' },
      enterprise: { label: 'Enterprise', class: 'badge-warning' }
    }
    const p = plans[plan] || plans.basic
    return <span className={`badge ${p.class}`}>{p.label}</span>
  }

  const getStatusBadge = (merchant) => {
    // Vérifié d'abord
    if (!merchant.is_verified) {
      return <span className="badge badge-warning">⏳ En attente</span>
    }
    // Ensuite statut d'abonnement
    if (merchant.subscription_status === 'active') {
      return <span className="badge badge-success">✅ Actif</span>
    }
    if (merchant.subscription_status === 'suspended') {
      return <span className="badge badge-danger">⛔ Suspendu</span>
    }
    if (merchant.subscription_status === 'expired') {
      return <span className="badge badge-danger">⚠️ Expiré</span>
    }
    return <span className="badge badge-info">📝 Enregistré</span>
  }

  if (loading) {
    return (
      
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      
    )
  }

  return (
    
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Gestion des Commerçants</h1>
            <p className="page-subtitle">Suivez et gérez tous les commerçants partenaires du réseau CREALIS</p>
          </div>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
            + Nouveau Commerçant
          </button>
        </div>

        {/* Statistiques */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🏪</div>
            <div className="stat-content">
              <div className="stat-title">Total commerçants</div>
              <div className="stat-value">{stats.total}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-title">Actifs</div>
              <div className="stat-value">{stats.active}</div>
              <div className="stat-change">{stats.pending} en attente</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-title">Premium</div>
              <div className="stat-value">{stats.premium}</div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="filters-bar">
          <div className="filter-group">
            <label className="filter-label">Statut</label>
            <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Tous</option>
              <option value="active">Actifs</option>
              <option value="pending">En attente</option>
              <option value="suspended">Suspendus</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Abonnement</label>
            <select className="form-select" value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}>
              <option value="all">Tous</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="filter-group search-group">
            <input
              type="text"
              className="form-input"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" onClick={() => { setFilterStatus('all'); setFilterPlan('all'); setSearchTerm('') }}>
            Réinitialiser
          </button>
        </div>

        {/* Liste des commerçants */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Enseigne</th>
                <th>Contact</th>
                <th>Ville</th>
                <th>Abonnement</th>
                <th>Commission</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {merchants.filter(m => {
                if (filterStatus !== 'all') {
                  if (filterStatus === 'active' && (!m.isVerified || m.subscriptionStatus !== 'active')) return false
                  if (filterStatus === 'pending' && m.isVerified) return false
                }
                if (filterPlan !== 'all' && m.subscriptionPlan !== filterPlan) return false
                if (searchTerm && !m.businessName.toLowerCase().includes(searchTerm.toLowerCase())) return false
                return true
              }).map((merchant) => (
                <tr key={merchant.id}>
                  <td>
                    <div className="merchant-info">
                      <div>
                        <div className="merchant-name">{merchant.name}</div>
                        <div className="merchant-email">{merchant.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{merchant.phone}</td>
                  <td>{merchant.city}</td>
                  {/* Abonnement - utiliser subscription_plan */}
                  <td>{getPlanBadge(merchant.subscription_plan)}</td>
                  {/* Commission - utiliser commission_rate ou cashback_percent */}
                  <td>{merchant.commission_rate || merchant.cashback_percent || 0}%</td>

                  {/* Statut - utiliser is_verified et subscription_status */}
                  <td>{getStatusBadge(merchant)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" onClick={() => handleEdit(merchant)} title="Modifier">✏️</button>
                      <button className="btn-icon" onClick={() => handleDelete(merchant.id)} title="Supprimer">🗑️</button>
                      {!merchant.isVerified && (
                        <button className="btn-icon" onClick={() => handleVerify(merchant.id, true)} title="Vérifier">✅</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Ajout/Modification */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingMerchant ? 'Modifier le commerçant' : 'Ajouter un commerçant'}
                </h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {/* Onglets */}
                  <div className="form-tabs">
                    <button type="button" className={`form-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
                      📋 Informations
                    </button>
                    <button type="button" className={`form-tab ${activeTab === 'hours' ? 'active' : ''}`} onClick={() => setActiveTab('hours')}>
                      🕐 Horaires
                    </button>
                    <button type="button" className={`form-tab ${activeTab === 'bank' ? 'active' : ''}`} onClick={() => setActiveTab('bank')}>
                      🏦 Banque
                    </button>
                    <button type="button" className={`form-tab ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}>
                      📞 Contact
                    </button>
                  </div>

                  {/* Onglet Informations */}
                  {activeTab === 'info' && (
                    <div className="form-tab-content active">
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Nom de l'enseigne *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={formData.businessName || ''}
                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Téléphone *</label>
                          <input
                            type="tel"
                            className="form-input"
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-input"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Ville</label>
                          <select
                            className="form-select"
                            value={formData.city || 'Ouagadougou'}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          >
                            <option value="Ouagadougou">Ouagadougou</option>
                            <option value="Bobo-Dioulasso">Bobo-Dioulasso</option>
                            <option value="Koudougou">Koudougou</option>
                            <option value="Banfora">Banfora</option>
                          </select>
                        </div>
                        {/* Ajouter après le bloc "Ville" dans l'onglet 'info' */}
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Latitude</label>
                            <input
                              type="number"
                              step="0.000001"
                              className="form-input"
                              value={formData.latitude || ''}
                              onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                              placeholder="12.3714"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Longitude</label>
                            <input
                              type="number"
                              step="0.000001"
                              className="form-input"
                              value={formData.longitude || ''}
                              onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                              placeholder="-1.5197"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ marginBottom: '15px' }}
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                  setFormData({
                                    ...formData,
                                    latitude: pos.coords.latitude,
                                    longitude: pos.coords.longitude,
                                  });
                                  toast.success('Position GPS détectée !');
                                },
                                () => toast.error('Impossible de détecter la position')
                              );
                            }
                          }}
                        >
                          📍 Détecter ma position GPS
                        </button>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Adresse</label>
                        <textarea
                          className="form-textarea"
                          rows="2"
                          value={formData.address || ''}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Plan d'abonnement</label>
                          <select
                            className="form-select"
                            value={formData.subscriptionPlan || 'basic'}
                            onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                          >
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Commission (%)</label>
                          <input
                            type="number"
                            step="0.5"
                            className="form-input"
                            value={formData.commissionRate || 2.5}
                            onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Onglet Horaires */}
                  {activeTab === 'hours' && (
                    <div className="form-tab-content active">
                      <p className="info-box">Configuration des horaires d'ouverture (optionnel)</p>
                      {Object.entries(formData.openingHours).map(([day, hours]) => (
                        <div key={day} className="hours-row">
                          <div className="hours-day">
                            {day === 'monday' && 'Lundi'}
                            {day === 'tuesday' && 'Mardi'}
                            {day === 'wednesday' && 'Mercredi'}
                            {day === 'thursday' && 'Jeudi'}
                            {day === 'friday' && 'Vendredi'}
                            {day === 'saturday' && 'Samedi'}
                            {day === 'sunday' && 'Dimanche'}
                          </div>
                          <div className="hours-inputs">
                            <label className="checkbox-label">
                              <input type="checkbox" checked={hours.closed} onChange={(e) => setFormData({
                                ...formData,
                                openingHours: {
                                  ...formData.openingHours,
                                  [day]: { ...hours, closed: e.target.checked }
                                }
                              })} />
                              Fermé
                            </label>
                            {!hours.closed && (
                              <>
                                <input type="time" className="form-input" value={hours.open} onChange={(e) => setFormData({
                                  ...formData,
                                  openingHours: {
                                    ...formData.openingHours,
                                    [day]: { ...hours, open: e.target.value }
                                  }
                                })} />
                                <span>à</span>
                                <input type="time" className="form-input" value={hours.close} onChange={(e) => setFormData({
                                  ...formData,
                                  openingHours: {
                                    ...formData.openingHours,
                                    [day]: { ...hours, close: e.target.value }
                                  }
                                })} />
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Onglet Banque */}
                  {activeTab === 'bank' && (
                    <div className="form-tab-content active">
                      <p className="info-box">Informations bancaires pour les virements (optionnel)</p>
                      <div className="form-group">
                        <label className="form-label">Nom du compte</label>
                        <input type="text" className="form-input" value={formData.bankInfo.accountName} onChange={(e) => setFormData({
                          ...formData,
                          bankInfo: { ...formData.bankInfo, accountName: e.target.value }
                        })} />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Numéro de compte</label>
                          <input type="text" className="form-input" value={formData.bankInfo.accountNumber} onChange={(e) => setFormData({
                            ...formData,
                            bankInfo: { ...formData.bankInfo, accountNumber: e.target.value }
                          })} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Banque</label>
                          <select className="form-select" value={formData.bankInfo.bankName} onChange={(e) => setFormData({
                            ...formData,
                            bankInfo: { ...formData.bankInfo, bankName: e.target.value }
                          })}>
                            <option value="">Sélectionner</option>
                            <option value="Coris Bank">Coris Bank</option>
                            <option value="Ecobank">Ecobank</option>
                            <option value="BOA">BOA</option>
                            <option value="BCB">BCB</option>
                            <option value="SIB">SIB</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">RIB</label>
                        <input type="text" className="form-input" value={formData.bankInfo.rib} onChange={(e) => setFormData({
                          ...formData,
                          bankInfo: { ...formData.bankInfo, rib: e.target.value }
                        })} />
                      </div>
                    </div>
                  )}

                  {/* Onglet Contact */}
                  {activeTab === 'contact' && (
                    <div className="form-tab-content active">
                      <p className="info-box">Personne de contact pour la gestion du compte (optionnel)</p>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Nom complet</label>
                          <input type="text" className="form-input" value={formData.contactPerson.name} onChange={(e) => setFormData({
                            ...formData,
                            contactPerson: { ...formData.contactPerson, name: e.target.value }
                          })} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Poste</label>
                          <input type="text" className="form-input" value={formData.contactPerson.position} onChange={(e) => setFormData({
                            ...formData,
                            contactPerson: { ...formData.contactPerson, position: e.target.value }
                          })} />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Téléphone</label>
                          <input type="tel" className="form-input" value={formData.contactPerson.phone} onChange={(e) => setFormData({
                            ...formData,
                            contactPerson: { ...formData.contactPerson, phone: e.target.value }
                          })} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Email</label>
                          <input type="email" className="form-input" value={formData.contactPerson.email} onChange={(e) => setFormData({
                            ...formData,
                            contactPerson: { ...formData.contactPerson, email: e.target.value }
                          })} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary">{editingMerchant ? 'Modifier' : 'Ajouter'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    
  )
}

export default Merchants
