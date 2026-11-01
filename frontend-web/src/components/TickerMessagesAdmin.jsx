// frontend-web/src/components/TickerMessagesAdmin.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

function TickerMessagesAdmin() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [formData, setFormData] = useState({
        message: '',
        type: 'info',
        priority: 1,
        is_active: true,
        start_date: '',
        end_date: ''
    });

    const types = [
        { value: 'info', label: 'Information', icon: 'ℹ️', color: '#2563eb' },
        { value: 'promotion', label: 'Promotion', icon: '🎉', color: '#dc2626' },
        { value: 'warning', label: 'Alerte', icon: '⚠️', color: '#d97706' },
        { value: 'update', label: 'Mise à jour', icon: '🔄', color: '#059669' },
        { value: 'general', label: 'Général', icon: '📢', color: '#9333ea' }
    ];

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await api.get('/ticker');
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMessage) {
                await api.put(`/ticker/${editingMessage.id}`, formData);
                toast.success('Message modifié');
            } else {
                await api.post('/ticker', formData);
                toast.success('Message créé');
            }
            setShowModal(false);
            resetForm();
            fetchMessages();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Supprimer ce message ?')) {
            try {
                await api.delete(`/ticker/${id}`);
                toast.success('Message supprimé');
                fetchMessages();
            } catch (error) {
                toast.error('Erreur lors de la suppression');
            }
        }
    };

    const handleEdit = (message) => {
        setEditingMessage(message);
        setFormData({
            message: message.message,
            type: message.type,
            priority: message.priority,
            is_active: message.is_active,
            start_date: message.start_date?.slice(0, 10) || '',
            end_date: message.end_date?.slice(0, 10) || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingMessage(null);
        setFormData({
            message: '',
            type: 'info',
            priority: 1,
            is_active: true,
            start_date: '',
            end_date: ''
        });
    };

    const getTypeInfo = (type) => {
        return types.find(t => t.value === type) || types[0];
    };

    return (
        <div className="ticker-messages-admin">
            <div className="section-header">
                <h2>📢 Messages défilants</h2>
                <p>Gérez les messages qui défilent sur l'application mobile</p>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    + Nouveau message
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Message</th>
                            <th>Type</th>
                            <th>Priorité</th>
                            <th>Période</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {messages.map(msg => {
                            const typeInfo = getTypeInfo(msg.type);
                            return (
                                <tr key={msg.id}>
                                    <td className="message-cell">{msg.message}</td>
                                    <td>
                                        <span className="type-badge" style={{ backgroundColor: typeInfo.color + '20', color: typeInfo.color }}>
                                            {typeInfo.icon} {typeInfo.label}
                                        </span>
                                    </td>
                                    <td>{msg.priority}</td>
                                    <td>
                                        {msg.start_date ? new Date(msg.start_date).toLocaleDateString() : 'toujours'}
                                        {msg.end_date ? ` → ${new Date(msg.end_date).toLocaleDateString()}` : ''}
                                    </td>
                                    <td>
                                        {msg.is_active ?
                                            <span className="badge badge-success">Actif</span> :
                                            <span className="badge badge-danger">Inactif</span>
                                        }
                                    </td>
                                    <td>
                                        <button className="btn-icon" onClick={() => handleEdit(msg)}>✏️</button>
                                        <button className="btn-icon" onClick={() => handleDelete(msg.id)}>🗑️</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingMessage ? 'Modifier le message' : 'Nouveau message'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Message *</label>
                                    <textarea
                                        className="form-textarea"
                                        rows="3"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                        placeholder="Saisissez votre message..."
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select
                                            className="form-select"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            {types.map(t => (
                                                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Priorité (1-10)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                            min="1"
                                            max="10"
                                        />
                                        <small>Les messages avec priorité haute s'affichent en premier</small>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Date de début</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Date de fin</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                        <span>Message actif</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingMessage ? 'Modifier' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .message-cell {
                    max-width: 300px;
                    white-space: normal;
                    word-break: break-word;
                }
                .type-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                }
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
            `}</style>
        </div>
    );
}

export default TickerMessagesAdmin;
