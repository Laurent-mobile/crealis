// frontend-web/src/pages/Transactions.jsx
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../api'
import toast from 'react-hot-toast'

function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    averageAmount: 0,
    totalPoints: 0,
    byType: { purchase: 0, recharge: 0, cashback: 0, withdrawal: 0, refund: 0 }
  })

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const response = await api.get('/transactions')
      const data = response.data
      const transactionsList = Array.isArray(data) ? data : (data.transactions || [])
      setTransactions(transactionsList)

      const totalAmount = transactionsList.reduce((sum, t) => sum + (t.amount || 0), 0)
      const totalPoints = transactionsList.reduce((sum, t) => sum + (t.points_earned || 0), 0)

      const byType = {
        purchase: transactionsList.filter(t => t.type === 'purchase').length,
        recharge: transactionsList.filter(t => t.type === 'recharge').length,
        cashback: transactionsList.filter(t => t.type === 'cashback').length,
        withdrawal: transactionsList.filter(t => t.type === 'withdrawal').length,
        refund: transactionsList.filter(t => t.type === 'refund').length
      }

      setStats({
        total: transactionsList.length,
        totalAmount,
        averageAmount: transactionsList.length > 0 ? totalAmount / transactionsList.length : 0,
        totalPoints,
        byType
      })
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Erreur lors du chargement des transactions')
    } finally {
      setLoading(false)
    }
  }

  const getTypeBadge = (type) => {
    const types = {
      purchase: { label: 'Achat', class: 'badge-success', icon: '🛒' },
      recharge: { label: 'Recharge', class: 'badge-info', icon: '💳' },
      cashback: { label: 'Cashback', class: 'badge-warning', icon: '💰' },
      withdrawal: { label: 'Retrait', class: 'badge-danger', icon: '🏧' },
      refund: { label: 'Remboursement', class: 'badge-warning', icon: '↩️' }
    }
    const t = types[type] || types.purchase
    return <span className={`badge ${t.class}`}>{t.icon} {t.label}</span>
  }

  const getStatusBadge = (status) => {
    const statuses = {
      pending: { label: 'En attente', class: 'badge-warning' },
      completed: { label: 'Complété', class: 'badge-success' },
      failed: { label: 'Échoué', class: 'badge-danger' },
      refunded: { label: 'Remboursé', class: 'badge-info' }
    }
    const s = statuses[status] || statuses.pending
    return <span className={`badge ${s.class}`}>{s.label}</span>
  }

  const getPaymentMethodIcon = (method) => {
    const methods = {
      nfc_card: '💳 NFC',
      qr_code: '📱 QR Code',
      mobile_money: '📱 Mobile Money',
      cash: '💵 Espèces',
      wallet: '💳 Wallet',
      orange: '📱 Orange Money',
      wave: '🌊 Wave',
      moov: '📱 Moov Money',
      telecel: '📱 Telecel Money'
    }
    return methods[method] || method || '💳'
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const resetFilters = () => {
    setFilter('all')
    setStatusFilter('all')
    setDateRange({ start: '', end: '' })
    setSearchTerm('')
    fetchTransactions()
  }

  // Filtrer les transactions
  let filteredTransactions = [...transactions]
  if (filter !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.type === filter)
  }
  if (statusFilter !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.status === statusFilter)
  }
  if (dateRange.start) {
    filteredTransactions = filteredTransactions.filter(t => new Date(t.created_at) >= new Date(dateRange.start))
  }
  if (dateRange.end) {
    filteredTransactions = filteredTransactions.filter(t => new Date(t.created_at) <= new Date(dateRange.end))
  }
  if (searchTerm) {
    filteredTransactions = filteredTransactions.filter(t =>
      t.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customer_firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customer_lastname?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  if (loading && transactions.length === 0) {
    return (
      <>
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      </>
    )
  }

    return (
    <>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Transactions</h1>
            <p className="page-subtitle">Historique complet des transactions</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline" onClick={() => fetchTransactions()}>
              🔄 Actualiser
            </button>
          </div>
        </div>

        {/* Cartes statistiques */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-title">Volume total</div>
              <div className="stat-value">{stats.totalAmount?.toLocaleString() || 0} FCFA</div>
              <div className="stat-change">{stats.total} transactions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-title">Points distribués</div>
              <div className="stat-value">{stats.totalPoints?.toLocaleString() || 0}</div>
              <div className="stat-change">Moyenne: {Math.round(stats.averageAmount).toLocaleString()} FCFA</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🛒</div>
            <div className="stat-content">
              <div className="stat-title">Achats</div>
              <div className="stat-value">{stats.byType?.purchase || 0}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💳</div>
            <div className="stat-content">
              <div className="stat-title">Recharges</div>
              <div className="stat-value">{stats.byType?.recharge || 0}</div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="filters-bar">
          <div className="filter-group">
            <label className="filter-label">Type</label>
            <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Tous</option>
              <option value="purchase">Achats</option>
              <option value="recharge">Recharges</option>
              <option value="cashback">Cashbacks</option>
              <option value="refund">Remboursements</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Statut</label>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tous</option>
              <option value="completed">Complétés</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoués</option>
              <option value="refunded">Remboursés</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Date début</label>
            <input type="date" className="form-input" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
          </div>
          <div className="filter-group">
            <label className="filter-label">Date fin</label>
            <input type="date" className="form-input" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
          </div>
          <div className="filter-group search-group">
            <input
              type="text"
              className="form-input"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchTransactions()}
            />
          </div>
          <button className="btn btn-secondary" onClick={resetFilters}>
            Réinitialiser
          </button>
        </div>

        {/* Tableau des transactions */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Client</th>
                <th>Commerçant</th>
                <th>Montant</th>
                <th>Type</th>
                <th>Paiement</th>
                <th>Points</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center">Aucune transaction trouvée</td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="tx-id">{tx.transaction_id?.slice(0, 12) || tx.id?.slice(0, 8)}</td>
                    <td>{formatDate(tx.created_at)}</td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-name">
                          {tx.customer_firstname} {tx.customer_lastname}
                        </div>
                        <div className="customer-phone">{tx.customer_phone}</div>
                      </div>
                    </td>
                    <td>{tx.merchant_name || '-'}</td>
                    <td className="tx-amount">{parseFloat(tx.amount).toLocaleString()} FCFA</td>
                    <td>{getTypeBadge(tx.type)}</td>
                    <td>{getPaymentMethodIcon(tx.method)}</td>
                    <td>{tx.points_earned || 0} pts</td>
                    <td>{getStatusBadge(tx.status)}</td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => {
                          setSelectedTransaction(tx)
                          setShowDetailsModal(true)
                        }}
                        title="Voir détails"
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Détails */}
        {showDetailsModal && selectedTransaction && (
          <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">📄 Détails de la transaction</h3>
                <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="details-section">
                  <h4>Informations générales</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>ID Transaction</label>
                      <span className="tx-id">{selectedTransaction.transaction_id || selectedTransaction.id}</span>
                    </div>
                    <div className="detail-item">
                      <label>Date</label>
                      <span>{formatDate(selectedTransaction.created_at)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Référence</label>
                      <span>{selectedTransaction.reference || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Statut</label>
                      <span>{getStatusBadge(selectedTransaction.status)}</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h4>Montants</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Montant</label>
                      <span className="tx-amount">{parseFloat(selectedTransaction.amount).toLocaleString()} FCFA</span>
                    </div>
                    <div className="detail-item">
                      <label>Points gagnés</label>
                      <span>{selectedTransaction.points_earned || 0} pts</span>
                    </div>
                    <div className="detail-item">
                      <label>Méthode de paiement</label>
                      <span>{getPaymentMethodIcon(selectedTransaction.method)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Type</label>
                      <span>{getTypeBadge(selectedTransaction.type)}</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h4>Client</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Nom complet</label>
                      <span>{selectedTransaction.customer_firstname} {selectedTransaction.customer_lastname}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email</label>
                      <span>{selectedTransaction.customer_email || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Téléphone</label>
                      <span>{selectedTransaction.customer_phone || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Niveau VIP</label>
                      <span>{selectedTransaction.customer_vip || 'Bronze'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Points fidélité</label>
                      <span>{selectedTransaction.customer_points || 0} pts</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h4>Commerçant</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Nom</label>
                      <span>{selectedTransaction.merchant_name || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Téléphone</label>
                      <span>{selectedTransaction.merchant_phone || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Ville</label>
                      <span>{selectedTransaction.merchant_city || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Cashback</label>
                      <span>{selectedTransaction.merchant_cashback || 0}%</span>
                    </div>
                  </div>
                </div>

                {selectedTransaction.description && (
                  <div className="details-section">
                    <h4>Description</h4>
                    <div className="description-box">
                      {selectedTransaction.description}
                    </div>
                  </div>
                )}

                {selectedTransaction.product_id && (
                  <div className="details-section">
                    <h4>🛍️ Produit</h4>
                    <div className="product-detail-card">
                      {selectedTransaction.product_image && (
                        <div className="product-image-container">
                          <img
                            src={selectedTransaction.product_image}
                            alt={selectedTransaction.product_name}
                            className="product-detail-image"
                          />
                        </div>
                      )}
                      <div className="product-info-container">
                        <div className="detail-item">
                          <label>Nom du produit</label>
                          <span className="product-name">{selectedTransaction.product_name || 'Produit'}</span>
                        </div>
                        <div className="detail-item">
                          <label>Prix unitaire</label>
                          <span className="product-price">{parseFloat(selectedTransaction.product_price || selectedTransaction.amount).toLocaleString()} FCFA</span>
                        </div>
                        {selectedTransaction.product_category && (
                          <div className="detail-item">
                            <label>Catégorie</label>
                            <span>{selectedTransaction.product_category}</span>
                          </div>
                        )}
                        <div className="detail-item">
                          <label>Quantité</label>
                          <span>{Math.round(selectedTransaction.amount / (selectedTransaction.product_price || 1))} unité(s)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setShowDetailsModal(false)}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .details-section {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--gray-200);
        }
        .details-section:last-child {
          border-bottom: none;
        }
        .details-section h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-700);
          margin-bottom: 12px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .detail-item label {
          font-size: 11px;
          font-weight: 500;
          color: var(--gray-500);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .detail-item span {
          font-size: 14px;
          color: var(--gray-800);
        }
        .detail-item .tx-id {
          font-family: monospace;
          background: var(--gray-100);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
        }
        .description-box {
          background: var(--gray-50);
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          color: var(--gray-700);
          line-height: 1.5;
        }
        .tx-amount {
          font-weight: 600;
          color: var(--primary);
        }
        .customer-info .customer-name {
          font-weight: 500;
        }
        .customer-info .customer-phone {
          font-size: 11px;
          color: var(--gray-500);
        }
        .modal-lg {
          max-width: 700px;
        }
        .product-detail-card {
          display: flex;
          gap: 20px;
          background: var(--gray-50);
          border-radius: 12px;
          padding: 16px;
          margin-top: 8px;
        }
        .product-image-container {
          flex-shrink: 0;
          width: 100px;
          height: 100px;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--gray-200);
        }
        .product-detail-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .product-info-container {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .product-name {
          font-weight: 600;
          color: var(--gray-800);
          font-size: 15px;
        }
        .product-price {
          font-weight: 700;
          color: var(--primary);
          font-size: 16px;
        }
        @media (max-width: 600px) {
          .product-detail-card {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .product-info-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}

export default Transactions
