// frontend-web/src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../api'

const Sidebar = () => {
    const location = useLocation()
    const [companyName, setCompanyName] = useState('CREALIS')
    const [loading, setLoading] = useState(true)

    // Récupérer l'utilisateur connecté depuis localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const isAdmin = user.role === 'admin'
    const isMerchant = user.role === 'merchant'

    useEffect(() => {
        fetchCompanyName()
    }, [])

    const fetchCompanyName = async () => {
        try {
            const savedSettings = localStorage.getItem('appSettings')
            if (savedSettings) {
                const settings = JSON.parse(savedSettings)
                if (settings.general?.companyName) {
                    setCompanyName(settings.general.companyName)
                }
            }
        } catch (error) {
            console.error('Error fetching company name:', error)
        } finally {
            setLoading(false)
        }
    }

    // Menu pour l'administrateur (accès complet)
    const adminMenuItems = [
        { path: '/', icon: '📊', label: 'Dashboard', description: 'Vue d\'ensemble' },
        { path: '/merchants', icon: '🏪', label: 'Commerçants', description: 'Gestion des commerçants' },
        { path: '/transactions', icon: '💰', label: 'Transactions', description: 'Historique des transactions' },
        { path: '/loyalty', icon: '🎯', label: 'Fidélité', description: 'Points et récompenses' },
        { path: '/customers', icon: '👥', label: 'Clients', description: 'Base clients' },
        { path: '/products', icon: '📦', label: 'Produits', description: 'Catalogue produits' },
        { path: '/suppliers', icon: '🏭', label: 'Fournisseurs', description: 'Gestion des fournisseurs' },
        { path: '/warehouse', icon: '🏪', label: 'Entrepôt', description: 'Gestion des stocks' },
        { path: '/pos', icon: '📱', label: 'Terminaux POS', description: 'Terminaux de paiement' },
        { path: '/advertising', icon: '📢', label: 'Publicité', description: 'Campagnes marketing' },
        { path: '/reports', icon: '📈', label: 'Rapports', description: 'Analyses et rapports' },
        { path: '/settings', icon: '⚙️', label: 'Paramètres', description: 'Configuration' }
    ]

    // Menu pour le commerçant (accès limité)
    const merchantMenuItems = [
        { path: '/', icon: '📊', label: 'Mon Dashboard', description: 'Performance de ma boutique' },
        { path: '/transactions', icon: '💰', label: 'Mes Transactions', description: 'Historique des ventes' },
        { path: '/products', icon: '📦', label: 'Mes Produits', description: 'Mon catalogue et stock' },
        { path: '/merchant-stock-requests', icon: '📦', label: 'Réapprovisionnement', description: 'Demander du stock' },
        { path: '/reports', icon: '📈', label: 'Mes Rapports', description: 'Mes statistiques' }
        // Paramètres supprimé - pas accessible pour les commerçants
    ]

    // Sélectionner le menu en fonction du rôle
    const menuItems = isAdmin ? adminMenuItems : merchantMenuItems

    // Ne pas afficher la sidebar si l'utilisateur n'est ni admin ni commerçant
    if (!isAdmin && !isMerchant) {
        return null
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <img src="/logo.jpg" alt="Créalis" className="logo-image-large" />
                    <div className="logo-text">
                        <span className="logo-main">{companyName}</span>
                        <span className="logo-sub">DASSANDAGA</span>
                    </div>
                </div>
                {/* Badge de rôle */}
                <div className={`role-badge ${isAdmin ? 'admin' : 'merchant'}`}>
                    {isAdmin ? '👑 Administrateur' : '🏪 Commerçant'}
                </div>
            </div>
            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                        title={item.description}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <div className="sidebar-link-content">
                            <span className="sidebar-label">{item.label}</span>
                            <span className="sidebar-description">{item.description}</span>
                        </div>
                    </Link>
                ))}
            </nav>
            <div className="sidebar-footer">
                <div className="sidebar-version">
                    <span className="version-icon">⚡</span>
                    <span className="version-text">v2.0.0</span>
                </div>
            </div>
        </aside>
    )
}

export default Sidebar
