// frontend-web/src/components/LoginLogs.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

function LoginLogs() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ today: 0, thisMonth: 0, total: 0, successRate: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: 'all', userId: '' });
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [filter, pagination.page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('limit', pagination.limit);
            params.append('offset', (pagination.page - 1) * pagination.limit);
            if (filter.status !== 'all') params.append('status', filter.status);
            if (filter.userId) params.append('userId', filter.userId);

            const response = await api.get(`/auth/login-logs?${params.toString()}`);
            setLogs(response.data.logs);
            setPagination(prev => ({ ...prev, total: response.data.total }));
        } catch (error) {
            console.error('Error fetching logs:', error);
            toast.error('Erreur lors du chargement des logs');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/auth/login-logs/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'success') {
            return <span className="badge badge-success">✅ Succès</span>;
        }
        return <span className="badge badge-danger">❌ Échec</span>;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="login-logs">
            {/* Statistiques */}
            <div className="stats-login">
                <div className="stat-login">
                    <div className="stat-value">{stats.today}</div>
                    <div className="stat-label">Aujourd'hui</div>
                </div>
                <div className="stat-login">
                    <div className="stat-value">{stats.thisMonth}</div>
                    <div className="stat-label">Ce mois</div>
                </div>
                <div className="stat-login">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total</div>
                </div>
                <div className="stat-login">
                    <div className="stat-value">{stats.successRate}%</div>
                    <div className="stat-label">Taux de succès</div>
                </div>
            </div>

            {/* Filtres */}
            <div className="filters-login">
                <select
                    className="form-select"
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value, page: 1 })}
                >
                    <option value="all">Tous les statuts</option>
                    <option value="success">Succès</option>
                    <option value="failed">Échecs</option>
                </select>
                <input
                    type="text"
                    className="form-input"
                    placeholder="ID utilisateur..."
                    value={filter.userId}
                    onChange={(e) => setFilter({ ...filter, userId: e.target.value, page: 1 })}
                />
                <button className="btn btn-outline" onClick={() => setFilter({ status: 'all', userId: '' })}>
                    Réinitialiser
                </button>
            </div>

            {/* Tableau des logs */}
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Utilisateur</th>
                            <th>Email</th>
                            <th>Rôle</th>
                            <th>IP</th>
                            <th>Statut</th>
                            <th>Erreur</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="text-center">Chargement...</td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center">Aucun log de connexion</td>
                            </tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id}>
                                    <td>{formatDate(log.login_at)}</td>
                                    <td>{log.user_id?.slice(0, 8)}...</td>
                                    <td>{log.user_email}</td>
                                    <td>{log.user_role}</td>
                                    <td>{log.ip_address}</td>
                                    <td>{getStatusBadge(log.status)}</td>
                                    <td>{log.error_message || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
                <div className="pagination">
                    <button
                        className="btn btn-sm btn-outline"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                    >
                        ← Précédent
                    </button>
                    <span>Page {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}</span>
                    <button
                        className="btn btn-sm btn-outline"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page * pagination.limit >= pagination.total}
                    >
                        Suivant →
                    </button>
                </div>
            )}

            <style>{`
                .stats-login {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-bottom: 20px;
                }
                .stat-login {
                    background: #f8fafc;
                    padding: 16px;
                    border-radius: 12px;
                    text-align: center;
                }
                .stat-login .stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #2563eb;
                }
                .stat-login .stat-label {
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 4px;
                }
                .filters-login {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                .filters-login .form-select,
                .filters-login .form-input {
                    width: 200px;
                }
                .text-center {
                    text-align: center;
                }
                @media (max-width: 768px) {
                    .stats-login {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .filters-login {
                        flex-direction: column;
                    }
                    .filters-login .form-select,
                    .filters-login .form-input {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}

export default LoginLogs;
