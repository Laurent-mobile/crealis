//backend/src/routes/loyalty.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');

// Récupérer tous les clients avec leurs noms
router.get('/customers', auth, async (req, res) => {
  try {
    // 1. Récupérer les utilisateurs avec rôle customer (ils ont firstName, lastName)
    const { data: users, error: usersError } = await supabase
      .from('Users')
      .select('id, firstName, lastName, email, phone, createdAt, isActive')
      .eq('role', 'customer');

    if (usersError) throw usersError;

    // 2. Récupérer les clients de la table Customers (pour les points, wallet, etc.)
    const { data: customers, error: customersError } = await supabase
      .from('Customers')
      .select('*')
      .order('createdAt', { ascending: false });

    if (customersError) throw customersError;

    // Créer un Map pour fusionner les données
    const customersMap = new Map();

    // D'abord, ajouter tous les utilisateurs (ils ont les noms)
    (users || []).forEach(u => {
      customersMap.set(u.phone, {
        id: u.id,
        phoneNumber: u.phone,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: u.email || '',
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.phone,
        loyaltyPoints: 0,
        totalSpent: 0,
        vipLevel: 'bronze',
        walletBalance: 0,
        nfcCardNumber: null,
        isActive: u.isActive,
        createdAt: u.createdAt,
        source: 'user'
      });
    });

    // Ensuite, enrichir avec les données des customers (points, wallet, etc.)
    (customers || []).forEach(c => {
      const key = c.phoneNumber;
      if (customersMap.has(key)) {
        // Mettre à jour les données existantes
        const existing = customersMap.get(key);
        customersMap.set(key, {
          ...existing,
          loyaltyPoints: c.loyaltyPoints || 0,
          totalSpent: c.totalSpent || 0,
          vipLevel: c.vipLevel || 'bronze',
          walletBalance: c.walletBalance || 0,
          nfcCardNumber: c.nfcCardNumber || null,
        });
      } else {
        // Ajouter un nouveau client (sans nom car pas dans Users)
        customersMap.set(key, {
          id: c.id,
          phoneNumber: c.phoneNumber,
          firstName: c.firstName || '',
          lastName: c.lastName || '',
          email: c.email || '',
          name: c.firstName ? `${c.firstName} ${c.lastName || ''}`.trim() : c.phoneNumber,
          loyaltyPoints: c.loyaltyPoints || 0,
          totalSpent: c.totalSpent || 0,
          vipLevel: c.vipLevel || 'bronze',
          walletBalance: c.walletBalance || 0,
          nfcCardNumber: c.nfcCardNumber,
          isActive: c.isActive,
          createdAt: c.createdAt,
          source: 'customer'
        });
      }
    });

    // Convertir le Map en tableau
    const allCustomers = Array.from(customersMap.values());

    console.log(`📊 Total clients: ${allCustomers.length} (Users: ${users?.length || 0}, Customers: ${customers?.length || 0})`);
    console.log('Premier client:', allCustomers[0]);

    res.json(allCustomers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create customer
router.post('/customers', auth, async (req, res) => {
  try {
    const { phoneNumber, firstName, lastName, email } = req.body;

    const nfcCardNumber = `CREALIS_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data, error } = await supabase
      .from('Customers')
      .insert([{
        phoneNumber,
        nfcCardNumber,
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

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: error.message });
  }
});
// Récupérer l'historique des points du client
router.get('/points-history', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer le client
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('phone')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const { data: customer, error: customerError } = await supabase
      .from('Customers')
      .select('id')
      .eq('phoneNumber', user.phone)
      .single();

    if (customerError || !customer) {
      return res.json([]);
    }

    const { data: history, error: historyError } = await supabase
      .from('PointsHistory')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (historyError) throw historyError;

    res.json(history || []);
  } catch (error) {
    console.error('Error fetching points history:', error);
    res.status(500).json({ message: error.message });
  }
});
// Get customer by NFC card
router.get('/nfc-card/:cardNumber', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Customers')
      .select('*')
      .eq('nfcCardNumber', req.params.cardNumber)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Carte non trouvée' });
    }

    res.json({ success: true, customer: data });
  } catch (error) {
    console.error('Error fetching NFC card:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add points
router.post('/add-points', auth, async (req, res) => {
  try {
    const { customerId, points, reason } = req.body;

    const { data: customer, error: fetchError } = await supabase
      .from('Customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (fetchError || !customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const newPoints = customer.loyaltyPoints + parseInt(points);
    let vipLevel = customer.vipLevel;

    if (newPoints >= 10000) vipLevel = 'platinum';
    else if (newPoints >= 5000) vipLevel = 'gold';
    else if (newPoints >= 2000) vipLevel = 'silver';

    const { data, error } = await supabase
      .from('Customers')
      .update({
        loyaltyPoints: newPoints,
        vipLevel: vipLevel,
        updatedAt: new Date().toISOString()
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, points: newPoints, vipLevel });
  } catch (error) {
    console.error('Error adding points:', error);
    res.status(500).json({ message: error.message });
  }
});

// Recharge wallet
router.post('/recharge-wallet', auth, async (req, res) => {
  try {
    const { customerId, amount } = req.body;

    const { data: customer, error: fetchError } = await supabase
      .from('Customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (fetchError || !customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const newBalance = (customer.walletBalance || 0) + parseFloat(amount);

    const { data, error } = await supabase
      .from('Customers')
      .update({
        walletBalance: newBalance,
        updatedAt: new Date().toISOString()
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, walletBalance: newBalance });
  } catch (error) {
    console.error('Error recharging wallet:', error);
    res.status(500).json({ message: error.message });
  }
});

// Generate NFC card
router.post('/generate-nfc-card', auth, async (req, res) => {
  try {
    const { customerId } = req.body;

    const nfcCardNumber = `CREALIS_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data, error } = await supabase
      .from('Customers')
      .update({
        nfcCardNumber,
        isActive: true,
        updatedAt: new Date().toISOString()
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, nfcCardNumber });
  } catch (error) {
    console.error('Error generating NFC card:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get loyalty stats - modifié pour supporter l'historique client
router.get('/stats', auth, async (req, res) => {
  try {
    // Si un client connecté demande ses stats perso
    if (req.user?.role === 'customer') {
      const { data: transactions, error } = await supabase
        .from('Transactions')
        .select('id, amount, points_earned, type, description, created_at')
        .eq('customer_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return res.json({
        recentTransactions: transactions?.map(t => ({
          description: t.description || (t.type === 'purchase' ? 'Achat' : t.type === 'recharge' ? 'Recharge' : 'Transaction'),
          points: t.points_earned || 0,
          amount: t.amount,
          date: t.created_at
        })) || []
      });
    }

    // Stats globales pour admin
    const { data: customers, error } = await supabase
      .from('Customers')
      .select('*');

    if (error) throw error;

    const stats = {
      totalCustomers: customers?.length || 0,
      totalPoints: customers?.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0) || 0,
      totalSpent: customers?.reduce((sum, c) => sum + (c.totalSpent || 0), 0) || 0,
      totalWallet: customers?.reduce((sum, c) => sum + (c.walletBalance || 0), 0) || 0,
      activeCards: customers?.filter(c => c.nfcCardNumber).length || 0,
      inactiveCards: customers?.filter(c => !c.isActive).length || 0,
      vipLevels: {
        bronze: customers?.filter(c => c.vipLevel === 'bronze').length || 0,
        silver: customers?.filter(c => c.vipLevel === 'silver').length || 0,
        gold: customers?.filter(c => c.vipLevel === 'gold').length || 0,
        platinum: customers?.filter(c => c.vipLevel === 'platinum').length || 0
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching loyalty stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update card status
router.put('/card/:cardNumber/status', auth, async (req, res) => {
  try {
    const { isActive, reason } = req.body;

    const { data, error } = await supabase
      .from('Customers')
      .update({
        isActive: isActive,
        updatedAt: new Date().toISOString()
      })
      .eq('nfcCardNumber', req.params.cardNumber)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, customer: data });
  } catch (error) {
    console.error('Error updating card status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Regenerate card
router.post('/card/:customerId/regenerate', auth, async (req, res) => {
  try {
    const newCardNumber = `CREALIS_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data, error } = await supabase
      .from('Customers')
      .update({
        nfcCardNumber: newCardNumber,
        updatedAt: new Date().toISOString()
      })
      .eq('id', req.params.customerId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, newCardNumber });
  } catch (error) {
    console.error('Error regenerating card:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
