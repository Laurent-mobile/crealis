//frontend-web/src/pages/Reports.jsx
import React, { useState } from 'react'
import Layout from '../components/Layout'
import api from '../api'
import toast from 'react-hot-toast'

function Reports() {
    const [reportType, setReportType] = useState('sales')
    const [dateRange, setDateRange] = useState({ start: '', end: '' })
    const [format, setFormat] = useState('excel')
    const [generating, setGenerating] = useState(false)
    const [includeCharts, setIncludeCharts] = useState(true)
    const [includeDetails, setIncludeDetails] = useState(true)
    const [sendByEmail, setSendByEmail] = useState(false)
    const [email, setEmail] = useState('')
    const [preview, setPreview] = useState({ transactions: 0, amount: 0, customers: 0 })

    const reportTypes = [
        { id: 'sales', label: 'Rapport des ventes', icon: '💰', color: '#3b82f6', description: 'Analyse détaillée des ventes par période' },
        { id: 'transactions', label: 'Rapport des transactions', icon: '🔄', color: '#10b981', description: 'Historique complet des transactions' },
        { id: 'loyalty', label: 'Rapport de fidélité', icon: '⭐', color: '#f59e0b', description: 'Statistiques des points et récompenses' },
        { id: 'merchants', label: 'Rapport commerçants', icon: '🏪', color: '#8b5cf6', description: 'Performance des commerçants partenaires' },
        { id: 'customers', label: 'Rapport clients', icon: '👥', color: '#06b6d4', description: 'Analyse de la base clients' },
        { id: 'stock', label: 'Rapport de stock', icon: '📦', color: '#f97316', description: 'État des stocks et mouvements' },
        { id: 'inventory', label: 'Inventaire', icon: '📊', color: '#84cc16', description: 'Inventaire complet des produits' }
    ]

    const getPreview = async () => {
        if (!dateRange.start || !dateRange.end) return
        try {
            const response = await api.post('/reports/preview', {
                reportType,
                startDate: dateRange.start,
                endDate: dateRange.end
            })
            setPreview(response.data)
        } catch (error) {
            console.error('Error getting preview:', error)
        }
    }

    const handleGenerate = async () => {
        if (!dateRange.start || !dateRange.end) {
            toast.error('Veuillez sélectionner une période')
            return
        }

        if (sendByEmail && !email) {
            toast.error('Veuillez entrer une adresse email')
            return
        }

        setGenerating(true)
        try {
            const response = await api.post('/reports/generate', {
                reportType,
                startDate: dateRange.start,
                endDate: dateRange.end,
                format,
                includeCharts,
                includeDetails,
                sendByEmail,
                email
            }, {
                responseType: format === 'excel' ? 'blob' : 'json'
            })

            if (format === 'excel' || format === 'csv') {
                // Télécharger le fichier
                const url = window.URL.createObjectURL(new Blob([response.data]))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', `rapport_${reportType}_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`)
                document.body.appendChild(link)
                link.click()
                link.remove()
                toast.success('Rapport téléchargé avec succès')
            } else {
                toast.success('Rapport généré avec succès')
            }

            if (sendByEmail) {
                toast.success(`Rapport envoyé à ${email}`)
            }
        } catch (error) {
            console.error('Error generating report:', error)
            toast.error('Erreur lors de la génération du rapport')
        } finally {
            setGenerating(false)
        }
    }

    const getTodayRange = () => {
        const today = new Date().toISOString().slice(0, 10)
        setDateRange({ start: today, end: today })
        setTimeout(() => getPreview(), 100)
    }

    const getWeekRange = () => {
        const today = new Date()
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        setDateRange({ start: weekAgo.toISOString().slice(0, 10), end: today.toISOString().slice(0, 10) })
        setTimeout(() => getPreview(), 100)
    }

    const getMonthRange = () => {
        const today = new Date()
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        setDateRange({ start: monthAgo.toISOString().slice(0, 10), end: today.toISOString().slice(0, 10) })
        setTimeout(() => getPreview(), 100)
    }

    const getYearRange = () => {
        const today = new Date()
        const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
        setDateRange({ start: yearAgo.toISOString().slice(0, 10), end: today.toISOString().slice(0, 10) })
        setTimeout(() => getPreview(), 100)
    }

    const selectedReport = reportTypes.find(r => r.id === reportType)

    return (
        
            <div className="reports-container">
                <div className="page-header">
                    <div className="page-header-content">
                        <div className="page-badge">
                            <span className="page-badge-icon">📊</span>
                            <span className="page-badge-text">Analyses & Rapports</span>
                        </div>
                        <h1 className="page-title">Rapports et analyses</h1>
                        <p className="page-subtitle">Générez et exportez vos rapports personnalisés</p>
                    </div>
                </div>

                <div className="reports-types-grid">
                    {reportTypes.map((type) => (
                        <div
                            key={type.id}
                            className={`report-type-card ${reportType === type.id ? 'active' : ''}`}
                            onClick={() => setReportType(type.id)}
                            style={{ borderLeftColor: type.color }}
                        >
                            <div className="report-type-icon" style={{ backgroundColor: type.color + '20', color: type.color }}>
                                {type.icon}
                            </div>
                            <div className="report-type-info">
                                <div className="report-type-label">{type.label}</div>
                                <div className="report-type-description">{type.description}</div>
                            </div>
                            {reportType === type.id && (
                                <div className="report-type-selected" style={{ backgroundColor: type.color }}>
                                    ✓
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="report-config-card">
                    <div className="config-header">
                        <div className="config-title">
                            <span className="config-icon">⚙️</span>
                            <span>Configuration du rapport</span>
                        </div>
                        <div className="config-badge" style={{ backgroundColor: selectedReport?.color + '20', color: selectedReport?.color }}>
                            {selectedReport?.label}
                        </div>
                    </div>

                    <div className="config-body">
                        <div className="config-section">
                            <h3 className="section-title">📅 Période d'analyse</h3>
                            <div className="period-buttons">
                                <button className="period-btn" onClick={getTodayRange}>Aujourd'hui</button>
                                <button className="period-btn" onClick={getWeekRange}>7 jours</button>
                                <button className="period-btn" onClick={getMonthRange}>30 jours</button>
                                <button className="period-btn" onClick={getYearRange}>12 mois</button>
                            </div>
                            <div className="date-range-inputs">
                                <div className="date-input-group">
                                    <label className="date-label">Date début</label>
                                    <input
                                        type="date"
                                        className="date-input"
                                        value={dateRange.start}
                                        onChange={(e) => { setDateRange({ ...dateRange, start: e.target.value }); setTimeout(() => getPreview(), 100) }}
                                    />
                                </div>
                                <div className="date-input-group">
                                    <label className="date-label">Date fin</label>
                                    <input
                                        type="date"
                                        className="date-input"
                                        value={dateRange.end}
                                        onChange={(e) => { setDateRange({ ...dateRange, end: e.target.value }); setTimeout(() => getPreview(), 100) }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="config-section">
                            <h3 className="section-title">📄 Format d'export</h3>
                            <div className="format-buttons">
                                <button className={`format-btn ${format === 'excel' ? 'active' : ''}`} onClick={() => setFormat('excel')}>
                                    <span className="format-icon">📊</span>
                                    <span>Excel</span>
                                </button>
                                <button className={`format-btn ${format === 'csv' ? 'active' : ''}`} onClick={() => setFormat('csv')}>
                                    <span className="format-icon">📑</span>
                                    <span>CSV</span>
                                </button>
                            </div>
                        </div>

                        <div className="config-section">
                            <h3 className="section-title">⚙️ Options</h3>
                            <div className="options-list">
                                <label className="option-checkbox">
                                    <input type="checkbox" checked={includeDetails} onChange={(e) => setIncludeDetails(e.target.checked)} />
                                    <span>📋 Inclure le détail des transactions</span>
                                </label>
                                <label className="option-checkbox">
                                    <input type="checkbox" checked={sendByEmail} onChange={(e) => setSendByEmail(e.target.checked)} />
                                    <span>✉️ Envoyer par email</span>
                                </label>
                                {sendByEmail && (
                                    <div className="email-input-group">
                                        <input
                                            type="email"
                                            className="email-input"
                                            placeholder="exemple@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            className={`generate-btn ${generating ? 'generating' : ''}`}
                            onClick={handleGenerate}
                            disabled={generating}
                            style={{ backgroundColor: selectedReport?.color }}
                        >
                            {generating ? (
                                <>
                                    <span className="spinner-small"></span>
                                    <span>Génération en cours...</span>
                                </>
                            ) : (
                                <>
                                    <span>📥</span>
                                    <span>Générer le rapport</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="preview-card">
                    <div className="preview-header">
                        <div className="preview-title">📊 Aperçu du rapport</div>
                    </div>
                    <div className="preview-content">
                        {dateRange.start && dateRange.end ? (
                            <div className="preview-stats">
                                <div className="preview-stat">
                                    <div className="stat-value">{preview.transactions || 0}</div>
                                    <div className="stat-label">Transactions</div>
                                </div>
                                <div className="preview-stat">
                                    <div className="stat-value">{preview.amount?.toLocaleString() || 0} FCFA</div>
                                    <div className="stat-label">Montant total</div>
                                </div>
                                <div className="preview-stat">
                                    <div className="stat-value">{preview.customers || 0}</div>
                                    <div className="stat-label">Clients</div>
                                </div>
                            </div>
                        ) : (
                            <div className="preview-note">
                                📅 Sélectionnez une période pour voir un aperçu
                            </div>
                        )}
                    </div>
                </div>
            </div>
        
    )
}

export default Reports
