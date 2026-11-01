//frontend-web/src/pages/Settings.jsx
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useApp } from '../context/AppContext'
import toast from 'react-hot-toast'

function Settings() {
    const { settings: appSettings, updateSettings, reloadSettings } = useApp()
    const [activeTab, setActiveTab] = useState('general')
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        general: {
            company_name: '',
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
        appearance: {
            theme: 'light',
            primary_color: '#2563eb',
            sidebar_collapsed: false,
            animations_enabled: true,
            compact_mode: false
        }
    })

    // Charger les paramètres depuis le contexte
    useEffect(() => {
        if (appSettings) {
            setSettings({
                general: {
                    company_name: appSettings.company_name || '',
                    company_email: appSettings.company_email || '',
                    company_phone: appSettings.company_phone || '',
                    company_address: appSettings.company_address || '',
                    currency: appSettings.currency || 'FCFA',
                    timezone: appSettings.timezone || 'Africa/Ouagadougou',
                    date_format: appSettings.date_format || 'DD/MM/YYYY',
                    language: appSettings.language || 'fr'
                },
                loyalty: {
                    points_per_100_fcfa: appSettings.points_per_100_fcfa ?? 1,
                    min_redeem: appSettings.min_redeem ?? 100,
                    cashback_rate: appSettings.cashback_rate ?? 10,
                    points_expiry_days: appSettings.points_expiry_days ?? 365,
                    welcome_points: appSettings.welcome_points ?? 100,
                    birthday_points: appSettings.birthday_points ?? 200,
                    referral_points: appSettings.referral_points ?? 50,
                    vip_thresholds: {
                        silver: appSettings.vip_thresholds?.silver ?? 1000,
                        gold: appSettings.vip_thresholds?.gold ?? 5000,
                        platinum: appSettings.vip_thresholds?.platinum ?? 10000
                    }
                },
                payment: {
                    orange_money_enabled: appSettings.orange_money_enabled ?? true,
                    wave_enabled: appSettings.wave_enabled ?? true,
                    moov_money_enabled: appSettings.moov_money_enabled ?? false,
                    telecel_money_enabled: appSettings.telecel_money_enabled ?? false,
                    commission_rate: appSettings.commission_rate ?? 1.5,
                    settlement_delay: appSettings.settlement_delay ?? 2,
                    min_withdrawal: appSettings.min_withdrawal ?? 1000,
                    max_withdrawal: appSettings.max_withdrawal ?? 500000,
                    withdrawal_fee: appSettings.withdrawal_fee ?? 100
                },
                notifications: {
                    email_alerts: appSettings.email_alerts ?? true,
                    sms_alerts: appSettings.sms_alerts ?? false,
                    push_notifications: appSettings.push_notifications ?? true,
                    daily_report: appSettings.daily_report ?? true,
                    weekly_report: appSettings.weekly_report ?? false,
                    monthly_report: appSettings.monthly_report ?? true,
                    low_stock_alert: appSettings.low_stock_alert ?? true,
                    promotion_alert: appSettings.promotion_alert ?? true
                },
                security: {
                    two_factor_auth: appSettings.two_factor_auth ?? false,
                    session_timeout: appSettings.session_timeout ?? 30,
                    max_login_attempts: appSettings.max_login_attempts ?? 5,
                    password_expiry_days: appSettings.password_expiry_days ?? 90,
                    ip_whitelist: appSettings.ip_whitelist || ''
                },
                appearance: {
                    theme: appSettings.theme || 'light',
                    primary_color: appSettings.primary_color || '#2563eb',
                    sidebar_collapsed: appSettings.sidebar_collapsed ?? false,
                    animations_enabled: appSettings.animations_enabled ?? true,
                    compact_mode: appSettings.compact_mode ?? false
                }
            })
        }
    }, [appSettings])

    const handleSave = async () => {
        setSaving(true)
        try {
            // Préparer les données plates pour l'API
            const settingsToSave = {
                // Général
                company_name: settings.general.company_name,
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
            }

            const success = await updateSettings(settingsToSave)

            if (success) {
                toast.success('Paramètres enregistrés avec succès')
                await reloadSettings()
            } else {
                toast.error('Erreur lors de l\'enregistrement')
            }
        } catch (error) {
            console.error('Save error:', error)
            toast.error('Erreur lors de l\'enregistrement')
        } finally {
            setSaving(false)
        }
    }

    const tabs = [
        { id: 'general', label: 'Général', icon: '⚙️', description: 'Informations générales de la plateforme' },
        { id: 'loyalty', label: 'Fidélité', icon: '⭐', description: 'Configuration du système de fidélité' },
        { id: 'payment', label: 'Paiements', icon: '💳', description: 'Moyens de paiement et commissions' },
        { id: 'notifications', label: 'Notifications', icon: '🔔', description: 'Alertes et notifications' },
        { id: 'security', label: 'Sécurité', icon: '🔒', description: 'Paramètres de sécurité' },
        { id: 'appearance', label: 'Apparence', icon: '🎨', description: 'Personnalisation de l\'interface' }
    ]

    return (
        <Layout>
            <div className="settings-container-modern">
                {/* En-tête */}
                <div className="page-header">
                    <div className="page-header-content">
                        <div className="page-badge">
                            <span className="page-badge-icon">⚙️</span>
                            <span className="page-badge-text">Configuration</span>
                        </div>
                        <h1 className="page-title">Paramètres</h1>
                        <p className="page-subtitle">Configurez votre plateforme CREALIS MARKET</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <span className="spinner-small"></span>
                                <span>Enregistrement...</span>
                            </>
                        ) : (
                            <>
                                <span>💾</span>
                                <span>Enregistrer</span>
                            </>
                        )}
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
                        {activeTab === 'general' && (
                            <div className="settings-section-modern">
                                <div className="section-header">
                                    <h2>Informations générales</h2>
                                    <p>Configurez les informations de base de votre plateforme</p>
                                </div>

                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label className="form-label">Nom de la société</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={settings.general?.company_name || ''}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                general: { ...settings.general, company_name: e.target.value }
                                            })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Email de contact</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={settings.general?.company_email || ''}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                general: { ...settings.general, company_email: e.target.value }
                                            })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Téléphone</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={settings.general?.company_phone || ''}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                general: { ...settings.general, company_phone: e.target.value }
                                            })}
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label className="form-label">Adresse</label>
                                        <textarea
                                            className="form-textarea"
                                            rows="2"
                                            value={settings.general?.company_address || ''}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                general: { ...settings.general, company_address: e.target.value }
                                            })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Devise</label>
                                        <select
                                            className="form-select"
                                            value={settings.general?.currency || 'FCFA'}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                general: { ...settings.general, currency: e.target.value }
                                            })}
                                        >
                                            <option value="FCFA">FCFA - Franc CFA</option>
                                            <option value="XOF">XOF - Franc CFA (ISO)</option>
                                            <option value="EUR">EUR - Euro</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Fuseau horaire</label>
                                        <select
                                            className="form-select"
                                            value={settings.general?.timezone || 'Africa/Ouagadougou'}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                general: { ...settings.general, timezone: e.target.value }
                                            })}
                                        >
                                            <option value="Africa/Ouagadougou">Africa/Ouagadougou</option>
                                            <option value="Africa/Abidjan">Africa/Abidjan</option>
                                            <option value="Africa/Dakar">Africa/Dakar</option>
                                            <option value="Africa/Lagos">Africa/Lagos</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Format de date</label>
                                        <select
                                            className="form-select"
                                            value={settings.general?.date_format || 'DD/MM/YYYY'}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                general: { ...settings.general, date_format: e.target.value }
                                            })}
                                        >
                                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Langue</label>
                                        <select
                                            className="form-select"
                                            value={settings.general?.language || 'fr'}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                general: { ...settings.general, language: e.target.value }
                                            })}
                                        >
                                            <option value="fr">Français</option>
                                            <option value="en">English</option>
                                            <option value="ar">العربية</option>
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
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={settings.loyalty.points_per_100_fcfa}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                loyalty: { ...settings.loyalty, points_per_100_fcfa: parseInt(e.target.value) }
                                            })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Minimum pour cashback</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={settings.loyalty.min_redeem}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                loyalty: { ...settings.loyalty, min_redeem: parseInt(e.target.value) }
                                            })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Taux de cashback (%)</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            className="form-input"
                                            value={settings.loyalty.cashback_rate}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                loyalty: { ...settings.loyalty, cashback_rate: parseFloat(e.target.value) }
                                            })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Points de bienvenue</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={settings.loyalty.welcome_points}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                loyalty: { ...settings.loyalty, welcome_points: parseInt(e.target.value) }
                                            })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Points anniversaire</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={settings.loyalty.birthday_points}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                loyalty: { ...settings.loyalty, birthday_points: parseInt(e.target.value) }
                                            })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Points parrainage</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={settings.loyalty.referral_points}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                loyalty: { ...settings.loyalty, referral_points: parseInt(e.target.value) }
                                            })}
                                        />
                                    </div>
                                </div>

                                <div className="subsection">
                                    <h3>Seuils VIP</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Silver (points)</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={settings.loyalty.vip_thresholds.silver}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    loyalty: {
                                                        ...settings.loyalty,
                                                        vip_thresholds: { ...settings.loyalty.vip_thresholds, silver: parseInt(e.target.value) }
                                                    }
                                                })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Gold (points)</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={settings.loyalty.vip_thresholds.gold}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    loyalty: {
                                                        ...settings.loyalty,
                                                        vip_thresholds: { ...settings.loyalty.vip_thresholds, gold: parseInt(e.target.value) }
                                                    }
                                                })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Platinum (points)</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={settings.loyalty.vip_thresholds.platinum}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    loyalty: {
                                                        ...settings.loyalty,
                                                        vip_thresholds: { ...settings.loyalty.vip_thresholds, platinum: parseInt(e.target.value) }
                                                    }
                                                })}
                                            />
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
                                        <input
                                            type="checkbox"
                                            checked={settings.payment.orange_money_enabled === true || settings.payment.orange_money_enabled === 'true'}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                payment: { ...settings.payment, orange_money_enabled: e.target.checked }
                                            })}
                                        />
                                        <div className="payment-method-icon">📱</div>
                                        <div className="payment-method-name">Orange Money</div>
                                    </label>

                                    {/* Wave */}
                                    <label className="payment-method-card">
                                        <input
                                            type="checkbox"
                                            checked={settings.payment.wave_enabled === true || settings.payment.wave_enabled === 'true'}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                payment: { ...settings.payment, wave_enabled: e.target.checked }
                                            })}
                                        />
                                        <div className="payment-method-icon">🌊</div>
                                        <div className="payment-method-name">Wave</div>
                                    </label>

                                    {/* Moov Money */}
                                    <label className="payment-method-card">
                                        <input
                                            type="checkbox"
                                            checked={settings.payment.moov_money_enabled === true || settings.payment.moov_money_enabled === 'true'}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                payment: { ...settings.payment, moov_money_enabled: e.target.checked }
                                            })}
                                        />
                                        <div className="payment-method-icon">📱</div>
                                        <div className="payment-method-name">Moov Money</div>
                                    </label>

                                    {/* Telecel Money */}
                                    <label className="payment-method-card">
                                        <input
                                            type="checkbox"
                                            checked={settings.payment.telecel_money_enabled === true || settings.payment.telecel_money_enabled === 'true'}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                payment: { ...settings.payment, telecel_money_enabled: e.target.checked }
                                            })}
                                        />
                                        <div className="payment-method-icon">📱</div>
                                        <div className="payment-method-name">Telecel Money</div>
                                    </label>
                                </div>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Commission (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="form-input"
                                            value={settings.payment.commission_rate}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                payment: { ...settings.payment, commission_rate: parseFloat(e.target.value) }
                                            })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Délai de règlement (jours)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={settings.payment.settlement_delay}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                payment: { ...settings.payment, settlement_delay: parseInt(e.target.value) }
                                            })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Retrait minimum (FCFA)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={settings.payment.min_withdrawal}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                payment: { ...settings.payment, min_withdrawal: parseInt(e.target.value) }
                                            })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Retrait maximum (FCFA)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={settings.payment.max_withdrawal}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                payment: { ...settings.payment, max_withdrawal: parseInt(e.target.value) }
                                            })}
                                        />
                                    </div>
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
                                    {/* Alertes email */}
                                    <label className="notification-item">
                                        <div className="notification-info">
                                            <div className="notification-title">Alertes email</div>
                                            <div className="notification-desc">Recevoir des notifications par email</div>
                                        </div>
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.notifications.email_alerts === true || settings.notifications.email_alerts === 'true'}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    notifications: { ...settings.notifications, email_alerts: e.target.checked }
                                                })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </div>
                                    </label>

                                    {/* Alertes SMS */}
                                    <label className="notification-item">
                                        <div className="notification-info">
                                            <div className="notification-title">Alertes SMS</div>
                                            <div className="notification-desc">Recevoir des notifications par SMS</div>
                                        </div>
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.notifications.sms_alerts === true || settings.notifications.sms_alerts === 'true'}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    notifications: { ...settings.notifications, sms_alerts: e.target.checked }
                                                })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </div>
                                    </label>

                                    {/* Notifications push */}
                                    <label className="notification-item">
                                        <div className="notification-info">
                                            <div className="notification-title">Notifications push</div>
                                            <div className="notification-desc">Notifications dans l'application</div>
                                        </div>
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.notifications.push_notifications === true || settings.notifications.push_notifications === 'true'}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    notifications: { ...settings.notifications, push_notifications: e.target.checked }
                                                })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </div>
                                    </label>

                                    {/* Rapport quotidien */}
                                    <label className="notification-item">
                                        <div className="notification-info">
                                            <div className="notification-title">Rapport quotidien</div>
                                            <div className="notification-desc">Recevoir un résumé quotidien par email</div>
                                        </div>
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.notifications.daily_report === true || settings.notifications.daily_report === 'true'}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    notifications: { ...settings.notifications, daily_report: e.target.checked }
                                                })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </div>
                                    </label>

                                    {/* Rapport mensuel */}
                                    <label className="notification-item">
                                        <div className="notification-info">
                                            <div className="notification-title">Rapport mensuel</div>
                                            <div className="notification-desc">Recevoir un rapport mensuel détaillé</div>
                                        </div>
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.notifications.monthly_report === true || settings.notifications.monthly_report === 'true'}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    notifications: { ...settings.notifications, monthly_report: e.target.checked }
                                                })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </div>
                                    </label>

                                    {/* Alerte stock faible */}
                                    <label className="notification-item">
                                        <div className="notification-info">
                                            <div className="notification-title">Alerte stock faible</div>
                                            <div className="notification-desc">Notification quand un produit atteint son seuil</div>
                                        </div>
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.notifications.low_stock_alert === true || settings.notifications.low_stock_alert === 'true'}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    notifications: { ...settings.notifications, low_stock_alert: e.target.checked }
                                                })}
                                            />
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

                                <div className="notifications-list">
                                    <label className="notification-item">
                                        <div className="notification-info">
                                            <div className="notification-title">Authentification à deux facteurs (2FA)</div>
                                            <div className="notification-desc">Sécurisez l'accès avec une double authentification</div>
                                        </div>
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.security.two_factor_auth === true || settings.security.two_factor_auth === 'true'}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    security: { ...settings.security, two_factor_auth: e.target.checked }
                                                })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </div>
                                    </label>
                                </div>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Timeout session (minutes)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={settings.security.session_timeout}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                security: { ...settings.security, session_timeout: parseInt(e.target.value) }
                                            })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Tentatives max de connexion</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={settings.security.max_login_attempts}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                security: { ...settings.security, max_login_attempts: parseInt(e.target.value) }
                                            })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Expiration mot de passe (jours)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={settings.security.password_expiry_days}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                security: { ...settings.security, password_expiry_days: parseInt(e.target.value) }
                                            })}
                                        />
                                    </div>
                                </div>

                                <div className="security-actions">
                                    <button className="btn btn-outline" onClick={() => toast.info('Fonctionnalité à venir')}>
                                        🔑 Changer le mot de passe
                                    </button>
                                    <button className="btn btn-outline" onClick={() => toast.info('Fonctionnalité à venir')}>
                                        📋 Logs de connexion
                                    </button>
                                    <button className="btn btn-outline" onClick={() => toast.info('Fonctionnalité à venir')}>
                                        🔄 Générer nouvelle clé API
                                    </button>
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

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Thème</label>
                                        <div className="theme-selector">
                                            <button
                                                className={`theme-option ${settings.appearance.theme === 'light' ? 'active' : ''}`}
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    appearance: { ...settings.appearance, theme: 'light' }
                                                })}
                                            >
                                                <div className="theme-preview light"></div>
                                                <span>Clair</span>
                                            </button>
                                            <button
                                                className={`theme-option ${settings.appearance.theme === 'dark' ? 'active' : ''}`}
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    appearance: { ...settings.appearance, theme: 'dark' }
                                                })}
                                            >
                                                <div className="theme-preview dark"></div>
                                                <span>Sombre</span>
                                            </button>
                                            <button
                                                className={`theme-option ${settings.appearance.theme === 'auto' ? 'active' : ''}`}
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    appearance: { ...settings.appearance, theme: 'auto' }
                                                })}
                                            >
                                                <div className="theme-preview auto"></div>
                                                <span>Auto</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Couleur principale</label>
                                        <div className="color-selector">
                                            <button
                                                className={`color-option ${settings.appearance.primary_color === '#2563eb' ? 'active' : ''}`}
                                                style={{ backgroundColor: '#2563eb' }}
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    appearance: { ...settings.appearance, primary_color: '#2563eb' }
                                                })}
                                            ></button>
                                            <button
                                                className={`color-option ${settings.appearance.primary_color === '#10b981' ? 'active' : ''}`}
                                                style={{ backgroundColor: '#10b981' }}
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    appearance: { ...settings.appearance, primary_color: '#10b981' }
                                                })}
                                            ></button>
                                            <button
                                                className={`color-option ${settings.appearance.primary_color === '#8b5cf6' ? 'active' : ''}`}
                                                style={{ backgroundColor: '#8b5cf6' }}
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    appearance: { ...settings.appearance, primary_color: '#8b5cf6' }
                                                })}
                                            ></button>
                                            <button
                                                className={`color-option ${settings.appearance.primary_color === '#f59e0b' ? 'active' : ''}`}
                                                style={{ backgroundColor: '#f59e0b' }}
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    appearance: { ...settings.appearance, primary_color: '#f59e0b' }
                                                })}
                                            ></button>
                                            <button
                                                className={`color-option ${settings.appearance.primary_color === '#ef4444' ? 'active' : ''}`}
                                                style={{ backgroundColor: '#ef4444' }}
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    appearance: { ...settings.appearance, primary_color: '#ef4444' }
                                                })}
                                            ></button>
                                        </div>
                                    </div>
                                </div>

                                <div className="notifications-list">
                                    <label className="notification-item">
                                        <div className="notification-info">
                                            <div className="notification-title">Animations</div>
                                            <div className="notification-desc">Activer les animations de l'interface</div>
                                        </div>
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.appearance.animations_enabled === true || settings.appearance.animations_enabled === 'true'}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    appearance: { ...settings.appearance, animations_enabled: e.target.checked }
                                                })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </div>
                                    </label>

                                    <label className="notification-item">
                                        <div className="notification-info">
                                            <div className="notification-title">Mode compact</div>
                                            <div className="notification-desc">Afficher plus d'informations à l'écran</div>
                                        </div>
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.appearance.compact_mode === true || settings.appearance.compact_mode === 'true'}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    appearance: { ...settings.appearance, compact_mode: e.target.checked }
                                                })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default Settings
