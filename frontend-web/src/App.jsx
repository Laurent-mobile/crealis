import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Pages
import Dashboard from './pages/Dashboard';
import Merchants from './pages/Merchants';
import Transactions from './pages/Transactions';
import Loyalty from './pages/Loyalty';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Warehouse from './pages/Warehouse';
import POS from './pages/POS';
import Advertising from './pages/Advertising';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Suppliers from './pages/Suppliers';
import Categories from './pages/Categories';
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantRegister from './pages/MerchantRegister';
import MerchantStockRequests from './pages/MerchantStockRequests';
import MerchantReports from './pages/MerchantReports';
import AdminMerchants from './pages/AdminMerchants';
import AdminSettings from './pages/AdminSettings';

// Composants
import Layout from './components/Layout';

// Composant pour protéger les routes
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const isAuthenticated = token !== null && token !== 'undefined' && token !== '';
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Composant Layout Wrapper (Monté une seule fois !)
const LayoutWrapper = () => {
  return (
    <Layout>
      <Outlet /> {/* C'est ici que la page active (Dashboard, Transactions, etc.) s'affichera */}
    </Layout>
  );
};

function App() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isMerchant = user.role === 'merchant';

  // Définir les composants en fonction du rôle
  const DashboardComponent = isMerchant ? MerchantDashboard : Dashboard;
  const ReportsComponent = isMerchant ? MerchantReports : Reports;
  const MerchantsComponent = isMerchant ? Merchants : AdminMerchants;

  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<Login />} />
        <Route path="/register-merchant" element={<MerchantRegister />} />

        {/* Routes protégées avec Layout unique */}
        <Route 
          element={
            <ProtectedRoute>
              <LayoutWrapper />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardComponent />} />
          <Route path="/merchants" element={<MerchantsComponent />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/loyalty" element={<Loyalty />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/products" element={<Products />} />
          <Route path="/warehouse" element={<Warehouse />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/advertising" element={<Advertising />} />
          <Route path="/reports" element={<ReportsComponent />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/merchant-stock-requests" element={<MerchantStockRequests />} />
        </Route>

        {/* Redirection par défaut si URL inconnue */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
