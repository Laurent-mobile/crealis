//backend/src/routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');


// Modifie la route /stats pour calculer correctement les clients actifs

router.get('/stats', auth, async (req, res) => {
    try {
        console.log('📊 Dashboard stats requested for role:', req.user.role);

        // Pour un commerçant - voir ses propres données
        if (req.user.role === 'merchant') {
            const merchantId = req.user.merchantId;

            const { data: transactions, error } = await supabase
                .from('Transactions')
                .select('*')
                .eq('merchant_id', merchantId);

            if (error) {
                console.error('Supabase error:', error);
                return res.status(500).json({ message: error.message });
            }

            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

            const weekTransactions = (transactions || []).filter(t => new Date(t.created_at) >= weekAgo);
            const monthTransactions = (transactions || []).filter(t => new Date(t.created_at) >= monthAgo);
            const lastWeekTransactions = (transactions || []).filter(t => {
                const date = new Date(t.created_at);
                return date >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) && date < weekAgo;
            });

            const weekRevenue = weekTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            const monthRevenue = monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            const lastWeekRevenue = lastWeekTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

            const revenueEvolution = lastWeekRevenue > 0
                ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
                : weekRevenue > 0 ? 100 : 0;

            return res.json({
                weekRevenue,
                monthRevenue,
                revenueEvolution: Math.round(revenueEvolution)
            });
        }

        // Pour admin - voir toutes les données
        // Récupérer tous les clients (Customers et Users avec rôle customer)
        const [customersData, usersData, transactionsData] = await Promise.all([
            supabase.from('Customers').select('*'),
            supabase.from('Users').select('*').eq('role', 'customer'),
            supabase.from('Transactions').select('*')
        ]);

        const customers = customersData.data || [];
        const users = usersData.data || [];
        const transactions = transactionsData.data || [];

        // Compter les clients actifs (ceux qui ont fait au moins une transaction dans les 30 derniers jours)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Récupérer les IDs des clients qui ont fait des transactions récentes
        const activeCustomerIds = new Set();
        const activeUserIds = new Set();

        transactions.forEach(t => {
            const txDate = new Date(t.created_at);
            if (txDate >= thirtyDaysAgo) {
                if (t.customer_id) activeCustomerIds.add(t.customer_id);
                if (t.user_id) activeUserIds.add(t.user_id);
            }
        });

        // Compter les clients actifs
        const activeCustomersFromCustomers = customers.filter(c => activeCustomerIds.has(c.id)).length;
        const activeCustomersFromUsers = users.filter(u => activeUserIds.has(u.id)).length;
        const activeCustomers = activeCustomersFromCustomers + activeCustomersFromUsers;

        // Total clients uniques
        const allCustomerIds = new Set([
            ...customers.map(c => c.id),
            ...users.map(u => u.id)
        ]);
        const totalCustomers = allCustomerIds.size;

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const weekTransactions = (transactions || []).filter(t => new Date(t.created_at) >= weekAgo);
        const monthTransactions = (transactions || []).filter(t => new Date(t.created_at) >= monthAgo);
        const lastWeekTransactions = (transactions || []).filter(t => {
            const date = new Date(t.created_at);
            return date >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) && date < weekAgo;
        });

        const weekRevenue = weekTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const monthRevenue = monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const lastWeekRevenue = lastWeekTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

        const revenueEvolution = lastWeekRevenue > 0
            ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
            : weekRevenue > 0 ? 100 : 0;

        res.json({
            totalCustomers: totalCustomers,
            activeCustomers: activeCustomers,
            customersCount: customers.length,
            usersCount: users.length,
            weekRevenue,
            monthRevenue,
            revenueEvolution: Math.round(revenueEvolution),
            totalTransactions: transactions.length,
            weekTransactions: weekTransactions.length,
            monthTransactions: monthTransactions.length
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: error.message });
    }
});

// Top products
router.get('/products/top', auth, async (req, res) => {
    try {
        console.log('📦 Top products requested');

        const { data: products, error } = await supabase
            .from('Products')
            .select('id, name, price, stock, merchant_id');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ message: error.message });
        }

        if (!products || products.length === 0) {
            console.log('No products found');
            return res.json([]);
        }

        // Pour commerçant, filtrer ses produits
        let filteredProducts = products;
        if (req.user.role === 'merchant' && req.user.merchantId) {
            filteredProducts = products.filter(p => p.merchant_id === req.user.merchantId);
        }

        const topProducts = filteredProducts.slice(0, 5).map(p => ({
            id: p.id,
            name: p.name,
            sales: Math.floor((p.stock || 0) * 0.3) + 10,
            revenue: (p.price || 0) * (Math.floor((p.stock || 0) * 0.3) + 10),
            stock: p.stock || 0
        }));

        topProducts.sort((a, b) => b.sales - a.sales);

        res.json(topProducts);
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ message: error.message });
    }
});

// Pending orders
router.get('/orders/pending', auth, async (req, res) => {
    try {
        console.log('📋 Pending orders requested');
        res.json([]);
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
