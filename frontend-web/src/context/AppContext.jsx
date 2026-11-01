//frontend/src/context/AppContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react'
import api from '../api'

const AppContext = createContext()

export const useApp = () => useContext(AppContext)

export const AppProvider = ({ children }) => {
    const [companyName, setCompanyName] = useState('CREALIS')
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            console.log('Chargement des paramètres...')
            const token = localStorage.getItem('token')

            if (!token) {
                console.log('Pas de token, chargement des paramètres par défaut')
                return
            }

            const response = await api.get('/settings')
            console.log('Paramètres reçus:', response.data)

            const data = response.data
            setSettings(data)

            if (data && data.company_name) {
                setCompanyName(data.company_name)
            }
        } catch (error) {
            console.error('Error loading settings:', error)
            // Ne pas afficher d'erreur si c'est juste 401
            if (error.response?.status !== 401) {
                toast.error('Erreur lors du chargement des paramètres')
            }
        } finally {
            setLoading(false)
        }
    }
    const updateSetting = async (key, value) => {
        try {
            await api.put(`/settings/${key}`, { value })
            await loadSettings() // Recharger après mise à jour
            return true
        } catch (error) {
            console.error('Error updating setting:', error)
            return false
        }
    }

    const updateSettings = async (newSettings) => {
        try {
            // Mettre à jour chaque paramètre individuellement
            for (const [key, value] of Object.entries(newSettings)) {
                await api.put(`/settings/${key}`, { value })
            }
            await loadSettings() // Recharger tous les paramètres
            return true
        } catch (error) {
            console.error('Error updating settings:', error)
            return false
        }
    }

    return (
        <AppContext.Provider value={{
            companyName,
            settings,
            loading,
            updateSetting,
            updateSettings,
            reloadSettings: loadSettings
        }}>
            {children}
        </AppContext.Provider>
    )
}
