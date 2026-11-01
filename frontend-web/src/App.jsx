// frontend-web/src/App.jsx
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Merchants from './pages/Merchants'
import Transactions from './pages/Transactions'
import Loyalty from './pages/Loyalty'
import Customers from './pages/Customers'
import Products from './pages/Products'
import Warehouse from './pages/Warehouse'
import POS from './pages/POS'
import Advertising from './pages/Advertising'
import Reports from './pages/Reports'
// import Settings from './pages/Settings'  // ← Supprimer ou commenter cet import
import Login from './pages/Login'
import Suppliers from './pages/Suppliers'
import Categories from './pages/Categories';
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantRegister from './pages/MerchantRegister';
import MerchantStockRequests from './pages/MerchantStockRequests';
import MerchantReports from './pages/MerchantReports';
import AdminMerchants from './pages/AdminMerchants';
import AdminSettings from './pages/AdminSettings';

function App() {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthenticated = token !== null && token !== 'undefined' && token !== ''
  const isMerchant = user.role === 'merchant';

  // Définir le composant du tableau de bord et des rapports en fonction du rôle
  const DashboardComponent = isMerchant ? MerchantDashboard : Dashboard;
  const ReportsComponent = isMerchant ? MerchantReports : Reports;
  // Pour admin, utiliser AdminMerchants, pour merchant utiliser Merchants (ou supprimer)
  const MerchantsComponent = isMerchant ? Merchants : AdminMerchants;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={isAuthenticated ? <DashboardComponent /> : <Navigate to="/login" />} />
        <Route path="/merchants" element={isAuthenticated ? <MerchantsComponent /> : <Navigate to="/login" />} />
        <Route path="/transactions" element={isAuthenticated ? <Transactions /> : <Navigate to="/login" />} />
        <Route path="/loyalty" element={isAuthenticated ? <Loyalty /> : <Navigate to="/login" />} />
        <Route path="/customers" element={isAuthenticated ? <Customers /> : <Navigate to="/login" />} />
        <Route path="/products" element={isAuthenticated ? <Products /> : <Navigate to="/login" />} />
        <Route path="/warehouse" element={isAuthenticated ? <Warehouse /> : <Navigate to="/login" />} />
        <Route path="/pos" element={isAuthenticated ? <POS /> : <Navigate to="/login" />} />
        <Route path="/advertising" element={isAuthenticated ? <Advertising /> : <Navigate to="/login" />} />
        <Route path="/reports" element={isAuthenticated ? <ReportsComponent /> : <Navigate to="/login" />} />
        {/* ✅ UNE SEULE route pour /settings - Utiliser AdminSettings */}
        <Route path="/settings" element={isAuthenticated ? <AdminSettings /> : <Navigate to="/login" />} />
        <Route path="/categories" element={isAuthenticated ? <Categories /> : <Navigate to="/login" />} />
        <Route path="/suppliers" element={isAuthenticated ? <Suppliers /> : <Navigate to="/login" />} />
        <Route path="/register-merchant" element={<MerchantRegister />} />
        <Route path="/merchant-stock-requests" element={isAuthenticated ? <MerchantStockRequests /> : <Navigate to="/login" />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
