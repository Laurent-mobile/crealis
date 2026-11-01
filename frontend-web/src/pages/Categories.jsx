//frontend-web/src/pages/Categories.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import toast from 'react-hot-toast';

function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: '📦'
    });
    const [selectedIcon, setSelectedIcon] = useState('📦');

    const icons = [
        '🍎', '🥤', '🧴', '📱', '👕', '🏠', '💄', '⚽',
        '📚', '🎮', '🔧', '🐶', '🌿', '🥛', '🍞', '🧀',
        '🍕', '🍔', '🍟', '🍦', '🍩', '☕', '🍷', '🍺',
        '📦', '🛒', '🏪', '💳', '⭐', '🎯', '❤️', '👍'
    ];

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Erreur lors du chargement des catégories');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                name: formData.name,
                description: formData.description,
                icon: selectedIcon
            };

            if (editingCategory) {
                await api.put(`/categories/${editingCategory.id}`, submitData);
                toast.success('Catégorie modifiée avec succès');
            } else {
                await api.post('/categories', submitData);
                toast.success('Catégorie créée avec succès');
            }
            setShowModal(false);
            resetForm();
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'opération');
        }
    };

    const handleDelete = async (category) => {
        if (window.confirm(`Supprimer la catégorie "${category.name}" ?`)) {
            try {
                await api.delete(`/categories/${category.id}`);
                toast.success('Catégorie supprimée');
                fetchCategories();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
            }
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            icon: category.icon
        });
        setSelectedIcon(category.icon || '📦');
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            description: '',
            icon: '📦'
        });
        setSelectedIcon('📦');
    };

    if (loading) {
        return (
            <Layout>
                <div className="spinner-container"><div className="spinner"></div></div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Gestion des Catégories</h1>
                        <p className="page-subtitle">Gérez les catégories de produits</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
                        + Nouvelle Catégorie
                    </button>
                </div>

                {/* Liste des catégories */}
                <div className="categories-grid">
                    {categories.map((category) => (
                        <div key={category.id} className="category-card">
                            <div className="category-icon">{category.icon || '📦'}</div>
                            <div className="category-info">
                                <div className="category-name">{category.name}</div>
                                <div className="category-description">{category.description || 'Aucune description'}</div>
                                <div className="category-stats">
                                    {category.isActive ? (
                                        <span className="badge badge-success">Active</span>
                                    ) : (
                                        <span className="badge badge-danger">Inactive</span>
                                    )}
                                </div>
                            </div>
                            <div className="category-actions">
                                <button className="btn-icon" onClick={() => handleEdit(category)} title="Modifier">
                                    ✏️
                                </button>
                                <button className="btn-icon" onClick={() => handleDelete(category)} title="Supprimer">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal Ajout/Modification */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">
                                    {editingCategory ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
                                </h3>
                                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Nom de la catégorie *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Icône</label>
                                        <div className="icon-selector">
                                            <div className="selected-icon">
                                                <span className="selected-icon-preview">{selectedIcon}</span>
                                                <span>Icône sélectionnée</span>
                                            </div>
                                            <div className="icons-grid">
                                                {icons.map((icon) => (
                                                    <button
                                                        key={icon}
                                                        type="button"
                                                        className={`icon-option ${selectedIcon === icon ? 'active' : ''}`}
                                                        onClick={() => setSelectedIcon(icon)}
                                                    >
                                                        {icon}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-textarea"
                                            rows="3"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Description de la catégorie..."
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingCategory ? 'Modifier' : 'Ajouter'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default Categories;
