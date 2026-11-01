// frontend-web/src/pages/MerchantDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import Layout from '../components/Layout';
import api from '../api';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function MerchantDashboard() {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        merchant: {},
        kpis: {
            todayRevenue: 0,
            weekRevenue: 0,
            monthRevenue: 0,
            revenueEvolution: 0,
            totalTransactions: 0
        },
        topProducts: [],
        loyalCustomers: [],
        salesData: { labels: [], values: [] }
    });

    useEffect(() => {
        fetchMerchantDashboard();
    }, []);

    const fetchMerchantDashboard = async () => {
        try {
            const response = await api.get('/merchant-dashboard/stats');
            setDashboardData(response.data);
        } catch (error) {
            console.error('Error fetching merchant dashboard:', error);
            toast.error('Erreur lors du chargement de vos données');
        } finally {
            setLoading(false);
        }
    };

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
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${context.raw.toLocaleString()} FCFA`;
                    }
                }
            }
        },
        scales: {
            y: {
                ticks: {
                    callback: function (value) {
                        return value.toLocaleString() + ' FCFA';
                    }
                }
            }
        }
    };

    if (loading) {
        return (
            <>
                <div className="spinner-container"><div className="spinner"></div></div>
            </>
        );
    }

    return (
        <>
            <div className="dashboard-container">
                {/* En-tête personnalisé avec le nom du commerçant */}
                <div className="dashboard-header">
                    <div className="welcome-section">
                        <div className="page-badge">
                            <span className="page-badge-icon">🏪</span>
                            <span className="page-badge-text">Espace Commerçant</span>
                        </div>
                        <h1 className="dashboard-title">
                            Bonjour, <span className="title-highlight">{dashboardData.merchant.name || 'Commerçant'}</span>
                        </h1>
                        <p className="dashboard-subtitle">
                            {dashboardData.merchant.city} · {dashboardData.merchant.plan === 'premium' ? '⭐ Offre Premium' : 'Offre Basic'} · Cashback {dashboardData.merchant.cashbackRate || 0}%
                        </p>
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
                            <div className="kpi-value">{dashboardData.kpis.todayRevenue.toLocaleString()} FCFA</div>
                            <div className="kpi-trend positive">+{dashboardData.kpis.revenueEvolution}% vs semaine dernière</div>
                        </div>
                    </div>
                    <div className="kpi-card transactions">
                        <div className="kpi-icon">🔄</div>
                        <div className="kpi-info">
                            <div className="kpi-title">Transactions cette semaine</div>
                            <div className="kpi-value">{dashboardData.kpis.totalTransactions}</div>
                            <div className="kpi-trend">Total: {dashboardData.kpis.weekRevenue.toLocaleString()} FCFA</div>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon">📈</div>
                        <div className="kpi-info">
                            <div className="kpi-title">CA ce mois</div>
                            <div className="kpi-value">{dashboardData.kpis.monthRevenue.toLocaleString()} FCFA</div>
                            <div className="kpi-trend">Projection: +12%</div>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon">🎯</div>
                        <div className="kpi-info">
                            <div className="kpi-title">Cashback distribué</div>
                            <div className="kpi-value">{(dashboardData.kpis.weekRevenue * (dashboardData.merchant.cashbackRate / 100)).toLocaleString()} FCFA</div>
                            <div className="kpi-trend">Cette semaine</div>
                        </div>
                    </div>
                </div>

                {/* Graphique et Top Produits */}
                <div className="two-columns">
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3 className="chart-title">Évolution de vos ventes (7 jours)</h3>
                        </div>
                        <div className="chart-container" style={{ height: '300px' }}>
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    </div>
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3 className="chart-title">🏆 Vos produits les plus vendus</h3>
                        </div>
                        <div className="top-products-list">
                            {dashboardData.topProducts.length > 0 ? (
                                dashboardData.topProducts.map((product, index) => (
                                    <div key={index} className="top-product-item">
                                        <div className="product-rank">{index + 1}</div>
                                        <div className="product-info">
                                            <div className="product-name">{product.name}</div>
                                            <div className="product-stats">{product.sales} ventes</div>
                                        </div>
                                        <div className="product-revenue">{product.revenue.toLocaleString()} FCFA</div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">Aucune donnée de vente pour le moment.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Clients fidèles */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">⭐ Vos clients les plus fidèles</h3>
                        <span className="chart-badge">Top 5</span>
                    </div>
                    <div className="customers-list">
                        {dashboardData.loyalCustomers.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Client</th>
                                        <th>Points fidélité</th>
                                        <th>Total dépensé</th>
                                        <th>Niveau VIP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.loyalCustomers.map((customer) => (
                                        <tr key={customer.id}>
                                            <td>{customer.phoneNumber}</td>
                                            <td><span className="badge badge-info">{customer.loyaltyPoints} pts</span></td>
                                            <td>{(customer.totalSpent || 0).toLocaleString()} FCFA</td>
                                            <td>
                                                <span className={`vip-badge ${customer.vipLevel}`}>
                                                    {customer.vipLevel === 'platinum' ? '💎' : customer.vipLevel === 'gold' ? '🥇' : customer.vipLevel === 'silver' ? '🥈' : '🥉'} {customer.vipLevel}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">Aucun client fidèle pour le moment.</div>
                        )}
                    </div>
                </div>

                {/* Section des actions rapides */}
                <div className="summary-card">
                    <div className="summary-header">
                        <h3 className="summary-title">⚡ Actions rapides</h3>
                    </div>
                    <div className="quick-actions" style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={() => window.location.href = '/loyalty'}>
                            💳 Gérer la fidélité
                        </button>
                        <button className="btn btn-outline" onClick={() => window.location.href = '/transactions'}>
                            📜 Voir les transactions
                        </button>
                        <button className="btn btn-outline" onClick={() => window.location.href = '/products'}>
                            📦 Gérer mes produits
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default MerchantDashboard;
