// frontend-web/src/components/Layout.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import toast from 'react-hot-toast';
import NotificationBell from './NotificationBell';

function Layout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isMerchant = user.role === 'merchant';

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  return (
    <div>
      <Sidebar />
      <div className="main-content">
        <div className="navbar">
          <div className="navbar-container">
            <div></div>
            <div className="navbar-user">
              <span className="user-role" style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                {isMerchant ? '🏪 Commerçant' : '👑 Administrateur'}
              </span>
              <span className="user-email">{user.email}</span>
              <NotificationBell />
              <button onClick={handleLogout} className="btn-logout">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
        <div className="page-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;
