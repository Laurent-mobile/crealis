//frontend-web/src/pages/Advertising.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import toast from 'react-hot-toast';
import TickerMessagesAdmin from '../components/TickerMessagesAdmin';

function Advertising() {
    const [campaigns, setCampaigns] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [selectedCampaign, setSelectedCampaign] = useState(null)
    const [activeTab, setActiveTab] = useState('campaigns')
    const [stats, setStats] = useState({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalBudget: 0,
        totalSpent: 0,
        avgCTR: 0,
        byType: { banner: 0, video: 0, notification: 0 }
    })
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'banner',
        duration: 30,
        budget: '',
        targetAudience: 'all',
        startDate: '',
        endDate: '',
        mediaUrl: '',
        discountPercent: 0,
        productId: ''
    })

    useEffect(() => {
        fetchCampaigns()
        fetchStats()
    }, [])

    const fetchCampaigns = async () => {
        try {
            console.log('Fetching campaigns...');
            const response = await api.get('/advertising/campaigns')
            console.log('API Response:', response);
            console.log('Campaigns data:', response.data);
            console.log('Is array:', Array.isArray(response.data));

            // Assure-toi que response.data est un tableau
            const campaignsData = Array.isArray(response.data) ? response.data : [];
            setCampaigns(campaignsData)
        } catch (error) {
            console.error('Error fetching campaigns:', error)
            toast.error('Erreur lors du chargement des campagnes')
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await api.get('/advertising/stats')
            setStats(response.data)
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const campaignData = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                duration: formData.duration,
                budget: formData.budget,
                targetAudience: formData.targetAudience,
                startDate: formData.startDate,
                endDate: formData.endDate,
                mediaUrl: formData.mediaUrl || null,
                discountPercent: formData.discountPercent,
                productId: null
            };

            await api.post('/advertising/campaigns', campaignData);
            toast.success('Campagne créée avec succès');
            setShowModal(false);
            resetForm();
            fetchCampaigns();
            fetchStats();
        } catch (error) {
            console.error('Error creating campaign:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de la création');
        }
    };

    const handleStatusChange = async (campaign, newStatus) => {
        try {
            await api.patch(`/advertising/campaigns/${campaign.id}/status`, { status: newStatus })
            toast.success(`Campagne ${newStatus === 'active' ? 'activée' : 'mise en pause'}`)
            fetchCampaigns()
            fetchStats()
        } catch (error) {
            toast.error('Erreur lors du changement de statut')
        }
    }

    const handleDelete = async (campaign) => {
        if (window.confirm(`Supprimer la campagne "${campaign.title}" ?`)) {
            try {
                await api.delete(`/advertising/campaigns/${campaign.id}`)
                toast.success('Campagne supprimée')
                fetchCampaigns()
                fetchStats()
            } catch (error) {
                toast.error('Erreur lors de la suppression')
            }
        }
    }

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            type: 'banner',
            duration: 30,
            budget: '',
            targetAudience: 'all',
            startDate: '',
            endDate: '',
            mediaUrl: '',
            discountPercent: 0,
            productId: ''
        })
    }

    const getStatusBadge = (status) => {
        const statuses = {
            active: { label: 'Active', class: 'badge-success', icon: '🟢' },
            paused: { label: 'En pause', class: 'badge-warning', icon: '⏸️' },
            ended: { label: 'Terminée', class: 'badge-danger', icon: '🔴' },
            scheduled: { label: 'Planifiée', class: 'badge-info', icon: '📅' }
        }
        const s = statuses[status] || statuses.scheduled
        return <span className={`badge ${s.class}`}>{s.icon} {s.label}</span>
    }

    const getTypeIcon = (type) => {
        const types = {
            banner: { icon: '🖼️', label: 'Bannière', color: '#3b82f6' },
            video: { icon: '🎬', label: 'Vidéo', color: '#8b5cf6' },
            notification: { icon: '🔔', label: 'Notification', color: '#f59e0b' }
        }
        return types[type] || types.banner
    }

    const getTargetLabel = (target) => {
        const targets = {
            all: '👥 Tous les clients',
            vip: '💎 Clients VIP',
            new: '🆕 Nouveaux clients',
            inactive: '😴 Clients inactifs'
        }
        return targets[target] || target
    }

    const handleConfigurePlatform = async (platform) => {
        const platformNames = {
            pos_screen: 'Écrans POS Z108',
            led_screen: 'Écrans LED CREALIS',
            push_notification: 'Notifications push'
        };

        const settings = prompt(`Configuration de ${platformNames[platform] || platform}\n\nEntrez les paramètres de configuration:`);

        if (settings) {
            try {
                await api.post('/advertising/configure-platform', {
                    platform,
                    settings: {
                        config: settings,
                        configuredAt: new Date(),
                        status: 'active'
                    }
                });
                toast.success(`${platformNames[platform]} configurée avec succès`);
            } catch (error) {
                toast.error('Erreur lors de la configuration');
            }
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="spinner-container"><div className="spinner"></div></div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="advertising-container">
                {/* En-tête */}
                <div className="page-header">
                    <div className="page-header-content">
                        <div className="page-badge">
                            <span className="page-badge-icon">📢</span>
                            <span className="page-badge-text">Publicité & Marketing</span>
                        </div>
                        <h1 className="page-title">Publicité Digitale</h1>
                        <p className="page-subtitle">Gérez vos campagnes publicitaires sur tous les canaux</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + Nouvelle campagne
                    </button>
                </div>

                {/* Onglets */}
                <div className="advertising-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
                        onClick={() => setActiveTab('campaigns')}
                    >
                        <span className="tab-icon">📢</span>
                        <span>Campagnes</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'platforms' ? 'active' : ''}`}
                        onClick={() => setActiveTab('platforms')}
                    >
                        <span className="tab-icon">📱</span>
                        <span>Plateformes</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        <span className="tab-icon">📊</span>
                        <span>Analytiques</span>
                    </button>
                    {/* Ajoute ce nouvel onglet */}
                    <button
                        className={`tab-btn ${activeTab === 'ticker' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ticker')}
                    >
                        <span className="tab-icon">📢</span>
                        <span>Messages défilants</span>
                    </button>
                </div>

                {/* Onglet Campagnes */}
                {activeTab === 'campaigns' && (
                    <>
                        {/* Statistiques */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">📢</div>
                                <div className="stat-content">
                                    <div className="stat-title">Campagnes totales</div>
                                    <div className="stat-value">{stats.totalCampaigns}</div>
                                    <div className="stat-change">{stats.activeCampaigns} actives</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">👁️</div>
                                <div className="stat-content">
                                    <div className="stat-title">Impressions</div>
                                    <div className="stat-value">{stats.totalImpressions?.toLocaleString() || 0}</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🖱️</div>
                                <div className="stat-content">
                                    <div className="stat-title">Clics</div>
                                    <div className="stat-value">{stats.totalClicks?.toLocaleString() || 0}</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📊</div>
                                <div className="stat-content">
                                    <div className="stat-title">CTR</div>
                                    <div className="stat-value">{stats.avgCTR}%</div>
                                </div>
                            </div>
                        </div>

                        {/* Liste des campagnes */}
                        <div className="campaigns-list">
                            {campaigns.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📢</div>
                                    <div className="empty-state-text">Aucune campagne pour le moment</div>
                                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>Créer votre première campagne</button>
                                </div>
                            ) : (
                                campaigns.map((campaign) => {
                                    const typeInfo = getTypeIcon(campaign.type)
                                    const progress = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0
                                    const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(1) : 0

                                    return (
                                        <div key={campaign.id} className="campaign-card">
                                            <div className="campaign-card-header">
                                                <div className="campaign-type" style={{ backgroundColor: typeInfo.color + '20', color: typeInfo.color }}>
                                                    <span className="campaign-type-icon">{typeInfo.icon}</span>
                                                    <span>{typeInfo.label}</span>
                                                </div>
                                                <div className="campaign-status-badge">
                                                    {getStatusBadge(campaign.status)}
                                                </div>
                                            </div>

                                            <div className="campaign-card-body">
                                                <h3 className="campaign-title">{campaign.title}</h3>
                                                <p className="campaign-description">{campaign.description}</p>

                                                <div className="campaign-meta">
                                                    <span className="meta-tag">🎯 {getTargetLabel(campaign.targetAudience)}</span>
                                                    <span className="meta-tag">📅 {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span>
                                                    {campaign.discountPercent > 0 && (
                                                        <span className="meta-tag promo">🏷️ -{campaign.discountPercent}%</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="campaign-stats">
                                                <div className="stat">
                                                    <div className="stat-label">Impressions</div>
                                                    <div className="stat-value">{campaign.impressions?.toLocaleString() || 0}</div>
                                                </div>
                                                <div className="stat">
                                                    <div className="stat-label">Clics</div>
                                                    <div className="stat-value">{campaign.clicks?.toLocaleString() || 0}</div>
                                                </div>
                                                <div className="stat">
                                                    <div className="stat-label">CTR</div>
                                                    <div className="stat-value">{ctr}%</div>
                                                </div>
                                                <div className="stat">
                                                    <div className="stat-label">Budget</div>
                                                    <div className="stat-value">{campaign.budget?.toLocaleString()} FCFA</div>
                                                </div>
                                            </div>

                                            <div className="campaign-progress">
                                                <div className="progress-header">
                                                    <span>Dépensé: {campaign.spent?.toLocaleString()} FCFA</span>
                                                    <span>{progress.toFixed(0)}%</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                                </div>
                                            </div>

                                            <div className="campaign-actions">
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => { setSelectedCampaign(campaign); setShowDetailsModal(true) }}
                                                >
                                                    📊 Détails
                                                </button>
                                                {campaign.status === 'active' ? (
                                                    <button
                                                        className="btn btn-sm btn-warning"
                                                        onClick={() => handleStatusChange(campaign, 'paused')}
                                                    >
                                                        ⏸️ Pause
                                                    </button>
                                                ) : campaign.status === 'paused' && (
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleStatusChange(campaign, 'active')}
                                                    >
                                                        ▶️ Activer
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(campaign)}
                                                >
                                                    🗑️ Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </>
                )}

                {/* Onglet Plateformes */}
                {activeTab === 'platforms' && (
                    <div className="platforms-section">
                        <div className="platforms-grid">
                            <div className="platform-card">
                                <div className="platform-icon">📱</div>
                                <div className="platform-info">
                                    <div className="platform-name">Écrans POS Z108</div>
                                    <div className="platform-desc">Affichage sur les terminaux de paiement</div>
                                    <div className="platform-stats">
                                        <span>📊 45 terminaux connectés</span>
                                        <span>👁️ 12.4k impressions/jour</span>
                                    </div>
                                </div>
                                <button className="btn btn-outline" onClick={() => handleConfigurePlatform('pos_screen')}>
                                    ⚙️ Configurer
                                </button>
                            </div>

                            <div className="platform-card">
                                <div className="platform-icon">🖥️</div>
                                <div className="platform-info">
                                    <div className="platform-name">Écrans LED CREALIS</div>
                                    <div className="platform-desc">Affichage dans les points de vente</div>
                                    <div className="platform-stats">
                                        <span>📊 12 écrans déployés</span>
                                        <span>👁️ 8.2k impressions/jour</span>
                                    </div>
                                </div>
                                <button className="btn btn-outline" onClick={() => handleConfigurePlatform('led_screen')}>
                                    ⚙️ Configurer
                                </button>
                            </div>

                            <div className="platform-card">
                                <div className="platform-icon">📧</div>
                                <div className="platform-info">
                                    <div className="platform-name">Notifications push</div>
                                    <div className="platform-desc">Envoi direct aux clients</div>
                                    <div className="platform-stats">
                                        <span>📊 2.8k abonnés</span>
                                        <span>📈 65% taux d'ouverture</span>
                                    </div>
                                </div>
                                <button className="btn btn-outline" onClick={() => handleConfigurePlatform('push_notification')}>
                                    ⚙️ Configurer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Onglet Analytiques */}
                {activeTab === 'analytics' && (
                    <div className="analytics-section">
                        <div className="analytics-grid">
                            <div className="analytics-card">
                                <div className="analytics-header">Performance globale</div>
                                <div className="analytics-value">{stats.avgCTR}%</div>
                                <div className="analytics-label">Taux de clics moyen (CTR)</div>
                            </div>
                            <div className="analytics-card">
                                <div className="analytics-header">Budget total</div>
                                <div className="analytics-value">{stats.totalBudget?.toLocaleString()} FCFA</div>
                                <div className="analytics-label">Budget alloué</div>
                            </div>
                            <div className="analytics-card">
                                <div className="analytics-header">Budget dépensé</div>
                                <div className="analytics-value">{stats.totalSpent?.toLocaleString()} FCFA</div>
                                <div className="analytics-label">{((stats.totalSpent / stats.totalBudget) * 100).toFixed(0)}% utilisé</div>
                            </div>
                            <div className="analytics-card">
                                <div className="analytics-header">ROI estimé</div>
                                <div className="analytics-value">+{((stats.totalClicks / stats.totalImpressions) * 100).toFixed(1)}%</div>
                                <div className="analytics-label">Retour sur investissement</div>
                            </div>
                        </div>

                        <div className="analytics-chart">
                            <div className="chart-title">Performance par type de campagne</div>
                            <div className="type-stats">
                                <div className="type-stat">
                                    <div className="type-name">Bannières</div>
                                    <div className="type-bar">
                                        <div className="type-fill" style={{ width: `${(stats.byType?.banner / stats.totalCampaigns) * 100 || 0}%` }}></div>
                                    </div>
                                    <div className="type-count">{stats.byType?.banner || 0} campagnes</div>
                                </div>
                                <div className="type-stat">
                                    <div className="type-name">Vidéos</div>
                                    <div className="type-bar">
                                        <div className="type-fill video" style={{ width: `${(stats.byType?.video / stats.totalCampaigns) * 100 || 0}%` }}></div>
                                    </div>
                                    <div className="type-count">{stats.byType?.video || 0} campagnes</div>
                                </div>
                                <div className="type-stat">
                                    <div className="type-name">Notifications</div>
                                    <div className="type-bar">
                                        <div className="type-fill notification" style={{ width: `${(stats.byType?.notification / stats.totalCampaigns) * 100 || 0}%` }}></div>
                                    </div>
                                    <div className="type-count">{stats.byType?.notification || 0} campagnes</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Onglet Messages défilants */}
                {activeTab === 'ticker' && (
                    <TickerMessagesAdmin />
                )}

                {/* Modal création campagne */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">📢 Nouvelle campagne publicitaire</h3>
                                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Titre de la campagne *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
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

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Type de publicité</label>
                                            <select
                                                className="form-select"
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            >
                                                <option value="banner">🖼️ Bannière</option>
                                                <option value="video">🎬 Vidéo</option>
                                                <option value="notification">🔔 Notification push</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Budget (FCFA)</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.budget}
                                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Date début</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Date fin</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Cible</label>
                                            <select
                                                className="form-select"
                                                value={formData.targetAudience}
                                                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                            >
                                                <option value="all">👥 Tous les clients</option>
                                                <option value="vip">💎 Clients VIP</option>
                                                <option value="new">🆕 Nouveaux clients</option>
                                                <option value="inactive">😴 Clients inactifs</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Réduction (%)</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.discountPercent}
                                                onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">URL média (image/vidéo)</label>
                                        <input
                                            type="url"
                                            className="form-input"
                                            placeholder="https://..."
                                            value={formData.mediaUrl}
                                            onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                                    <button type="submit" className="btn btn-primary">💾 Créer la campagne</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal détails campagne */}
                {showDetailsModal && selectedCampaign && (
                    <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Détails de la campagne</h3>
                                <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="details-header">
                                    <div className="details-icon">{getTypeIcon(selectedCampaign.type).icon}</div>
                                    <div className="details-info">
                                        <h4>{selectedCampaign.title}</h4>
                                        <p>{selectedCampaign.description}</p>
                                    </div>
                                    {getStatusBadge(selectedCampaign.status)}
                                </div>

                                <div className="details-stats">
                                    <div className="detail-stat">
                                        <div className="detail-stat-label">Impressions</div>
                                        <div className="detail-stat-value">{selectedCampaign.impressions?.toLocaleString() || 0}</div>
                                    </div>
                                    <div className="detail-stat">
                                        <div className="detail-stat-label">Clics</div>
                                        <div className="detail-stat-value">{selectedCampaign.clicks?.toLocaleString() || 0}</div>
                                    </div>
                                    <div className="detail-stat">
                                        <div className="detail-stat-label">CTR</div>
                                        <div className="detail-stat-value">
                                            {selectedCampaign.impressions > 0 ? ((selectedCampaign.clicks / selectedCampaign.impressions) * 100).toFixed(1) : 0}%
                                        </div>
                                    </div>
                                    <div className="detail-stat">
                                        <div className="detail-stat-label">Conversions</div>
                                        <div className="detail-stat-value">{selectedCampaign.conversions || 0}</div>
                                    </div>
                                </div>

                                <div className="details-info-list">
                                    <div className="info-row"><strong>Budget:</strong> {selectedCampaign.budget?.toLocaleString()} FCFA</div>
                                    <div className="info-row"><strong>Dépensé:</strong> {selectedCampaign.spent?.toLocaleString()} FCFA</div>
                                    <div className="info-row"><strong>Période:</strong> {new Date(selectedCampaign.startDate).toLocaleDateString()} - {new Date(selectedCampaign.endDate).toLocaleDateString()}</div>
                                    <div className="info-row"><strong>Cible:</strong> {getTargetLabel(selectedCampaign.targetAudience)}</div>
                                    {selectedCampaign.discountPercent > 0 && (
                                        <div className="info-row"><strong>Réduction:</strong> {selectedCampaign.discountPercent}%</div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-primary" onClick={() => setShowDetailsModal(false)}>Fermer</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}

export default Advertising
