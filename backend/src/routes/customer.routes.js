//backend/src/routes/customer.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');

// Get current customer profile (NOUVEAU - À AJOUTER)
router.get('/me', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Récupérer l'utilisateur
        const { data: user, error: userError } = await supabase
            .from('Users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Récupérer les infos client
        const { data: customer, error: customerError } = await supabase
            .from('Customers')
            .select('*')
            .eq('phoneNumber', user.phone)
            .single();

        if (customerError && !customer) {
            // Créer un profil client si inexistant
            const { data: newCustomer, error: createError } = await supabase
                .from('Customers')
                .insert([{
                    phoneNumber: user.phone,
                    loyaltyPoints: 0,
                    totalSpent: 0,
                    vipLevel: 'bronze',
                    walletBalance: 0,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }])
                .select()
                .single();

            if (createError) throw createError;

            return res.json({
                ...newCustomer,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                recentTransactions: []
            });
        }

        // Récupérer les dernières transactions
        const { data: transactions, error: txError } = await supabase
            .from('Transactions')
            .select('*')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false })
            .limit(10);

        res.json({
            ...customer,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            recentTransactions: transactions || []
        });

    } catch (error) {
        console.error('Error fetching customer profile:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all customers (sans doublons)
router.get('/', auth, async (req, res) => {
    try {
        // Récupérer les clients de la table Customers
        const { data: customers, error: customersError } = await supabase
            .from('Customers')
            .select('*')
            .order('createdAt', { ascending: false });

        if (customersError) throw customersError;

        // Récupérer les utilisateurs avec rôle customer
        const { data: users, error: usersError } = await supabase
            .from('Users')
            .select('id, firstName, lastName, email, phone, createdAt')
            .eq('role', 'customer');

        if (usersError) throw usersError;

        // Créer un Map pour éviter les doublons
        const customersMap = new Map();

        (customers || []).forEach(c => {
            customersMap.set(c.phoneNumber, {
                id: c.id,
                phoneNumber: c.phoneNumber,
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
                name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.phoneNumber,
                loyaltyPoints: c.loyaltyPoints || 0,
                totalSpent: c.totalSpent || 0,
                vipLevel: c.vipLevel || 'bronze',
                walletBalance: c.walletBalance || 0,
                nfcCardNumber: c.nfcCardNumber,
                isActive: c.isActive,
                createdAt: c.createdAt,
                source: 'customer'
            });
        });

        (users || []).forEach(u => {
            if (!customersMap.has(u.phone)) {
                customersMap.set(u.phone, {
                    id: u.id,
                    phoneNumber: u.phone,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    email: u.email,
                    name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.phone,
                    loyaltyPoints: 0,
                    totalSpent: 0,
                    vipLevel: 'bronze',
                    walletBalance: 0,
                    nfcCardNumber: null,
                    isActive: true,
                    createdAt: u.createdAt,
                    source: 'user'
                });
            }
        });

        const allCustomers = Array.from(customersMap.values());

        res.json(allCustomers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get customer by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('Customers')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update customer
router.put('/:id', auth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('Customers')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete customer
router.delete('/:id', auth, async (req, res) => {
    try {
        const { error } = await supabase
            .from('Customers')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
