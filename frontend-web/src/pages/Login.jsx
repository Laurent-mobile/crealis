//frontend-web/src/pages/Login.jsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import toast from 'react-hot-toast'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      console.log('Login response:', response.data)

      // Stocker le token et l'utilisateur
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      // Vérifier que le token est bien stocké
      const token = localStorage.getItem('token')
      console.log('Token stored:', token ? 'Yes' : 'No')

      toast.success('Connexion réussie')

      // Forcer la redirection
      window.location.href = '/'

    } catch (error) {
      console.error('Login error:', error)
      toast.error('Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-bg">
        <div className="login-bg-overlay"></div>
        <div className="login-bg-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon-large">🏪</div>
            <div className="logo-text-large">
              <span className="logo-main">CREALIS - </span>
              <span className="logo-sub">DASSANDAGA</span>
            </div>
          </div>
          <p className="login-subtitle">Plateforme Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <div className="input-icon">📧</div>
            <input
              type="email"
              className="login-input"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <div className="input-icon">🔒</div>
            <input
              type={showPassword ? 'text' : 'password'}
              className="login-input"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          <div className="login-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Se souvenir de moi</span>
            </label>
            <a href="#" className="forgot-link">Mot de passe oublié ?</a>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-spinner"></span>
            ) : (
              <>
                <span>Se connecter</span>
                <span className="btn-icon">→</span>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="register-prompt">
            Nouveau commerçant ?
            <Link to="/register-merchant" className="register-link"> Créer un compte</Link>
          </p>
          <div className="login-features">
            <div className="feature">
              <span className="feature-icon">📊</span>
              <span>Dashboard en temps réel</span>
            </div>
            <div className="feature">
              <span className="feature-icon">💳</span>
              <span>Gestion des fidélités</span>
            </div>
            <div className="feature">
              <span className="feature-icon">📱</span>
              <span>Terminaux POS connectés</span>
            </div>
          </div>
          <p className="login-copyright">
            © 2025 CREALIS-DASSANDAGA - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
