// backend/src/routes/merchant-dashboard.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');

// Middleware pour vérifier que l'utilisateur est un commerçant ou un admin
const isMerchantOrAdmin = (req, res, next) => {
    if (req.user.role !== 'merchant' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès non autorisé. Commerçant ou administrateur requis.' });
    }
    next();
};

// Helper pour récupérer l'ID du commerçant (depuis l'utilisateur connecté)
const getMerchantIdFromUser = async (userId) => {
    const { data: user, error } = await supabase
        .from('Users')
        .select('merchantId')
        .eq('id', userId)
        .single();

    if (error || !user) {
        throw new Error('Utilisateur ou commerçant associé non trouvé');
    }
    return user.merchantId;
};

// Route principale : Récupérer toutes les stats du dashboard pour un commerçant
router.get('/stats', auth, isMerchantOrAdmin, async (req, res) => {
    try {
        let merchantId = req.query.merchantId; // Pour les admins
        if (req.user.role === 'merchant') {
            merchantId = await getMerchantIdFromUser(req.user.id);
        }

        if (!merchantId) {
            return res.status(400).json({ message: 'ID du commerçant manquant.' });
        }

        console.log(`📊 Fetching merchant dashboard stats for merchant: ${merchantId}`);

        // 1. Récupérer les informations du commerçant
        const { data: merchant, error: merchantError } = await supabase
            .from('Merchants')
            .select('name, subscription_plan, city, is_verified, cashback_percent')
            .eq('id', merchantId)
            .single();

        if (merchantError) throw merchantError;

        // 2. Récupérer les transactions du commerçant
        const { data: transactions, error: txError } = await supabase
            .from('Transactions')
            .select('*')
            .eq('merchant_id', merchantId)
            .order('created_at', { ascending: false });

        if (txError) throw txError;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const endOfLastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Calculs des revenus
        const todayRevenue = (transactions || []).reduce((sum, t) => sum + (new Date(t.created_at) >= startOfToday ? (t.amount || 0) : 0), 0);
        const weekRevenue = (transactions || []).reduce((sum, t) => sum + (new Date(t.created_at) >= startOfWeek ? (t.amount || 0) : 0), 0);
        const monthRevenue = (transactions || []).reduce((sum, t) => sum + (new Date(t.created_at) >= startOfMonth ? (t.amount || 0) : 0), 0);
        const lastWeekRevenue = (transactions || []).reduce((sum, t) => sum + (new Date(t.created_at) >= startOfLastWeek && new Date(t.created_at) < endOfLastWeek ? (t.amount || 0) : 0), 0);

        const revenueEvolution = lastWeekRevenue > 0 ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : (weekRevenue > 0 ? 100 : 0);
        const totalTransactions = (transactions || []).length;

        // 3. Récupérer les 5 meilleurs produits
        // Note: Cette partie est une simulation, car votre table Transactions n'a pas de relation directe avec Products.
        // Pour une version réelle, il faudrait une table SaleItems (transaction_id, product_id, quantity).
        const { data: products, error: productsError } = await supabase
            .from('Products')
            .select('id, name, price')
            .eq('merchant_id', merchantId)
            .limit(5);

        if (productsError) throw productsError;

        const topProducts = (products || []).map(p => ({
            id: p.id,
            name: p.name,
            sales: Math.floor(Math.random() * 200) + 10, // Simulation
            revenue: (p.price || 0) * (Math.floor(Math.random() * 200) + 10) // Simulation
        })).sort((a, b) => b.sales - a.sales);

        // 4. Récupérer les clients fidèles (avec le plus de points)
        const { data: customers, error: customersError } = await supabase
            .from('Customers')
            .select('id, phoneNumber, loyaltyPoints, totalSpent, vipLevel')
            .order('loyaltyPoints', { ascending: false })
            .limit(5);

        if (customersError) throw customersError;

        // 5. Données pour le graphique d'évolution des ventes (7 derniers jours)
        const last7Days = [];
        const salesByDay = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateString = date.toISOString().split('T')[0];
            last7Days.push(date.toLocaleDateString('fr-FR', { weekday: 'short' }));

            const daySales = (transactions || [])
                .filter(t => t.created_at?.split('T')[0] === dateString)
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            salesByDay.push(daySales);
        }

        res.json({
            merchant: {
                name: merchant.name,
                plan: merchant.subscription_plan,
                city: merchant.city,
                verified: merchant.is_verified,
                cashbackRate: merchant.cashback_percent
            },
            kpis: {
                todayRevenue,
                weekRevenue,
                monthRevenue,
                revenueEvolution: Math.round(revenueEvolution),
                totalTransactions,
            },
            topProducts,
            loyalCustomers: customers || [],
            salesData: { labels: last7Days, values: salesByDay }
        });

    } catch (error) {
        console.error('Error fetching merchant dashboard stats:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
