// frontend-web/src/pages/AdminSettings.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import toast from 'react-hot-toast';
import LoginLogs from '../components/LoginLogs';

function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({
        general: {
            company_name: '',
            company_logo: '',
            company_email: '',
            company_phone: '',
            company_address: '',
            currency: 'FCFA',
            timezone: 'Africa/Ouagadougou',
            date_format: 'DD/MM/YYYY',
            language: 'fr'
        },
        loyalty: {
            points_per_100_fcfa: 1,
            min_redeem: 100,
            cashback_rate: 10,
            points_expiry_days: 365,
            welcome_points: 100,
            birthday_points: 200,
            referral_points: 50,
            vip_thresholds: {
                silver: 1000,
                gold: 5000,
                platinum: 10000
            }
        },
        payment: {
            orange_money_enabled: true,
            wave_enabled: true,
            moov_money_enabled: false,
            telecel_money_enabled: false,
            commission_rate: 1.5,
            settlement_delay: 2,
            min_withdrawal: 1000,
            max_withdrawal: 500000,
            withdrawal_fee: 100
        },
        notifications: {
            email_alerts: true,
            sms_alerts: false,
            push_notifications: true,
            daily_report: true,
            weekly_report: false,
            monthly_report: true,
            low_stock_alert: true,
            promotion_alert: true
        },
        security: {
            two_factor_auth: false,
            session_timeout: 30,
            max_login_attempts: 5,
            password_expiry_days: 90,
            ip_whitelist: ''
        },
        livraison: {
            prix_par_km: 200,
            distance_max: 20,
            frais_min: 500,
            frais_max: 5000,
            frais_fixes: 300,          // Nouveau
            commande_min: 2000,
            delai_livraison: 45,
            delai_express: 20,         // Nouveau
            supplement_express: 1000,  // Nouveau
            zones_couvertes: 'Ouagadougou, Bobo-Dioulasso, Koudougou',
            livraison_gratuite_des: 50000,
            heure_debut: '08:00',      // Nouveau
            heure_fin: '20:00',        // Nouveau
            jours_livraison: 'Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi', // Nouveau
            sans_contact: false,       // Nouveau
            suivi_temps_reel: false,   // Nouveau
            pourboire_enabled: false   // Nouveau
        },
        appearance: {
            theme: 'light',
            primary_color: '#2563eb',
            sidebar_collapsed: false,
            animations_enabled: true,
            compact_mode: false
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            const data = response.data;

            setSettings({
                general: {
                    company_name: data.company_name || '',
                    company_logo: data.company_logo || '',
                    company_email: data.company_email || '',
                    company_phone: data.company_phone || '',
                    company_address: data.company_address || '',
                    currency: data.currency || 'FCFA',
                    timezone: data.timezone || 'Africa/Ouagadougou',
                    date_format: data.date_format || 'DD/MM/YYYY',
                    language: data.language || 'fr'
                },
                loyalty: {
                    points_per_100_fcfa: data.points_per_100_fcfa ?? 1,
                    min_redeem: data.min_redeem ?? 100,
                    cashback_rate: data.cashback_rate ?? 10,
                    points_expiry_days: data.points_expiry_days ?? 365,
                    welcome_points: data.welcome_points ?? 100,
                    birthday_points: data.birthday_points ?? 200,
                    referral_points: data.referral_points ?? 50,
                    vip_thresholds: data.vip_thresholds || { silver: 1000, gold: 5000, platinum: 10000 }
                },
                payment: {
                    orange_money_enabled: data.orange_money_enabled ?? true,
                    wave_enabled: data.wave_enabled ?? true,
                    moov_money_enabled: data.moov_money_enabled ?? false,
                    telecel_money_enabled: data.telecel_money_enabled ?? false,
                    commission_rate: data.commission_rate ?? 1.5,
                    settlement_delay: data.settlement_delay ?? 2,
                    min_withdrawal: data.min_withdrawal ?? 1000,
                    max_withdrawal: data.max_withdrawal ?? 500000,
                    withdrawal_fee: data.withdrawal_fee ?? 100
                },
                notifications: {
                    email_alerts: data.email_alerts ?? true,
                    sms_alerts: data.sms_alerts ?? false,
                    push_notifications: data.push_notifications ?? true,
                    daily_report: data.daily_report ?? true,
                    weekly_report: data.weekly_report ?? false,
                    monthly_report: data.monthly_report ?? true,
                    low_stock_alert: data.low_stock_alert ?? true,
                    promotion_alert: data.promotion_alert ?? true
                },
                security: {
                    two_factor_auth: data.two_factor_auth ?? false,
                    session_timeout: data.session_timeout ?? 30,
                    max_login_attempts: data.max_login_attempts ?? 5,
                    password_expiry_days: data.password_expiry_days ?? 90,
                    ip_whitelist: data.ip_whitelist || ''
                },
                livraison: {
                    prix_par_km: data.prix_par_km ? parseFloat(data.prix_par_km) : 200,
                    distance_max: data.distance_max ? parseFloat(data.distance_max) : 20,
                    frais_min: data.frais_min ? parseFloat(data.frais_min) : 500,
                    frais_max: data.frais_max ? parseFloat(data.frais_max) : 5000,
                    frais_fixes: data.frais_fixes ? parseFloat(data.frais_fixes) : 300, // Nouveau
                    commande_min: data.commande_min ? parseFloat(data.commande_min) : 2000,
                    delai_livraison: data.delai_livraison ? parseFloat(data.delai_livraison) : 45,
                    delai_express: data.delai_express ? parseFloat(data.delai_express) : 20, // Nouveau
                    supplement_express: data.supplement_express ? parseFloat(data.supplement_express) : 1000, // Nouveau
                    zones_couvertes: data.zones_couvertes || 'Ouagadougou, Bobo-Dioulasso, Koudougou',
                    livraison_gratuite_des: data.livraison_gratuite_des ? parseFloat(data.livraison_gratuite_des) : 50000,
                    heure_debut: data.heure_debut || '08:00', // Nouveau
                    heure_fin: data.heure_fin || '20:00', // Nouveau
                    jours_livraison: data.jours_livraison || 'Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi', // Nouveau
                    sans_contact: data.sans_contact === true || data.sans_contact === 'true', // Nouveau
                    suivi_temps_reel: data.suivi_temps_reel === true || data.suivi_temps_reel === 'true', // Nouveau
                    pourboire_enabled: data.pourboire_enabled === true || data.pourboire_enabled === 'true' // Nouveau
                },

                appearance: {
                    theme: data.theme || 'light',
                    primary_color: data.primary_color || '#2563eb',
                    sidebar_collapsed: data.sidebar_collapsed ?? false,
                    animations_enabled: data.animations_enabled ?? true,
                    compact_mode: data.compact_mode ?? false
                }
            });
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Erreur lors du chargement des paramètres');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const settingsToSave = {
                // Général
                company_name: settings.general.company_name,
                company_logo: settings.general.company_logo,
                company_email: settings.general.company_email,
                company_phone: settings.general.company_phone,
                company_address: settings.general.company_address,
                currency: settings.general.currency,
                timezone: settings.general.timezone,
                date_format: settings.general.date_format,
                language: settings.general.language,

                // Fidélité
                points_per_100_fcfa: settings.loyalty.points_per_100_fcfa,
                min_redeem: settings.loyalty.min_redeem,
                cashback_rate: settings.loyalty.cashback_rate,
                points_expiry_days: settings.loyalty.points_expiry_days,
                welcome_points: settings.loyalty.welcome_points,
                birthday_points: settings.loyalty.birthday_points,
                referral_points: settings.loyalty.referral_points,
                vip_thresholds: JSON.stringify(settings.loyalty.vip_thresholds),

                // Paiements
                orange_money_enabled: settings.payment.orange_money_enabled,
                wave_enabled: settings.payment.wave_enabled,
                moov_money_enabled: settings.payment.moov_money_enabled,
                telecel_money_enabled: settings.payment.telecel_money_enabled,
                commission_rate: settings.payment.commission_rate,
                settlement_delay: settings.payment.settlement_delay,
                min_withdrawal: settings.payment.min_withdrawal,
                max_withdrawal: settings.payment.max_withdrawal,
                withdrawal_fee: settings.payment.withdrawal_fee,

                // 📦 LIVRAISON - Champs mis à jour
                prix_par_km: settings.livraison.prix_par_km,
                distance_max: settings.livraison.distance_max,
                frais_min: settings.livraison.frais_min,
                frais_max: settings.livraison.frais_max,
                frais_fixes: settings.livraison.frais_fixes,          // Nouveau
                commande_min: settings.livraison.commande_min,
                delai_livraison: settings.livraison.delai_livraison,
                delai_express: settings.livraison.delai_express,      // Nouveau
                supplement_express: settings.livraison.supplement_express, // Nouveau
                zones_couvertes: settings.livraison.zones_couvertes,
                livraison_gratuite_des: settings.livraison.livraison_gratuite_des,
                heure_debut: settings.livraison.heure_debut,          // Nouveau
                heure_fin: settings.livraison.heure_fin,              // Nouveau
                jours_livraison: settings.livraison.jours_livraison,  // Nouveau
                sans_contact: settings.livraison.sans_contact,        // Nouveau
                suivi_temps_reel: settings.livraison.suivi_temps_reel, // Nouveau
                pourboire_enabled: settings.livraison.pourboire_enabled, // Nouveau

                // Notifications
                email_alerts: settings.notifications.email_alerts,
                sms_alerts: settings.notifications.sms_alerts,
                push_notifications: settings.notifications.push_notifications,
                daily_report: settings.notifications.daily_report,
                weekly_report: settings.notifications.weekly_report,
                monthly_report: settings.notifications.monthly_report,
                low_stock_alert: settings.notifications.low_stock_alert,
                promotion_alert: settings.notifications.promotion_alert,

                // Sécurité
                two_factor_auth: settings.security.two_factor_auth,
                session_timeout: settings.security.session_timeout,
                max_login_attempts: settings.security.max_login_attempts,
                password_expiry_days: settings.security.password_expiry_days,
                ip_whitelist: settings.security.ip_whitelist,

                // Apparence
                theme: settings.appearance.theme,
                primary_color: settings.appearance.primary_color,
                sidebar_collapsed: settings.appearance.sidebar_collapsed,
                animations_enabled: settings.appearance.animations_enabled,
                compact_mode: settings.appearance.compact_mode
            };

            await api.post('/settings/batch', settingsToSave);
            toast.success('Paramètres enregistrés avec succès');
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Erreur lors de l\'enregistrement');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'Général', icon: '⚙️', description: 'Informations générales de la plateforme' },
        { id: 'loyalty', label: 'Fidélité', icon: '⭐', description: 'Configuration du système de fidélité' },
        { id: 'payment', label: 'Paiements', icon: '💳', description: 'Moyens de paiement et commissions' },
        { id: 'delivery', label: '🚚 Livraison', icon: '🚚', description: 'Paramètres de livraison' },
        { id: 'notifications', label: 'Notifications', icon: '🔔', description: 'Alertes et notifications' },
        { id: 'security', label: 'Sécurité', icon: '🔒', description: 'Paramètres de sécurité' },
        { id: 'appearance', label: 'Apparence', icon: '🎨', description: 'Personnalisation de l\'interface' },
        { id: 'login-logs', label: '📋 Logs de connexion', icon: '📋', description: 'Historique des connexions' }
    ];

    if (loading) {
        return (
            <>
                <div className="spinner-container"><div className="spinner"></div></div>
            </>
        );
    }

        return (
        <>
            <div className="settings-container-modern">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">⚙️ Paramètres</h1>
                        <p className="page-subtitle">Configurez votre plateforme CREALIS MARKET</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Enregistrement...' : '💾 Enregistrer'}
                    </button>
                </div>

                <div className="settings-layout">
                    {/* Sidebar */}
                    <div className="settings-sidebar-modern">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`settings-tab-modern ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <div className="tab-icon">{tab.icon}</div>
                                <div className="tab-content">
                                    <div className="tab-label">{tab.label}</div>
                                    <div className="tab-description">{tab.description}</div>
                                </div>
                                {activeTab === tab.id && <div className="tab-active-indicator"></div>}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="settings-content-modern">
                        {/* Général */}
                        {activeTab === 'general' && (
                            <div className="settings-section-modern">
                                <div className="section-header">
                                    <h2>Informations générales</h2>
                                    <p>Configurez les informations de base de votre plateforme</p>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label className="form-label">Nom de la société</label>
                                        <input type="text" className="form-input" value={settings.general.company_name} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, company_name: e.target.value } })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email de contact</label>
                                        <input type="email" className="form-input" value={settings.general.company_email} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, company_email: e.target.value } })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Téléphone</label>
                                        <input type="tel" className="form-input" value={settings.general.company_phone} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, company_phone: e.target.value } })} />
                                    </div>
                                    <div className="form-group full-width">
                                        <label className="form-label">Adresse</label>
                                        <textarea className="form-textarea" rows="2" value={settings.general.company_address} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, company_address: e.target.value } })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Devise</label>
                                        <select className="form-select" value={settings.general.currency} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, currency: e.target.value } })}>
                                            <option value="FCFA">FCFA - Franc CFA</option>
                                            <option value="XOF">XOF - Franc CFA (ISO)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Fuseau horaire</label>
                                        <select className="form-select" value={settings.general.timezone} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, timezone: e.target.value } })}>
                                            <option value="Africa/Ouagadougou">Africa/Ouagadougou</option>
                                            <option value="Africa/Abidjan">Africa/Abidjan</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Format de date</label>
                                        <select className="form-select" value={settings.general.date_format} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, date_format: e.target.value } })}>
                                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Langue</label>
                                        <select className="form-select" value={settings.general.language} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, language: e.target.value } })}>
                                            <option value="fr">Français</option>
                                            <option value="en">English</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Fidélité */}
                        {activeTab === 'loyalty' && (
                            <div className="settings-section-modern">
                                <div className="section-header">
                                    <h2>Système de fidélité</h2>
                                    <p>Configurez les règles de points et récompenses</p>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Points par 100 FCFA</label>
                                        <input type="number" className="form-input" value={settings.loyalty.points_per_100_fcfa} onChange={(e) => setSettings({ ...settings, loyalty: { ...settings.loyalty, points_per_100_fcfa: parseInt(e.target.value) } })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Minimum pour cashback</label>
                                        <input type="number" className="form-input" value={settings.loyalty.min_redeem} onChange={(e) => setSettings({ ...settings, loyalty: { ...settings.loyalty, min_redeem: parseInt(e.target.value) } })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Taux de cashback (%)</label>
                                        <input type="number" step="0.5" className="form-input" value={settings.loyalty.cashback_rate} onChange={(e) => setSettings({ ...settings, loyalty: { ...settings.loyalty, cashback_rate: parseFloat(e.target.value) } })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Points de bienvenue</label>
                                        <input type="number" className="form-input" value={settings.loyalty.welcome_points} onChange={(e) => setSettings({ ...settings, loyalty: { ...settings.loyalty, welcome_points: parseInt(e.target.value) } })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Points anniversaire</label>
                                        <input type="number" className="form-input" value={settings.loyalty.birthday_points} onChange={(e) => setSettings({ ...settings, loyalty: { ...settings.loyalty, birthday_points: parseInt(e.target.value) } })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Points parrainage</label>
                                        <input type="number" className="form-input" value={settings.loyalty.referral_points} onChange={(e) => setSettings({ ...settings, loyalty: { ...settings.loyalty, referral_points: parseInt(e.target.value) } })} />
                                    </div>
                                </div>
                                <div className="subsection">
                                    <h3>Seuils VIP</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Silver (points)</label>
                                            <input type="number" className="form-input" value={settings.loyalty.vip_thresholds.silver} onChange={(e) => setSettings({ ...settings, loyalty: { ...settings.loyalty, vip_thresholds: { ...settings.loyalty.vip_thresholds, silver: parseInt(e.target.value) } } })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Gold (points)</label>
                                            <input type="number" className="form-input" value={settings.loyalty.vip_thresholds.gold} onChange={(e) => setSettings({ ...settings, loyalty: { ...settings.loyalty, vip_thresholds: { ...settings.loyalty.vip_thresholds, gold: parseInt(e.target.value) } } })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Platinum (points)</label>
                                            <input type="number" className="form-input" value={settings.loyalty.vip_thresholds.platinum} onChange={(e) => setSettings({ ...settings, loyalty: { ...settings.loyalty, vip_thresholds: { ...settings.loyalty.vip_thresholds, platinum: parseInt(e.target.value) } } })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Paiements */}
                        {activeTab === 'payment' && (
                            <div className="settings-section-modern">
                                <div className="section-header">
                                    <h2>Moyens de paiement</h2>
                                    <p>Configurez les méthodes de paiement acceptées</p>
                                </div>
                                <div className="payment-methods-grid">
                                    <label className="payment-method-card">
                                        <input type="checkbox" checked={settings.payment.orange_money_enabled === true || settings.payment.orange_money_enabled === 'true'} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, orange_money_enabled: e.target.checked } })} />
                                        <div className="payment-method-icon">📱</div>
                                        <div className="payment-method-name">Orange Money</div>
                                    </label>
                                    <label className="payment-method-card">
                                        <input type="checkbox" checked={settings.payment.wave_enabled === true || settings.payment.wave_enabled === 'true'} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, wave_enabled: e.target.checked } })} />
                                        <div className="payment-method-icon">🌊</div>
                                        <div className="payment-method-name">Wave</div>
                                    </label>
                                    <label className="payment-method-card">
                                        <input type="checkbox" checked={settings.payment.moov_money_enabled === true || settings.payment.moov_money_enabled === 'true'} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, moov_money_enabled: e.target.checked } })} />
                                        <div className="payment-method-icon">📱</div>
                                        <div className="payment-method-name">Moov Money</div>
                                    </label>
                                    <label className="payment-method-card">
                                        <input type="checkbox" checked={settings.payment.telecel_money_enabled === true || settings.payment.telecel_money_enabled === 'true'} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, telecel_money_enabled: e.target.checked } })} />
                                        <div className="payment-method-icon">📱</div>
                                        <div className="payment-method-name">Telecel Money</div>
                                    </label>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Commission (%)</label>
                                        <input type="number" step="0.1" className="form-input" value={settings.payment.commission_rate} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, commission_rate: parseFloat(e.target.value) } })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Délai de règlement (jours)</label>
                                        <input type="number" className="form-input" value={settings.payment.settlement_delay} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, settlement_delay: parseInt(e.target.value) } })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Retrait minimum (FCFA)</label>
                                        <input type="number" className="form-input" value={settings.payment.min_withdrawal} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, min_withdrawal: parseInt(e.target.value) } })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Retrait maximum (FCFA)</label>
                                        <input type="number" className="form-input" value={settings.payment.max_withdrawal} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, max_withdrawal: parseInt(e.target.value) } })} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 🚚 LIVRAISON */}
                        {activeTab === 'delivery' && (
                            <div className="settings-section-modern">
                                <div className="section-header">
                                    <h2>🚚 Gestion des livraisons</h2>
                                    <p>Configurez les paramètres avancés de livraison pour vos clients</p>
                                </div>
                                <div className="settings-subsection">
                                    <h3 className="subsection-title-modern"><span className="subsection-icon-modern">💰</span> Tarification des livraisons</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Frais fixes de livraison <span className="label-badge-settings">Recommandé</span></label>
                                            <div className="input-with-suffix">
                                                <input type="number" className="form-input" min="0" step="100" value={settings.livraison?.frais_fixes || 300} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, frais_fixes: parseInt(e.target.value) || 0 } })} />
                                                <span className="input-suffix">FCFA</span>
                                            </div>
                                            <small className="form-hint">Montant fixe ajouté à chaque livraison</small>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Prix par kilomètre <span className="field-required">*</span></label>
                                            <div className="input-with-suffix">
                                                <input type="number" className="form-input" min="0" step="50" value={settings.livraison?.prix_par_km || 200} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, prix_par_km: parseInt(e.target.value) || 0 } })} />
                                                <span className="input-suffix">FCFA/km</span>
                                            </div>
                                            <small className="form-hint">Tarif par kilomètre parcouru</small>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Distance maximale <span className="field-required">*</span></label>
                                            <div className="input-with-suffix">
                                                <input type="number" className="form-input" min="1" step="5" value={settings.livraison?.distance_max || 20} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, distance_max: parseInt(e.target.value) || 20 } })} />
                                                <span className="input-suffix">km</span>
                                            </div>
                                            <small className="form-hint">Au-delà, la livraison est indisponible</small>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Frais minimum</label>
                                            <div className="input-with-suffix">
                                                <input type="number" className="form-input" min="0" step="100" value={settings.livraison?.frais_min || 500} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, frais_min: parseInt(e.target.value) || 0 } })} />
                                                <span className="input-suffix">FCFA</span>
                                            </div>
                                            <small className="form-hint">Montant minimum garanti</small>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Frais maximum</label>
                                            <div className="input-with-suffix">
                                                <input type="number" className="form-input" min="0" step="100" value={settings.livraison?.frais_max || 5000} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, frais_max: parseInt(e.target.value) || 0 } })} />
                                                <span className="input-suffix">FCFA</span>
                                            </div>
                                            <small className="form-hint">Montant maximum plafonné</small>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Commande minimum pour livraison</label>
                                            <div className="input-with-suffix">
                                                <input type="number" className="form-input" min="0" step="500" value={settings.livraison?.commande_min || 2000} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, commande_min: parseInt(e.target.value) || 0 } })} />
                                                <span className="input-suffix">FCFA</span>
                                            </div>
                                            <small className="form-hint">Montant minimum du panier</small>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Supplément livraison express <span className="label-badge-settings">Optionnel</span></label>
                                            <div className="input-with-suffix">
                                                <input type="number" className="form-input" min="0" step="100" value={settings.livraison?.supplement_express || 1000} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, supplement_express: parseInt(e.target.value) || 0 } })} />
                                                <span className="input-suffix">FCFA</span>
                                            </div>
                                            <small className="form-hint">Coût additionnel pour livraison express</small>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Livraison gratuite à partir de <span className="label-badge-settings label-badge-marketing">Marketing</span></label>
                                            <div className="input-with-suffix">
                                                <input type="number" className="form-input" min="0" step="1000" value={settings.livraison?.livraison_gratuite_des || 50000} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, livraison_gratuite_des: parseInt(e.target.value) || 0 } })} />
                                                <span className="input-suffix">FCFA</span>
                                            </div>
                                            <small className="form-hint">0 FCFA = pas de livraison gratuite</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="settings-subsection">
                                    <h3 className="subsection-title-modern"><span className="subsection-icon-modern">⏱️</span> Délais et créneaux horaires</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Délai standard</label>
                                            <div className="input-with-suffix">
                                                <input type="number" className="form-input" min="5" step="5" value={settings.livraison?.delai_livraison || 45} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, delai_livraison: parseInt(e.target.value) || 45 } })} />
                                                <span className="input-suffix">minutes</span>
                                            </div>
                                            <small className="form-hint">Délai estimé standard</small>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Délai express</label>
                                            <div className="input-with-suffix">
                                                <input type="number" className="form-input" min="5" step="5" value={settings.livraison?.delai_express || 20} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, delai_express: parseInt(e.target.value) || 20 } })} />
                                                <span className="input-suffix">minutes</span>
                                            </div>
                                            <small className="form-hint">Délai pour livraison express</small>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Heure d'ouverture</label>
                                            <input type="time" className="form-input" value={settings.livraison?.heure_debut || '08:00'} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, heure_debut: e.target.value } })} />
                                            <small className="form-hint">Début des livraisons</small>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Heure de fermeture</label>
                                            <input type="time" className="form-input" value={settings.livraison?.heure_fin || '20:00'} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, heure_fin: e.target.value } })} />
                                            <small className="form-hint">Fin des livraisons</small>
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ marginTop: '16px' }}>
                                        <label className="form-label">Jours de livraison</label>
                                        <div className="days-selector-modern">
                                            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((jour) => {
                                                const joursLivraison = settings.livraison?.jours_livraison || 'Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi';
                                                const isSelected = joursLivraison.split(',').includes(jour);
                                                return (
                                                    <button key={jour} className={`day-btn-modern ${isSelected ? 'active' : ''}`} onClick={() => {
                                                        const jours = joursLivraison.split(',').filter(j => j.trim());
                                                        const newJours = isSelected ? jours.filter(j => j !== jour) : [...jours, jour];
                                                        setSettings({ ...settings, livraison: { ...settings.livraison, jours_livraison: newJours.join(',') } });
                                                    }}>
                                                        {jour.substring(0, 3)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <small className="form-hint">Jours où la livraison est disponible</small>
                                    </div>
                                </div>
                                <div className="settings-subsection">
                                    <h3 className="subsection-title-modern"><span className="subsection-icon-modern">📍</span> Zones de couverture</h3>
                                    <div className="form-group">
                                        <label className="form-label">Zones couvertes <span className="label-badge-settings">Important</span></label>
                                        <textarea className="form-textarea" rows="3" value={settings.livraison?.zones_couvertes || 'Ouagadougou, Bobo-Dioulasso, Koudougou'} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, zones_couvertes: e.target.value } })} placeholder="Ville 1, Ville 2, Quartier 3..." />
                                        <small className="form-hint">Liste des zones desservies, séparées par des virgules</small>
                                    </div>
                                </div>
                                <div className="settings-subsection">
                                    <h3 className="subsection-title-modern"><span className="subsection-icon-modern">⚙️</span> Options avancées</h3>
                                    <div className="notifications-list">
                                        <label className="notification-item">
                                            <div className="notification-info">
                                                <div className="notification-title">Livraison sans contact</div>
                                                <div className="notification-desc">Permettre la livraison sans contact physique</div>
                                            </div>
                                            <div className="toggle-switch">
                                                <input type="checkbox" checked={settings.livraison?.sans_contact === true} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, sans_contact: e.target.checked } })} />
                                                <span className="toggle-slider"></span>
                                            </div>
                                        </label>
                                        <label className="notification-item">
                                            <div className="notification-info">
                                                <div className="notification-title">Suivi en temps réel</div>
                                                <div className="notification-desc">Permettre le suivi GPS des livreurs</div>
                                            </div>
                                            <div className="toggle-switch">
                                                <input type="checkbox" checked={settings.livraison?.suivi_temps_reel === true} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, suivi_temps_reel: e.target.checked } })} />
                                                <span className="toggle-slider"></span>
                                            </div>
                                        </label>
                                        <label className="notification-item">
                                            <div className="notification-info">
                                                <div className="notification-title">Pourboire livreur</div>
                                                <div className="notification-desc">Permettre l'ajout d'un pourboire au livreur</div>
                                            </div>
                                            <div className="toggle-switch">
                                                <input type="checkbox" checked={settings.livraison?.pourboire_enabled === true} onChange={(e) => setSettings({ ...settings, livraison: { ...settings.livraison, pourboire_enabled: e.target.checked } })} />
                                                <span className="toggle-slider"></span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                <div className="delivery-summary-modern">
                                    <div className="summary-header-modern">
                                        <span className="summary-title-modern">📊 Simulation des frais de livraison</span>
                                        <span className="summary-badge-modern">Calcul automatique</span>
                                    </div>
                                    <div className="summary-grid-modern">
                                        <div className="summary-item-modern">
                                            <span className="summary-label-modern">Petite course (1 km)</span>
                                            <span className="summary-value-modern">{Math.max((settings.livraison?.frais_fixes || 0) + (settings.livraison?.prix_par_km || 200) * 1, settings.livraison?.frais_min || 500).toLocaleString()} FCFA</span>
                                            <div className="summary-bar-modern" style={{ width: '20%' }}></div>
                                        </div>
                                        <div className="summary-item-modern">
                                            <span className="summary-label-modern">Course moyenne (5 km)</span>
                                            <span className="summary-value-modern">{Math.min(Math.max((settings.livraison?.frais_fixes || 0) + (settings.livraison?.prix_par_km || 200) * 5, settings.livraison?.frais_min || 500), settings.livraison?.frais_max || 5000).toLocaleString()} FCFA</span>
                                            <div className="summary-bar-modern" style={{ width: '50%' }}></div>
                                        </div>
                                        <div className="summary-item-modern">
                                            <span className="summary-label-modern">Longue course (10 km)</span>
                                            <span className="summary-value-modern">{Math.min(Math.max((settings.livraison?.frais_fixes || 0) + (settings.livraison?.prix_par_km || 200) * 10, settings.livraison?.frais_min || 500), settings.livraison?.frais_max || 5000).toLocaleString()} FCFA</span>
                                            <div className="summary-bar-modern" style={{ width: '80%' }}></div>
                                        </div>
                                        <div className="summary-item-modern">
                                            <span className="summary-label-modern">Express (5 km)</span>
                                            <span className="summary-value-modern summary-express">{(Math.min(Math.max((settings.livraison?.frais_fixes || 0) + (settings.livraison?.prix_par_km || 200) * 5, settings.livraison?.frais_min || 500), settings.livraison?.frais_max || 5000) + (settings.livraison?.supplement_express || 1000)).toLocaleString()} FCFA</span>
                                            <span className="express-tag-modern">⚡ Express</span>
                                        </div>
                                    </div>
                                    {settings.livraison?.livraison_gratuite_des > 0 && (
                                        <div className="summary-free-modern">
                                            <span className="free-icon-modern">🎁</span>
                                            <span>Livraison gratuite dès {settings.livraison?.livraison_gratuite_des?.toLocaleString()} FCFA d'achat</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Notifications */}
                        {activeTab === 'notifications' && (
                            <div className="settings-section-modern">
                                <div className="section-header">
                                    <h2>Alertes et notifications</h2>
                                    <p>Configurez vos préférences de notification</p>
                                </div>
                                <div className="notifications-list">
                                    <label className="notification-item">
                                        <div className="notification-info">
                                            <div className="notification-title">Alertes email</div>
                                            <div className="notification-desc">Recevoir des notifications par email</div>
                                        </div>
                                        <div className="toggle-switch">
                                            <input type="checkbox" checked={settings.notifications.email_alerts === true || settings.notifications.email_alerts === 'true'} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, email_alerts: e.target.checked } })} />
                                            <span className="toggle-slider"></span>
                                        </div>
                                    </label>
                                    <label className="notification-item">
                                        <div className="notification-info">
                                            <div className="notification-title">Rapport quotidien</div>
                                            <div className="notification-desc">Recevoir un résumé quotidien par email</div>
                                        </div>
                                        <div className="toggle-switch">
                                            <input type="checkbox" checked={settings.notifications.daily_report === true || settings.notifications.daily_report === 'true'} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, daily_report: e.target.checked } })} />
                                            <span className="toggle-slider"></span>
                                        </div>
                                    </label>
                                    <label className="notification-item">
                                        <div className="notification-info">
                                            <div className="notification-title">Rapport mensuel</div>
                                            <div className="notification-desc">Recevoir un rapport mensuel détaillé</div>
                                        </div>
                                        <div className="toggle-switch">
                                            <input type="checkbox" checked={settings.notifications.monthly_report === true || settings.notifications.monthly_report === 'true'} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, monthly_report: e.target.checked } })} />
                                            <span className="toggle-slider"></span>
                                        </div>
                                    </label>
                                    <label className="notification-item">
                                        <div className="notification-info">
                                            <div className="notification-title">Alerte stock faible</div>
                                            <div className="notification-desc">Notification quand un produit atteint son seuil</div>
                                        </div>
                                        <div className="toggle-switch">
                                            <input type="checkbox" checked={settings.notifications.low_stock_alert === true || settings.notifications.low_stock_alert === 'true'} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, low_stock_alert: e.target.checked } })} />
                                            <span className="toggle-slider"></span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Sécurité */}
                        {activeTab === 'security' && (
                            <div className="settings-section-modern">
                                <div className="section-header">
                                    <h2>Sécurité</h2>
                                    <p>Configurez les paramètres de sécurité de la plateforme</p>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Timeout session (minutes)</label>
                                        <input type="number" className="form-input" value={settings.security.session_timeout} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, session_timeout: parseInt(e.target.value) } })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tentatives max de connexion</label>
                                        <input type="number" className="form-input" value={settings.security.max_login_attempts} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, max_login_attempts: parseInt(e.target.value) } })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Expiration mot de passe (jours)</label>
                                        <input type="number" className="form-input" value={settings.security.password_expiry_days} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, password_expiry_days: parseInt(e.target.value) } })} />
                                    </div>
                                    <div className="form-group full-width">
                                        <label className="form-label">Liste blanche IP (une par ligne)</label>
                                        <textarea className="form-textarea" rows="3" value={settings.security.ip_whitelist} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, ip_whitelist: e.target.value } })} placeholder="192.168.1.1&#10;10.0.0.1" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Apparence */}
                        {activeTab === 'appearance' && (
                            <div className="settings-section-modern">
                                <div className="section-header">
                                    <h2>Apparence</h2>
                                    <p>Personnalisez l'apparence de l'interface</p>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Thème</label>
                                    <div className="theme-selector">
                                        <button className={`theme-option ${settings.appearance.theme === 'light' ? 'active' : ''}`} onClick={() => setSettings({ ...settings, appearance: { ...settings.appearance, theme: 'light' } })}>
                                            <div className="theme-preview light"></div>
                                            <span>Clair</span>
                                        </button>
                                        <button className={`theme-option ${settings.appearance.theme === 'dark' ? 'active' : ''}`} onClick={() => setSettings({ ...settings, appearance: { ...settings.appearance, theme: 'dark' } })}>
                                            <div className="theme-preview dark"></div>
                                            <span>Sombre</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Couleur principale</label>
                                    <div className="color-selector">
                                        <button className={`color-option ${settings.appearance.primary_color === '#2563eb' ? 'active' : ''}`} style={{ backgroundColor: '#2563eb' }} onClick={() => setSettings({ ...settings, appearance: { ...settings.appearance, primary_color: '#2563eb' } })} />
                                        <button className={`color-option ${settings.appearance.primary_color === '#10b981' ? 'active' : ''}`} style={{ backgroundColor: '#10b981' }} onClick={() => setSettings({ ...settings, appearance: { ...settings.appearance, primary_color: '#10b981' } })} />
                                        <button className={`color-option ${settings.appearance.primary_color === '#8b5cf6' ? 'active' : ''}`} style={{ backgroundColor: '#8b5cf6' }} onClick={() => setSettings({ ...settings, appearance: { ...settings.appearance, primary_color: '#8b5cf6' } })} />
                                        <button className={`color-option ${settings.appearance.primary_color === '#f59e0b' ? 'active' : ''}`} style={{ backgroundColor: '#f59e0b' }} onClick={() => setSettings({ ...settings, appearance: { ...settings.appearance, primary_color: '#f59e0b' } })} />
                                    </div>
                                </div>
                                <div className="notifications-list">
                                    <label className="notification-item">
                                        <div className="notification-info">
                                            <div className="notification-title">Animations</div>
                                            <div className="notification-desc">Activer les animations de l'interface</div>
                                        </div>
                                        <div className="toggle-switch">
                                            <input type="checkbox" checked={settings.appearance.animations_enabled === true || settings.appearance.animations_enabled === 'true'} onChange={(e) => setSettings({ ...settings, appearance: { ...settings.appearance, animations_enabled: e.target.checked } })} />
                                            <span className="toggle-slider"></span>
                                        </div>
                                    </label>
                                    <label className="notification-item">
                                        <div className="notification-info">
                                            <div className="notification-title">Mode compact</div>
                                            <div className="notification-desc">Afficher plus d'informations à l'écran</div>
                                        </div>
                                        <div className="toggle-switch">
                                            <input type="checkbox" checked={settings.appearance.compact_mode === true || settings.appearance.compact_mode === 'true'} onChange={(e) => setSettings({ ...settings, appearance: { ...settings.appearance, compact_mode: e.target.checked } })} />
                                            <span className="toggle-slider"></span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Logs de connexion */}
                        {activeTab === 'login-logs' && (
                            <div className="settings-section-modern">
                                <div className="section-header">
                                    <h2>📋 Logs de connexion</h2>
                                    <p>Historique complet des connexions à la plateforme</p>
                                </div>
                                <LoginLogs />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .settings-container-modern {
                    padding: 24px;
                    background: #f8fafc;
                    min-height: 100vh;
                }
                .settings-layout {
                    display: flex;
                    gap: 24px;
                    margin-top: 24px;
                }
                .settings-sidebar-modern {
                    width: 280px;
                    background: white;
                    border-radius: 16px;
                    overflow-y: auto;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .settings-tab-modern {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 20px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                    position: relative;
                }
                .settings-tab-modern:hover {
                    background: #f1f5f9;
                }
                .settings-tab-modern.active {
                    background: #e0e7ff;
                }
                .tab-icon {
                    font-size: 24px;
                }
                .tab-content {
                    flex: 1;
                }
                .tab-label {
                    font-weight: 600;
                    font-size: 14px;
                    color: #1e293b;
                }
                .tab-description {
                    font-size: 11px;
                    color: #64748b;
                    margin-top: 2px;
                }
                .tab-active-indicator {
                    position: absolute;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 3px;
                    height: 30px;
                    background: #3b82f6;
                    border-radius: 3px;
                }
                .settings-content-modern {
                    flex: 1;
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    overflow-y: auto;
                    max-height: calc(100vh - 150px);
                }
                .settings-section-modern {
                    animation: fadeIn 0.3s ease-out;
                }
                .section-header {
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .section-header h2 {
                    font-size: 20px;
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .section-header p {
                    font-size: 13px;
                    color: #64748b;
                }
                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                }
                .form-grid .full-width {
                    grid-column: span 2;
                }
                .subsection {
                    margin-top: 24px;
                    padding-top: 24px;
                    border-top: 1px solid #e2e8f0;
                }
                .subsection h3 {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 16px;
                }
                .payment-methods-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .payment-method-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 16px;
                    background: #f8fafc;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 2px solid transparent;
                }
                .payment-method-card:hover {
                    background: #f1f5f9;
                }
                .payment-method-card:has(input:checked) {
                    border-color: #3b82f6;
                    background: #e0e7ff;
                }
                .payment-method-card input {
                    display: none;
                }
                .payment-method-icon {
                    font-size: 32px;
                }
                .payment-method-name {
                    font-size: 12px;
                    font-weight: 500;
                }
                .notifications-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .notification-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: #f8fafc;
                    border-radius: 12px;
                    cursor: pointer;
                }
                .notification-item:hover {
                    background: #f1f5f9;
                }
                .notification-title {
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .notification-desc {
                    font-size: 12px;
                    color: #64748b;
                }
                .toggle-switch {
                    position: relative;
                    width: 50px;
                    height: 24px;
                }
                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #cbd5e1;
                    transition: 0.2s;
                    border-radius: 34px;
                }
                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: 0.2s;
                    border-radius: 50%;
                }
                input:checked + .toggle-slider {
                    background-color: #3b82f6;
                }
                input:checked + .toggle-slider:before {
                    transform: translateX(26px);
                }
                .theme-selector {
                    display: flex;
                    gap: 16px;
                }
                .theme-option {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 16px;
                    background: none;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .theme-option.active {
                    border-color: #3b82f6;
                    background: #e0e7ff;
                }
                .theme-preview {
                    width: 80px;
                    height: 60px;
                    border-radius: 8px;
                }
                .theme-preview.light {
                    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                    border: 1px solid #cbd5e1;
                }
                .theme-preview.dark {
                    background: linear-gradient(135deg, #1e293b, #0f172a);
                    border: 1px solid #334155;
                }
                .color-selector {
                    display: flex;
                    gap: 12px;
                }
                .color-option {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 2px solid transparent;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .color-option.active {
                    border-color: #1e293b;
                    box-shadow: 0 0 0 2px white, 0 0 0 4px #3b82f6;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (max-width: 768px) {
                    .settings-layout {
                        flex-direction: column;
                    }
                    .settings-sidebar-modern {
                        width: 100%;
                        display: flex;
                        overflow-x: auto;
                    }
                    .settings-tab-modern {
                        min-width: 200px;
                    }
                    .form-grid {
                        grid-template-columns: 1fr;
                    }
                    .form-grid .full-width {
                        grid-column: span 1;
                    }
                    .payment-methods-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                .input-with-suffix {
                    display: flex;
                    align-items: center;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    overflow: hidden;
                    background: white;
                    transition: all 0.2s;
                }
                .input-with-suffix:focus-within {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                .input-with-suffix .form-input {
                    border: none;
                    flex: 1;
                    padding: 8px 12px;
                    background: transparent;
                }
                .input-with-suffix .form-input:focus {
                    box-shadow: none;
                }
                .input-suffix {
                    padding: 8px 12px;
                    background: #f8fafc;
                    color: #64748b;
                    font-size: 0.75rem;
                    font-weight: 500;
                    border-left: 1px solid #e2e8f0;
                    white-space: nowrap;
                }
                .field-required {
                    color: #ef4444;
                    font-weight: 600;
                }
                .form-hint {
                    display: block;
                    font-size: 0.7rem;
                    color: #94a3b8;
                    margin-top: 4px;
                }
                .delivery-summary {
                    margin-top: 20px;
                    padding: 16px;
                    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
                    border-radius: 12px;
                    border: 1px solid #bbf7d0;
                }
                .summary-title {
                    font-weight: 600;
                    font-size: 14px;
                    color: #166534;
                    margin-bottom: 12px;
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 12px;
                }
                .summary-item {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .summary-label {
                    font-size: 11px;
                    color: #15803d;
                    font-weight: 500;
                }
                .summary-value {
                    font-size: 15px;
                    font-weight: 700;
                    color: #065f46;
                }
                @media (max-width: 768px) {
                    .summary-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `}</style>
        </>
    );
}

export default AdminSettings;