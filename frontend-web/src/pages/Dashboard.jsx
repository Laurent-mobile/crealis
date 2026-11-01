//frontend-web/src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import Layout from '../components/Layout'
import api from '../api'
import toast from 'react-hot-toast'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    // Chiffre d'affaires
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    revenueEvolution: 0,

    // Transactions
    todayTransactions: 0,
    totalTransactions: 0,

    // Clients
    activeCustomers: 0,
    totalCustomers: 0,
    newCustomersToday: 0,

    // Commerçants
    totalMerchants: 0,
    activeMerchants: 0,
    supermarketCount: 0,
    pendingMerchants: 0,

    // Stock
    totalStockValue: 0,
    lowStockAlerts: [],
    outOfStockCount: 0,
    lowStockCount: 0,

    // Commandes
    pendingOrders: 0,
    ordersToday: 0,

    // Top produits
    topProducts: [],

    // Graphiques
    salesData: { labels: [], values: [] },
    categoryData: { labels: [], values: [] }
  })

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Appels API parallèles
      const [
        statsRes,
        transactionsRes,
        customersRes,
        merchantsRes,
        productsRes,
        ordersRes,
        topProductsRes
      ] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/transactions'),
        api.get('/customers'),
        api.get('/merchants'),
        api.get('/products'),
        api.get('/orders/pending'),
        api.get('/products/top')
      ])

      const transactions = transactionsRes.data || []
      const customers = customersRes.data || []
      const merchants = merchantsRes.data || []
      const products = productsRes.data?.products || productsRes.data || []
      const stats = statsRes.data || {}

      // Calculs du jour
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayTransactions = transactions.filter(t => new Date(t.created_at || t.createdAt) >= today)
      const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)

      // 🔥 CORRECTION : Clients actifs (ceux qui ont fait une transaction dans les 30 derniers jours)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Récupérer les IDs des clients qui ont des transactions récentes
      const activeCustomerIds = new Set()
      transactions.forEach(t => {
        const txDate = new Date(t.created_at || t.createdAt)
        if (txDate >= thirtyDaysAgo) {
          if (t.customer_id) activeCustomerIds.add(t.customer_id)
          if (t.user_id) activeCustomerIds.add(t.user_id)
        }
      })

      // Compter les clients actifs parmi les customers
      const activeCustomers = customers.filter(c => activeCustomerIds.has(c.id)).length

      // Ou utiliser les stats de l'API si disponibles
      const activeCustomersFromStats = stats.activeCustomers || activeCustomers

      // Valeur du stock global
      const totalStockValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0)

      // Alertes stock
      const lowStockAlerts = products.filter(p => (p.stock || 0) <= (p.minStockAlert || 10))
      const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length

      // Supermarchés partenaires
      const supermarketCount = merchants.filter(m => m.category === 'supermarket' || m.category === 'Alimentation').length

      // Nouveaux clients aujourd'hui
      const newCustomersToday = customers.filter(c => {
        const createdAt = new Date(c.createdAt || c.created_at)
        return createdAt >= today
      }).length

      // Données des ventes par jour
      const last7Days = []
      const salesByDay = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
        last7Days.push(date.toLocaleDateString('fr-FR', { weekday: 'short' }))
        const daySales = transactions
          .filter(t => {
            const txDate = new Date(t.created_at || t.createdAt)
            return txDate.toDateString() === date.toDateString()
          })
          .reduce((sum, t) => sum + (t.amount || 0), 0)
        salesByDay.push(daySales)
      }

      setDashboardData({
        todayRevenue,
        weekRevenue: stats.weekRevenue || 0,
        monthRevenue: stats.monthRevenue || 0,
        revenueEvolution: stats.revenueEvolution || 0,
        todayTransactions: todayTransactions.length,
        totalTransactions: transactions.length,
        activeCustomers: stats.activeCustomers || activeCustomersFromStats,
        totalCustomers: stats.totalCustomers || customers.length,
        newCustomersToday,
        totalMerchants: merchants.length,
        activeMerchants: merchants.filter(m => m.is_active || m.isVerified).length,
        supermarketCount,
        pendingMerchants: merchants.filter(m => !m.isVerified).length,
        totalStockValue,
        lowStockAlerts: lowStockAlerts.slice(0, 5),
        outOfStockCount,
        lowStockCount: lowStockAlerts.length,
        pendingOrders: ordersRes.data?.length || 0,
        ordersToday: ordersRes.data?.filter(o => new Date(o.createdAt) >= today).length || 0,
        topProducts: topProductsRes.data || [],
        salesData: { labels: last7Days, values: salesByDay },
        categoryData: {
          labels: ['Alimentation', 'Boissons', 'Hygiène', 'Électronique', 'Autres'],
          values: [45, 25, 15, 10, 5]
        }
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: dashboardData.salesData.labels,
    datasets: [{
      label: 'Ventes (FCFA)',
      data: dashboardData.salesData.values,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  }

  const categoryChartData = {
    labels: dashboardData.categoryData.labels,
    datasets: [{
      data: dashboardData.categoryData.values,
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    }]
  }

  if (loading) {
    return (
      <>
        <div className="spinner-container"><div className="spinner"></div></div>
      </>
    )
  }

  return (
    
      <div className="dashboard-container">
        {/* En-tête */}
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1 className="dashboard-title">Tableau de bord</h1>
            <p className="dashboard-subtitle">Vue d'ensemble de votre activité</p>
          </div>
          <div className="dashboard-date">
            <div className="date-icon">📅</div>
            <div className="date-text">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Cartes KPI principales */}
        <div className="kpi-grid-main">
          <div className="kpi-card revenue">
            <div className="kpi-icon">💰</div>
            <div className="kpi-info">
              <div className="kpi-title">Chiffre d'affaires du jour</div>
              <div className="kpi-value">{dashboardData.todayRevenue.toLocaleString()} FCFA</div>
              <div className="kpi-trend positive">+{dashboardData.revenueEvolution}% vs hier</div>
            </div>
          </div>
          <div className="kpi-card transactions">
            <div className="kpi-icon">🔄</div>
            <div className="kpi-info">
              <div className="kpi-title">Transactions aujourd'hui</div>
              <div className="kpi-value">{dashboardData.todayTransactions}</div>
              <div className="kpi-trend">Total: {dashboardData.totalTransactions}</div>
            </div>
          </div>
          <div className="kpi-card customers">
            <div className="kpi-icon">👥</div>
            <div className="kpi-info">
              <div className="kpi-title">Clients actifs</div>
              <div className="kpi-value">{dashboardData.activeCustomers}</div>
              <div className="kpi-trend">+{dashboardData.newCustomersToday} aujourd'hui</div>
            </div>
          </div>
          <div className="kpi-card merchants">
            <div className="kpi-icon">🏪</div>
            <div className="kpi-info">
              <div className="kpi-title">Commerçants partenaires</div>
              <div className="kpi-value">{dashboardData.totalMerchants}</div>
              <div className="kpi-trend">{dashboardData.supermarketCount} supermarchés</div>
            </div>
          </div>
        </div>

        {/* Deuxième ligne de KPI */}
        <div className="kpi-grid-secondary">
          <div className="kpi-card stock">
            <div className="kpi-icon">📦</div>
            <div className="kpi-info">
              <div className="kpi-title">Valeur du stock global</div>
              <div className="kpi-value">{dashboardData.totalStockValue.toLocaleString()} FCFA</div>
              <div className="kpi-trend warning">{dashboardData.lowStockCount} alertes stock</div>
            </div>
          </div>
          <div className="kpi-card orders">
            <div className="kpi-icon">📋</div>
            <div className="kpi-info">
              <div className="kpi-title">Commandes en attente</div>
              <div className="kpi-value">{dashboardData.pendingOrders}</div>
              <div className="kpi-trend">{dashboardData.ordersToday} aujourd'hui</div>
            </div>
          </div>
          <div className="kpi-card active-merchants">
            <div className="kpi-icon">✅</div>
            <div className="kpi-info">
              <div className="kpi-title">Commerçants actifs</div>
              <div className="kpi-value">{dashboardData.activeMerchants}</div>
              <div className="kpi-trend">{dashboardData.pendingMerchants} en attente</div>
            </div>
          </div>
          <div className="kpi-card customers-total">
            <div className="kpi-icon">👤</div>
            <div className="kpi-info">
              <div className="kpi-title">Total clients</div>
              <div className="kpi-value">{dashboardData.totalCustomers}</div>
              <div className="kpi-trend">+{dashboardData.newCustomersToday} nouveau(x)</div>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Évolution des ventes (7 jours)</h3>
            </div>
            <div className="chart-container">
              <Line data={chartData} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Ventes par catégorie</h3>
            </div>
            <div className="chart-container small">
              <Doughnut data={categoryChartData} />
            </div>
          </div>
        </div>

        {/* Top produits et alertes stock */}
        <div className="two-columns">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">🏆 Produits les plus vendus</h3>
            </div>
            <div className="top-products-list">
              {dashboardData.topProducts.slice(0, 5).map((product, index) => (
                <div key={index} className="top-product-item">
                  <div className="product-rank">{index + 1}</div>
                  <div className="product-info">
                    <div className="product-name">{product.name}</div>
                    <div className="product-stats">{product.sales} ventes</div>
                  </div>
                  <div className="product-revenue">{product.revenue?.toLocaleString()} FCFA</div>
                </div>
              ))}
              {dashboardData.topProducts.length === 0 && (
                <div className="empty-state">Aucune donnée</div>
              )}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">⚠️ Alertes stock</h3>
            </div>
            <div className="alerts-list">
              {dashboardData.lowStockAlerts.map((alert, index) => (
                <div key={index} className="alert-item">
                  <div className="alert-icon">⚠️</div>
                  <div className="alert-info">
                    <div className="alert-product">{alert.name}</div>
                    <div className="alert-stock">Stock: {alert.stock} / Min: {alert.minStockAlert || 10}</div>
                  </div>
                  <button className="btn btn-sm btn-outline">Réapprovisionner</button>
                </div>
              ))}
              {dashboardData.lowStockAlerts.length === 0 && (
                <div className="empty-state">✅ Stock OK</div>
              )}
              {dashboardData.outOfStockCount > 0 && (
                <div className="alert-summary">
                  {dashboardData.outOfStockCount} produit(s) en rupture de stock
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Résumé rapide */}
        <div className="summary-card">
          <div className="summary-header">
            <h3 className="summary-title">📊 Résumé de l'activité</h3>
          </div>
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-label">CA cette semaine</span>
              <span className="summary-value">{dashboardData.weekRevenue.toLocaleString()} FCFA</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">CA ce mois</span>
              <span className="summary-value">{dashboardData.monthRevenue.toLocaleString()} FCFA</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Transactions totales</span>
              <span className="summary-value">{dashboardData.totalTransactions}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Clients actifs</span>
              <span className="summary-value">{dashboardData.activeCustomers}</span>
            </div>
          </div>
        </div>
      </div>
    
  )
}

export default Dashboard
