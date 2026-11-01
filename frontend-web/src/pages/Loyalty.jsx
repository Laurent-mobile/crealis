// frontend-web/src/pages/Loyalty.jsx
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../api'
import toast from 'react-hot-toast'

function Loyalty() {
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [pointsToAdd, setPointsToAdd] = useState(0)
  const [rechargeAmount, setRechargeAmount] = useState(0)
  const [showPointsModal, setShowPointsModal] = useState(false)
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [showCardActions, setShowCardActions] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [searchCardNumber, setSearchCardNumber] = useState('')
  const [cardSearchResult, setCardSearchResult] = useState(null)
  const [activeTab, setActiveTab] = useState('customers')
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalPoints: 0,
    totalSpent: 0,
    totalWallet: 0,
    activeCards: 0,
    inactiveCards: 0,
    vipLevels: { bronze: 0, silver: 0, gold: 0, platinum: 0 }
  })
  const [loading, setLoading] = useState(true)

  // SEUL CE useEffect EST NÉCESSAIRE
  useEffect(() => {
    fetchCustomers()
    fetchStats()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/loyalty/customers')
      setCustomers(response.data)
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/loyalty/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }
  const searchCardByNumber = async () => {
    if (!searchCardNumber) {
      toast.error('Entrez un numéro de carte')
      return
    }
    try {
      const response = await api.get(`/loyalty/nfc-card/${searchCardNumber}`)
      setCardSearchResult(response.data.customer)
      toast.success('Carte trouvée !')
      setActiveTab('card-search')
    } catch (error) {
      toast.error('Carte non trouvée')
      setCardSearchResult(null)
    }
  }

  const toggleCardStatus = async (cardNumber, isActive, reason) => {
    try {
      await api.put(`/loyalty/card/${cardNumber}/status`, { isActive, reason })
      toast.success(isActive ? 'Carte activée' : 'Carte désactivée')
      setCardSearchResult(null)
      setSearchCardNumber('')
      fetchCustomers()
      fetchStats()
    } catch (error) {
      toast.error('Erreur lors de l\'opération')
    }
  }

  const regenerateCard = async (customerId) => {
    try {
      const response = await api.post(`/loyalty/card/${customerId}/regenerate`)
      toast.success(`Nouvelle carte: ${response.data.newCardNumber}`)
      setCardSearchResult(null)
      setSearchCardNumber('')
      fetchCustomers()
      fetchStats()
    } catch (error) {
      toast.error('Erreur lors de la régénération')
    }
  }

  const handleAddPoints = async () => {
    if (!selectedCustomer || pointsToAdd <= 0) {
      toast.error('Veuillez entrer un nombre valide de points')
      return
    }
    try {
      await api.post('/loyalty/add-points', {
        customerId: selectedCustomer.id,
        points: pointsToAdd,
        reason: 'Bonus fidélité'
      })
      toast.success(`${pointsToAdd} points ajoutés avec succès`)
      setShowPointsModal(false)
      setPointsToAdd(0)
      fetchCustomers()
      fetchStats()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout des points')
    }
  }

  const handleRechargeWallet = async () => {
    if (!selectedCustomer || rechargeAmount <= 0) {
      toast.error('Veuillez entrer un montant valide')
      return
    }
    try {
      await api.post('/loyalty/recharge-wallet', {
        customerId: selectedCustomer.id,
        amount: rechargeAmount,
        method: 'mobile_money'
      })
      toast.success(`${rechargeAmount} FCFA ajoutés au wallet`)
      setShowRechargeModal(false)
      setRechargeAmount(0)
      fetchCustomers()
      fetchStats()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la recharge')
    }
  }

  const handleGenerateCard = async () => {
    if (!selectedCustomer) return
    try {
      const response = await api.post('/loyalty/generate-nfc-card', {
        customerId: selectedCustomer.id
      })
      toast.success(`Carte NFC générée: ${response.data.nfcCardNumber}`)
      setShowCardModal(false)
      fetchCustomers()
      fetchStats()
    } catch (error) {
      toast.error('Erreur lors de la génération de la carte')
    }
  }

  const handleCreateCustomer = async () => {
    const phone = prompt('Entrez le numéro de téléphone du client:')
    if (!phone) return

    try {
      await api.post('/loyalty/customers', { phoneNumber: phone })
      toast.success('Client créé avec succès')
      fetchCustomers()
      fetchStats()
    } catch (error) {
      toast.error('Erreur lors de la création')
    }
  }

  const getVipBadge = (level) => {
    const levels = {
      bronze: { icon: '🥉', color: '#cd7f32', label: 'Bronze', bg: '#fdf4e6' },
      silver: { icon: '🥈', color: '#c0c0c0', label: 'Silver', bg: '#f5f5f5' },
      gold: { icon: '🥇', color: '#ffd700', label: 'Gold', bg: '#fefce8' },
      platinum: { icon: '💎', color: '#e5e4e2', label: 'Platinum', bg: '#f3e8ff' }
    }
    const l = levels[level] || levels.bronze
    return (
      <span className="vip-badge" style={{ background: l.bg, color: l.color }}>
        {l.icon} {l.label}
      </span>
    )
  }

  const filteredCustomers = customers.filter(c =>
    c.phoneNumber?.includes(searchTerm) ||
    c.nfcCardNumber?.includes(searchTerm)
  )

  if (loading) {
    return (
      <Layout>
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="loyalty-container">
        {/* En-tête */}
        <div className="page-header">
          <div className="page-header-content">
            <div className="page-badge">
              <span className="page-badge-icon">🎯</span>
              <span className="page-badge-text">Fidélité & Récompenses</span>
            </div>
            <h1 className="page-title">Système de Fidélité</h1>
            <p className="page-subtitle">Gérez les points, cartes NFC et récompenses de vos clients</p>
          </div>
          <button className="btn btn-primary" onClick={handleCreateCustomer}>
            + Nouveau Client
          </button>
        </div>

        {/* Onglets */}
        <div className="loyalty-tabs">
          <button
            className={`loyalty-tab ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <span className="tab-icon">👥</span>
            <span>Clients</span>
          </button>
          <button
            className={`loyalty-tab ${activeTab === 'card-search' ? 'active' : ''}`}
            onClick={() => setActiveTab('card-search')}
          >
            <span className="tab-icon">💳</span>
            <span>Rechercher carte</span>
          </button>
          <button
            className={`loyalty-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <span className="tab-icon">📊</span>
            <span>Statistiques</span>
          </button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'customers' && (
          <>
            {/* Statistiques rapides */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper">👥</div>
                <div className="stat-content">
                  <div className="stat-title">Total Clients</div>
                  <div className="stat-value">{stats.totalCustomers}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper">⭐</div>
                <div className="stat-content">
                  <div className="stat-title">Points distribués</div>
                  <div className="stat-value">{stats.totalPoints?.toLocaleString() || 0}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper">💳</div>
                <div className="stat-content">
                  <div className="stat-title">Cartes actives</div>
                  <div className="stat-value">{stats.activeCards || 0}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper">💰</div>
                <div className="stat-content">
                  <div className="stat-title">Wallet total</div>
                  <div className="stat-value">{stats.totalWallet?.toLocaleString() || 0} FCFA</div>
                </div>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="search-bar">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                className="search-input"
                placeholder="Rechercher par téléphone ou numéro de carte NFC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Liste des clients */}
            <div className="customers-grid">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="customer-card">
                  <div className="customer-card-header">
                    <div className="customer-avatar">
                      {customer.firstName?.charAt(0) || customer.name?.charAt(0) || 'C'}
                    </div>
                    <div className="customer-card-info">
                      <div className="customer-name">
                        {customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Client'}
                      </div>
                      <div className="customer-phone">{customer.phoneNumber}</div>
                      {customer.email && <div className="customer-email">{customer.email}</div>}
                      {customer.nfcCardNumber && (
                        <div className="customer-card-number">Carte: {customer.nfcCardNumber.slice(-12)}</div>
                      )}
                    </div>
                    {getVipBadge(customer.vipLevel)}
                  </div>

                  <div className="customer-card-stats">
                    <div className="stat">
                      <div className="stat-label">Points</div>
                      <div className="stat-value">{customer.loyaltyPoints || 0}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Total dépensé</div>
                      <div className="stat-value">{customer.totalSpent?.toLocaleString() || 0} FCFA</div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Wallet</div>
                      <div className="stat-value">{customer.walletBalance?.toLocaleString() || 0} FCFA</div>
                    </div>
                  </div>

                  <div className="customer-card-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => { setSelectedCustomer(customer); setShowPointsModal(true) }}
                    >
                      + Points
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => { setSelectedCustomer(customer); setShowRechargeModal(true) }}
                    >
                      💰 Recharger
                    </button>
                    {!customer.nfcCardNumber ? (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => { setSelectedCustomer(customer); setShowCardModal(true) }}
                      >
                        🆕 Carte NFC
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => { setSelectedCard(customer); setShowCardActions(true) }}
                      >
                        💳 Gérer la carte
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Onglet Recherche de carte */}
        {activeTab === 'card-search' && (
          <div className="card-search-section">
            <div className="card-search-card">
              <div className="card-search-header">
                <div className="card-search-icon">💳</div>
                <h3>Rechercher une carte NFC</h3>
                <p>Entrez le numéro de la carte pour voir les détails du client</p>
              </div>
              <div className="card-search-input-group">
                <input
                  type="text"
                  className="card-search-input"
                  placeholder="Ex: CREALIS_1748612345678_ABC123XYZ"
                  value={searchCardNumber}
                  onChange={(e) => setSearchCardNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchCardByNumber()}
                />
                <button className="btn btn-primary" onClick={searchCardByNumber}>
                  🔍 Rechercher
                </button>
              </div>

              {/* Résultat de recherche */}
              {cardSearchResult && (
                <div className="card-result">
                  <div className="card-result-header">
                    <div className="card-result-icon">✅</div>
                    <div className="card-result-info">
                      <div className="card-result-title">Carte trouvée</div>
                      <div className="card-result-number">{cardSearchResult.nfcCardNumber}</div>
                    </div>
                    <div className={`card-status ${cardSearchResult.isActive ? 'active' : 'inactive'}`}>
                      {cardSearchResult.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div className="card-result-details">
                    <div className="detail-row">
                      <span className="detail-label">Client</span>
                      <span className="detail-value">{cardSearchResult.firstName || 'Client'} {cardSearchResult.lastName || ''}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Téléphone</span>
                      <span className="detail-value">{cardSearchResult.phoneNumber}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Points</span>
                      <span className="detail-value highlight">{cardSearchResult.loyaltyPoints} pts</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Wallet</span>
                      <span className="detail-value">{cardSearchResult.walletBalance?.toLocaleString()} FCFA</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Niveau VIP</span>
                      <span className="detail-value">{getVipBadge(cardSearchResult.vipLevel)}</span>
                    </div>
                  </div>

                  <div className="card-result-actions">
                    {cardSearchResult.isActive ? (
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          const reason = prompt('Motif de désactivation:')
                          if (reason) toggleCardStatus(cardSearchResult.nfcCardNumber, false, reason)
                        }}
                      >
                        🔒 Désactiver la carte
                      </button>
                    ) : (
                      <button
                        className="btn btn-success"
                        onClick={() => toggleCardStatus(cardSearchResult.nfcCardNumber, true, 'Réactivation')}
                      >
                        🔓 Activer la carte
                      </button>
                    )}
                    <button
                      className="btn btn-warning"
                      onClick={() => {
                        if (window.confirm('Générer une nouvelle carte ? L\'ancienne sera désactivée.')) {
                          regenerateCard(cardSearchResult.id)
                        }
                      }}
                    >
                      🔄 Régénérer
                    </button>
                  </div>
                </div>
              )}

              {searchCardNumber && !cardSearchResult && (
                <div className="card-not-found">
                  <div className="not-found-icon">🔍</div>
                  <div className="not-found-text">Aucune carte trouvée</div>
                  <div className="not-found-hint">Vérifiez le numéro et réessayez</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Onglet Statistiques */}
        {activeTab === 'stats' && (
          <div className="loyalty-stats-section">
            <div className="stats-overview">
              <div className="stat-card-large">
                <div className="stat-icon-large">👥</div>
                <div className="stat-info">
                  <div className="stat-title">Base clients</div>
                  <div className="stat-value">{stats.totalCustomers}</div>
                  <div className="stat-trend">+12% ce mois</div>
                </div>
              </div>
              <div className="stat-card-large">
                <div className="stat-icon-large">⭐</div>
                <div className="stat-info">
                  <div className="stat-title">Points distribués</div>
                  <div className="stat-value">{stats.totalPoints?.toLocaleString() || 0}</div>
                  <div className="stat-trend">+8% ce mois</div>
                </div>
              </div>
              <div className="stat-card-large">
                <div className="stat-icon-large">💰</div>
                <div className="stat-info">
                  <div className="stat-title">Wallet total</div>
                  <div className="stat-value">{stats.totalWallet?.toLocaleString() || 0} FCFA</div>
                  <div className="stat-trend">+15% ce mois</div>
                </div>
              </div>
              <div className="stat-card-large">
                <div className="stat-icon-large">💳</div>
                <div className="stat-info">
                  <div className="stat-title">Taux d'activation</div>
                  <div className="stat-value">{Math.round((stats.activeCards / (stats.totalCustomers || 1)) * 100)}%</div>
                  <div className="stat-trend">{stats.activeCards} cartes actives</div>
                </div>
              </div>
            </div>

            {/* Distribution VIP */}
            <div className="vip-distribution">
              <h3 className="section-title">Distribution des niveaux VIP</h3>
              <div className="vip-bars">
                <div className="vip-bar-item">
                  <div className="vip-bar-label">🥉 Bronze</div>
                  <div className="vip-bar-container">
                    <div className="vip-bar-fill bronze" style={{ width: `${(stats.vipLevels?.bronze / stats.totalCustomers) * 100 || 0}%` }}>
                      {stats.vipLevels?.bronze || 0}
                    </div>
                  </div>
                </div>
                <div className="vip-bar-item">
                  <div className="vip-bar-label">🥈 Silver</div>
                  <div className="vip-bar-container">
                    <div className="vip-bar-fill silver" style={{ width: `${(stats.vipLevels?.silver / stats.totalCustomers) * 100 || 0}%` }}>
                      {stats.vipLevels?.silver || 0}
                    </div>
                  </div>
                </div>
                <div className="vip-bar-item">
                  <div className="vip-bar-label">🥇 Gold</div>
                  <div className="vip-bar-container">
                    <div className="vip-bar-fill gold" style={{ width: `${(stats.vipLevels?.gold / stats.totalCustomers) * 100 || 0}%` }}>
                      {stats.vipLevels?.gold || 0}
                    </div>
                  </div>
                </div>
                <div className="vip-bar-item">
                  <div className="vip-bar-label">💎 Platinum</div>
                  <div className="vip-bar-container">
                    <div className="vip-bar-fill platinum" style={{ width: `${(stats.vipLevels?.platinum / stats.totalCustomers) * 100 || 0}%` }}>
                      {stats.vipLevels?.platinum || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Avantages VIP */}
            <div className="vip-benefits">
              <h3 className="section-title">Avantages par niveau</h3>
              <div className="benefits-grid">
                <div className="benefit-card bronze">
                  <div className="benefit-icon">🥉</div>
                  <div className="benefit-name">Bronze</div>
                  <div className="benefit-desc">1% cashback</div>
                </div>
                <div className="benefit-card silver">
                  <div className="benefit-icon">🥈</div>
                  <div className="benefit-name">Silver</div>
                  <div className="benefit-desc">1.5% cashback + 2% réduction</div>
                </div>
                <div className="benefit-card gold">
                  <div className="benefit-icon">🥇</div>
                  <div className="benefit-name">Gold</div>
                  <div className="benefit-desc">2% cashback + 5% réduction</div>
                </div>
                <div className="benefit-card platinum">
                  <div className="benefit-icon">💎</div>
                  <div className="benefit-name">Platinum</div>
                  <div className="benefit-desc">3% cashback + 10% réduction</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals... (conservés identiques) */}
        {showPointsModal && selectedCustomer && (
          <div className="modal-overlay" onClick={() => setShowPointsModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Ajouter des points</h3>
                <button className="modal-close" onClick={() => setShowPointsModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>Client: <strong>{selectedCustomer.phoneNumber}</strong></p>
                <p>Points actuels: <strong>{selectedCustomer.loyaltyPoints} pts</strong></p>
                <div className="form-group">
                  <label className="form-label">Nombre de points à ajouter</label>
                  <input
                    type="number"
                    className="form-input"
                    value={pointsToAdd}
                    onChange={(e) => setPointsToAdd(parseInt(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="info-box">
                  💡 100 points = 100 FCFA de cashback
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowPointsModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleAddPoints}>Ajouter</button>
              </div>
            </div>
          </div>
        )}

        {showRechargeModal && selectedCustomer && (
          <div className="modal-overlay" onClick={() => setShowRechargeModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Recharger le wallet</h3>
                <button className="modal-close" onClick={() => setShowRechargeModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>Client: <strong>{selectedCustomer.phoneNumber}</strong></p>
                <p>Solde actuel: <strong>{selectedCustomer.walletBalance?.toLocaleString() || 0} FCFA</strong></p>
                <div className="form-group">
                  <label className="form-label">Montant à recharger (FCFA)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(parseInt(e.target.value))}
                    min="100"
                  />
                </div>
                <div className="info-box">
                  💳 Paiement par Mobile Money (Orange Money, Wave)
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowRechargeModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleRechargeWallet}>Recharger</button>
              </div>
            </div>
          </div>
        )}

        {showCardModal && selectedCustomer && (
          <div className="modal-overlay" onClick={() => setShowCardModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Générer une carte NFC</h3>
                <button className="modal-close" onClick={() => setShowCardModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>Client: <strong>{selectedCustomer.phoneNumber}</strong></p>
                <p>Une carte NFC unique va être générée pour ce client.</p>
                <div className="info-box">
                  💳 La carte pourra être utilisée dans tous les commerçants partenaires CREALIS.
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowCardModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleGenerateCard}>Générer</button>
              </div>
            </div>
          </div>
        )}

        {showCardActions && selectedCard && (
          <div className="modal-overlay" onClick={() => setShowCardActions(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Gestion de la carte NFC</h3>
                <button className="modal-close" onClick={() => setShowCardActions(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="card-info">
                  <p><strong>Client:</strong> {selectedCard.phoneNumber}</p>
                  <p><strong>Carte actuelle:</strong> {selectedCard.nfcCardNumber || 'Non générée'}</p>
                  <p><strong>Statut:</strong> {selectedCard.isActive ? '✅ Active' : '❌ Inactive'}</p>
                </div>

                <div className="card-actions-list">
                  {!selectedCard.nfcCardNumber && (
                    <button
                      className="btn btn-primary btn-block"
                      onClick={async () => {
                        try {
                          const response = await api.post('/loyalty/generate-nfc-card', { customerId: selectedCard.id })
                          toast.success(`Carte générée: ${response.data.nfcCardNumber}`)
                          setShowCardActions(false)
                          fetchCustomers()
                          fetchStats()
                        } catch (error) {
                          toast.error('Erreur lors de la génération')
                        }
                      }}
                    >
                      🆕 Générer une carte
                    </button>
                  )}

                  {selectedCard.nfcCardNumber && selectedCard.isActive && (
                    <button
                      className="btn btn-danger btn-block"
                      onClick={async () => {
                        const reason = prompt('Motif de désactivation:')
                        if (reason) {
                          await api.put(`/loyalty/card/${selectedCard.nfcCardNumber}/status`, { isActive: false, reason })
                          toast.success('Carte désactivée')
                          setShowCardActions(false)
                          fetchCustomers()
                          fetchStats()
                        }
                      }}
                    >
                      🔒 Désactiver la carte
                    </button>
                  )}

                  {selectedCard.nfcCardNumber && !selectedCard.isActive && (
                    <button
                      className="btn btn-success btn-block"
                      onClick={async () => {
                        await api.put(`/loyalty/card/${selectedCard.nfcCardNumber}/status`, { isActive: true, reason: 'Réactivation' })
                        toast.success('Carte activée')
                        setShowCardActions(false)
                        fetchCustomers()
                        fetchStats()
                      }}
                    >
                      🔓 Activer la carte
                    </button>
                  )}

                  {selectedCard.nfcCardNumber && (
                    <button
                      className="btn btn-warning btn-block"
                      onClick={async () => {
                        if (window.confirm('Générer une nouvelle carte ? L\'ancienne sera remplacée.')) {
                          const response = await api.post(`/loyalty/card/${selectedCard.id}/regenerate`)
                          toast.success(`Nouvelle carte: ${response.data.newCardNumber}`)
                          setShowCardActions(false)
                          fetchCustomers()
                          fetchStats()
                        }
                      }}
                    >
                      🔄 Régénérer une carte
                    </button>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowCardActions(false)}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Loyalty
