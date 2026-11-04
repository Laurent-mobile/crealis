const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');

// Import des routes
const authRoutes = require('./src/routes/auth.routes');
const merchantRoutes = require('./src/routes/merchant.routes');
const loyaltyRoutes = require('./src/routes/loyalty.routes');
const transactionRoutes = require('./src/routes/transaction.routes');
const posRoutes = require('./src/routes/pos.routes');
const customerRoutes = require('./src/routes/customer.routes');
const productRoutes = require('./src/routes/product.routes');
const advertisingRoutes = require('./src/routes/advertising.routes');
const warehouseRoutes = require('./src/routes/warehouse.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const orderRoutes = require('./src/routes/order.routes');
const categoryRoutes = require('./src/routes/category.routes');
const settingsRoutes = require('./src/routes/settings.routes');
const merchantDashboardRoutes = require('./src/routes/merchant-dashboard.routes');
const supplierRoutes = require('./src/routes/supplier.routes');
const reportRoutes = require('./src/routes/report.routes');
const merchantStockRoutes = require('./src/routes/merchant-stock.routes');
const tickerRoutes = require('./src/routes/ticker.routes');
const notificationRoutes = require('./src/routes/notifications.routes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// 🔒 SÉCURITÉ
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 🗜️ COMPRESSION
app.use(compression());

// ⚡ RATE LIMITING (Corrigé pour éviter l'erreur 429 sur le dashboard)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 300 : 2000, // 300 en prod, 2000 en dev (le dashboard fait ~10 requêtes au chargement)
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 tentatives de login
  message: { error: 'Trop de tentatives de connexion' }
});

// 🌐 CORS configuré pour la production
const allowedOrigins = isProd
  ? [
      'https://crealis-dashboard.vercel.app',
      'https://crealis-dashbord.vercel.app' // Votre orthographe actuelle sur Vercel
    ]
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: [
    'http://localhost:5173',      // Vite (Frontend Web)
    'http://localhost:3000',      // Autre port frontend possible
    'http://localhost:8081',      // ✅ Expo Web (Mobile)
    'http://localhost:19006',     // ✅ Expo Web (Port alternatif)
    'https://crealis-dashboard.vercel.app',
    'https://crealis-dashbord.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'ngrok-skip-browser-warning'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Appliquer le rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/', limiter);

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/merchant-dashboard', merchantDashboardRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/advertising', advertisingRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/merchant-stock', merchantStockRoutes);
app.use('/api/ticker', tickerRoutes);
app.use('/api/notifications', notificationRoutes);

// Route santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CREALIS API',
    timestamp: new Date(),
    env: process.env.NODE_ENV
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur globale:', err);
  res.status(err.status || 500).json({
    error: isProd ? 'Erreur interne du serveur' : err.message
  });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
});
