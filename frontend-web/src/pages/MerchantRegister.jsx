// frontend-web/src/pages/MerchantRegister.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

function MerchantRegister() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        businessName: '',
        businessType: 'general',
        city: 'Ouagadougou',
        address: '',
        registrationNumber: '',
        agreeTerms: false
    });

    const businessTypes = [
        { value: 'supermarket', label: 'Supermarché', icon: '🛒' },
        { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
        { value: 'boutique', label: 'Boutique', icon: '👕' },
        { value: 'pharmacy', label: 'Pharmacie', icon: '💊' },
        { value: 'electronics', label: 'Électronique', icon: '📱' },
        { value: 'beauty', label: 'Beauté & Coiffure', icon: '💄' },
        { value: 'sports', label: 'Sport & Fitness', icon: '⚽' },
        { value: 'general', label: 'Autre', icon: '🏪' }
    ];

    const cities = [
        'Ouagadougou',
        'Bobo-Dioulasso',
        'Koudougou',
        'Banfora',
        'Ouahigouya',
        'Kaya',
        'Fada N\'Gourma',
        'Dédougou',
        'Tenkodogo',
        'Manga'
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        if (!formData.agreeTerms) {
            toast.error('Veuillez accepter les conditions d\'utilisation');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/register-merchant', {
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                businessName: formData.businessName,
                businessType: formData.businessType,
                city: formData.city,
                address: formData.address,
                registrationNumber: formData.registrationNumber
            });

            // Stocker le token et l'utilisateur
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            toast.success('Inscription réussie ! Bienvenue sur CREALIS');

            // Rediriger vers le dashboard commerçant
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);

        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-bg">
                <div className="register-bg-overlay"></div>
            </div>

            <div className="register-card">
                <div className="register-header">
                    <div className="register-logo">
                        <img src="/src/assets/logo.jpg" alt="Créalis" className="logo-image-large" />
                        <div className="logo-text-large">
                            <span className="logo-main">{companyName}</span>
                            <span className="logo-sub">DASSANDAGA</span>
                        </div>
                    </div>
                    <h1 className="register-title">Devenir commerçant partenaire</h1>
                    <p className="register-subtitle">
                        Rejoignez le réseau CREALIS et bénéficiez de tous nos services
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="form-section">
                        <div className="section-title">
                            <span className="section-icon">👤</span>
                            <span>Informations personnelles</span>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Prénom *</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    className="form-input"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nom *</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    className="form-input"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Téléphone *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+226 XX XX XX XX"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Mot de passe *</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirmer mot de passe *</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="form-input"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="section-title">
                            <span className="section-icon">🏪</span>
                            <span>Informations professionnelles</span>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nom de l'enseigne *</label>
                            <input
                                type="text"
                                name="businessName"
                                className="form-input"
                                value={formData.businessName}
                                onChange={handleChange}
                                placeholder="Ex: Supermarché DAMAS"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Type d'activité *</label>
                                <select
                                    name="businessType"
                                    className="form-select"
                                    value={formData.businessType}
                                    onChange={handleChange}
                                    required
                                >
                                    {businessTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.icon} {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ville *</label>
                                <select
                                    name="city"
                                    className="form-select"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                >
                                    {cities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Adresse</label>
                            <textarea
                                name="address"
                                className="form-textarea"
                                rows="2"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Adresse complète du commerce"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Numéro d'enregistrement (RCCM)</label>
                            <input
                                type="text"
                                name="registrationNumber"
                                className="form-input"
                                value={formData.registrationNumber}
                                onChange={handleChange}
                                placeholder="Optionnel"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="agreeTerms"
                                    checked={formData.agreeTerms}
                                    onChange={handleChange}
                                    required
                                />
                                <span>
                                    J'accepte les <a href="#" className="terms-link">conditions générales d'utilisation</a>
                                    et la <a href="#" className="terms-link">politique de confidentialité</a>
                                </span>
                            </label>
                        </div>

                        <div className="info-box">
                            <div className="info-icon">✨</div>
                            <div className="info-content">
                                <strong>Pourquoi devenir partenaire CREALIS ?</strong>
                                <ul>
                                    <li>✓ Programme de fidélité intégré</li>
                                    <li>✓ Terminal de paiement Z108 offert</li>
                                    <li>✓ Commission compétitive</li>
                                    <li>✓ Support 24/7</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="register-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="btn-spinner"></span>
                        ) : (
                            <>
                                <span>📝</span>
                                <span>Créer mon compte commerçant</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="register-footer">
                    <p>
                        Vous avez déjà un compte ?
                        <Link to="/login" className="login-link"> Se connecter</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default MerchantRegister;
