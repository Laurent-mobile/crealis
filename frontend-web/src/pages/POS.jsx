//frontend-web/src/pages/POS.jsx
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../api'
import toast from 'react-hot-toast'

function POS() {
    const [posDevices, setPosDevices] = useState([])
    const [merchants, setMerchants] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [selectedDevice, setSelectedDevice] = useState(null)
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        maintenance: 0,
        recentlySynced: 0,
        byModel: { Z108: 0, Z110: 0, other: 0 }
    })
    const [formData, setFormData] = useState({
        deviceId: '',
        model: 'Z108',
        serialNumber: '',
        merchantId: '',
        location: ''
    })
    const [editData, setEditData] = useState({
        model: '',
        location: ''
    })
    const [statusData, setStatusData] = useState({
        status: '',
        firmwareVersion: ''
    })

    useEffect(() => {
        fetchDevices()
        fetchMerchants()
        fetchStats()
    }, [])

    const fetchDevices = async () => {
        try {
            const response = await api.get('/pos')
            setPosDevices(response.data)
        } catch (error) {
            console.error('Error fetching POS devices:', error)
            toast.error('Erreur lors du chargement des terminaux')
        } finally {
            setLoading(false)
        }
    }

    const fetchMerchants = async () => {
        try {
            const response = await api.get('/merchants')
            console.log('Merchants response:', response.data) // Pour déboguer
            // Vérifier le format de la réponse
            const merchantsData = Array.isArray(response.data) ? response.data : (response.data.merchants || [])
            setMerchants(merchantsData)
        } catch (error) {
            console.error('Error fetching merchants:', error)
            toast.error('Erreur lors du chargement des commerçants')
        }
    }

    const fetchStats = async () => {
        try {
            const response = await api.get('/pos/stats/dashboard')
            setStats(response.data)
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await api.post('/pos/register', formData)
            toast.success('Terminal POS enregistré avec succès')
            setShowModal(false)
            resetForm()
            fetchDevices()
            fetchStats()
        } catch (error) {
            console.error('Error:', error)
            toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement')
        }
    }

    const handleUpdate = async () => {
        if (!selectedDevice) return
        try {
            await api.put(`/pos/${selectedDevice.id}`, editData)
            toast.success('Terminal modifié avec succès')
            setShowEditModal(false)
            fetchDevices()
        } catch (error) {
            toast.error('Erreur lors de la modification')
        }
    }

    const handleStatusChange = async () => {
        if (!selectedDevice) return
        try {
            await api.put(`/pos/${selectedDevice.id}/status`, { status: statusData.status })
            toast.success(statusData.status === 'active' ? 'Terminal activé' : 'Terminal désactivé')
            setShowStatusModal(false)
            fetchDevices()
            fetchStats()
        } catch (error) {
            toast.error('Erreur lors du changement de statut')
        }
    }

    const handleFirmwareUpdate = async () => {
        if (!selectedDevice || !statusData.firmwareVersion) return
        try {
            await api.post(`/pos/${selectedDevice.id}/firmware`, { firmwareVersion: statusData.firmwareVersion })
            toast.success(`Firmware mis à jour vers ${statusData.firmwareVersion}`)
            setShowStatusModal(false)
            fetchDevices()
        } catch (error) {
            toast.error('Erreur lors de la mise à jour')
        }
    }

    const handleSync = async (device) => {
        try {
            toast.loading('Synchronisation en cours...')
            const response = await api.post(`/pos/${device.id}/sync`)
            toast.dismiss()
            toast.success(`Synchronisation effectuée`)
            fetchDevices()
        } catch (error) {
            toast.dismiss()
            toast.error('Erreur lors de la synchronisation')
        }
    }

    const handleDelete = async (device) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le terminal ${device.deviceId} ?`)) {
            try {
                await api.delete(`/pos/${device.id}`)
                toast.success('Terminal supprimé avec succès')
                fetchDevices()
                fetchStats()
            } catch (error) {
                toast.error('Erreur lors de la suppression')
            }
        }
    }

    const resetForm = () => {
        setFormData({
            deviceId: '',
            model: 'Z108',
            serialNumber: '',
            merchantId: '',
            location: ''
        })
    }

    const openEditModal = (device) => {
        setSelectedDevice(device)
        setEditData({
            model: device.model,
            location: device.location || ''
        })
        setShowEditModal(true)
    }

    const openStatusModal = (device) => {
        setSelectedDevice(device)
        setStatusData({
            status: device.status,
            firmwareVersion: device.firmwareVersion || ''
        })
        setShowStatusModal(true)
    }

    const getStatusBadge = (status) => {
        const statuses = {
            active: { label: 'Actif', class: 'badge-success', icon: '🟢' },
            inactive: { label: 'Inactif', class: 'badge-danger', icon: '🔴' },
            maintenance: { label: 'Maintenance', class: 'badge-warning', icon: '🟡' }
        }
        const s = statuses[status] || statuses.inactive
        return <span className={`badge ${s.class}`}>{s.icon} {s.label}</span>
    }

    const getLastSyncStatus = (lastSync) => {
        if (!lastSync) return { label: 'Jamais', class: 'badge-danger' }
        const hoursSinceSync = (new Date() - new Date(lastSync)) / (1000 * 60 * 60)
        if (hoursSinceSync < 1) return { label: 'À l\'instant', class: 'badge-success' }
        if (hoursSinceSync < 24) return { label: `${Math.floor(hoursSinceSync)}h`, class: 'badge-info' }
        return { label: `${Math.floor(hoursSinceSync / 24)}j`, class: 'badge-warning' }
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
                        <h1 className="page-title">Terminaux POS Z108</h1>
                        <p className="page-subtitle">Gestion des terminaux de paiement intelligents</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + Nouveau Terminal
                    </button>
                </div>

                {/* Statistiques */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📱</div>
                        <div className="stat-content">
                            <div className="stat-title">Total terminaux</div>
                            <div className="stat-value">{stats.total}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🟢</div>
                        <div className="stat-content">
                            <div className="stat-title">Actifs</div>
                            <div className="stat-value">{stats.active}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🟡</div>
                        <div className="stat-content">
                            <div className="stat-title">Maintenance</div>
                            <div className="stat-value">{stats.maintenance}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🔄</div>
                        <div className="stat-content">
                            <div className="stat-title">Synchro récente</div>
                            <div className="stat-value">{stats.recentlySynced}</div>
                        </div>
                    </div>
                </div>

                {/* Liste des terminaux */}
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID Terminal</th>
                                <th>Modèle</th>
                                <th>Série</th>
                                <th>Commerçant</th>
                                <th>Localisation</th>
                                <th>Version</th>
                                <th>Statut</th>
                                <th>Dernière sync</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posDevices.map((device) => {
                                const syncStatus = getLastSyncStatus(device.lastSync)
                                return (
                                    <tr key={device.id}>
                                        <td className="device-id">{device.deviceId}</td>
                                        <td>{device.model}</td>
                                        <td>{device.serialNumber}</td>
                                        <td>{device.merchant?.name || device.merchant?.businessName || '-'}</td>
                                        <td>{device.location || '-'}</td>
                                        <td>
                                            <span className="badge badge-info">v{device.firmwareVersion || '1.0.0'}</span>
                                        </td>
                                        <td>{getStatusBadge(device.status)}</td>
                                        <td>
                                            <span className={`badge ${syncStatus.class}`}>{syncStatus.label}</span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-icon" onClick={() => handleSync(device)} title="Synchroniser">🔄</button>
                                                <button className="btn-icon" onClick={() => openEditModal(device)} title="Modifier">✏️</button>
                                                <button className="btn-icon" onClick={() => openStatusModal(device)} title="Statut">⚙️</button>
                                                <button className="btn-icon" onClick={() => handleDelete(device)} title="Supprimer">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Modal Ajout */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">📱 Enregistrer un terminal POS</h3>
                                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">ID du terminal *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.deviceId}
                                            onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                                            placeholder="Ex: POS_001"
                                            required
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Modèle</label>
                                            <select className="form-select" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })}>
                                                <option value="Z108">Z108</option>
                                                <option value="Z110">Z110</option>
                                                <option value="Z200">Z200</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Numéro de série *</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.serialNumber}
                                                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Commerçant *</label>
                                        <select
                                            className="form-select"
                                            value={formData.merchantId}
                                            onChange={(e) => setFormData({ ...formData, merchantId: e.target.value })}
                                            required
                                        >
                                            <option value="">Sélectionner un commerçant</option>
                                            {merchants.length === 0 ? (
                                                <option disabled>Aucun commerçant disponible</option>
                                            ) : (
                                                merchants.map(m => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.name || m.businessName}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        {merchants.length === 0 && (
                                            <small className="text-muted">Aucun commerçant trouvé. Veuillez d'abord créer un commerçant.</small>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Localisation</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="Ex: Caisse 1, Étage 2"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                                    <button type="submit" className="btn btn-primary">Enregistrer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Modification */}
                {showEditModal && selectedDevice && (
                    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">✏️ Modifier le terminal</h3>
                                <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="info-box" style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <strong>Terminal:</strong> {selectedDevice.deviceId}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Modèle</label>
                                    <select className="form-select" value={editData.model} onChange={(e) => setEditData({ ...editData, model: e.target.value })}>
                                        <option value="Z108">Z108</option>
                                        <option value="Z110">Z110</option>
                                        <option value="Z200">Z200</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Localisation</label>
                                    <input type="text" className="form-input" value={editData.location} onChange={(e) => setEditData({ ...editData, location: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-outline" onClick={() => setShowEditModal(false)}>Annuler</button>
                                <button className="btn btn-primary" onClick={handleUpdate}>Modifier</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Statut */}
                {showStatusModal && selectedDevice && (
                    <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">⚙️ Gestion du terminal</h3>
                                <button className="modal-close" onClick={() => setShowStatusModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="info-box" style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <strong>Terminal:</strong> {selectedDevice.deviceId}<br />
                                    <strong>Commerçant:</strong> {selectedDevice.merchant?.name || selectedDevice.merchant?.businessName}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Statut</label>
                                    <select className="form-select" value={statusData.status} onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}>
                                        <option value="active">🟢 Actif</option>
                                        <option value="inactive">🔴 Inactif</option>
                                        <option value="maintenance">🟡 Maintenance</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Version firmware</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={statusData.firmwareVersion}
                                        onChange={(e) => setStatusData({ ...statusData, firmwareVersion: e.target.value })}
                                        placeholder="Ex: 1.2.0"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-outline" onClick={() => setShowStatusModal(false)}>Annuler</button>
                                <button className="btn btn-primary" onClick={handleStatusChange}>Changer statut</button>
                                <button className="btn btn-secondary" onClick={handleFirmwareUpdate}>Mettre à jour firmware</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        
    )
}

export default POS
