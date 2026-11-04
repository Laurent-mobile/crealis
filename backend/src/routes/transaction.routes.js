// backend/src/routes/transaction.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Route de test
router.get('/test', auth, (req, res) => {
  res.json({ message: 'API Transactions fonctionne', user: req.user });
});

// ==================== SIMULATION RECHARGE ====================
router.post('/recharge-simulate', auth, async (req, res) => {
  try {
    const { amount, method, phoneNumber } = req.body;
    const userId = req.user.id;

    console.log('📱 Simulation recharge:', { userId, amount, method, phoneNumber });

    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    let { data: customer, error: customerError } = await supabase
      .from('Customers')
      .select('*')
      .eq('phoneNumber', user.phone)
      .single();

    if (customerError || !customer) {
      const { data: newCustomer, error: createError } = await supabase
        .from('Customers')
        .insert([{
          id: uuidv4(),
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

      if (createError) {
        return res.status(500).json({ message: 'Erreur création client' });
      }
      customer = newCustomer;
    }

    const oldBalance = customer.walletBalance || 0;
    const newBalance = oldBalance + parseInt(amount);

    const { error: updateError } = await supabase
      .from('Customers')
      .update({
        walletBalance: newBalance,
        updatedAt: new Date().toISOString()
      })
      .eq('id', customer.id);

    if (updateError) {
      return res.status(500).json({ message: 'Erreur mise à jour wallet' });
    }

    const transactionIdValue = `SIM_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    await supabase
      .from('Transactions')
      .insert({
        id: uuidv4(),
        transaction_id: transactionIdValue,
        amount: parseInt(amount),
        type: 'recharge',
        method: method,
        status: 'completed',
        description: `Recharge de ${amount} FCFA via ${method}`,
        customer_id: customer.id,
        user_id: userId,
        reference: transactionIdValue,
        created_at: new Date().toISOString()
      });

    res.json({
      success: true,
      message: 'Simulation réussie',
      transaction: {
        id: transactionIdValue,
        amount: amount,
        newBalance: newBalance
      }
    });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== RECHARGE DE WALLET ====================
router.post('/recharge', auth, async (req, res) => {
  try {
    const { amount, method, phoneNumber } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 100) {
      return res.status(400).json({ message: 'Le montant minimum est de 100 FCFA' });
    }
    if (amount > 500000) {
      return res.status(400).json({ message: 'Le montant maximum est de 500 000 FCFA' });
    }
    if (!method) {
      return res.status(400).json({ message: 'Méthode de paiement requise' });
    }
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Numéro de téléphone requis' });
    }

    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('*, customer:Customers(*)')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    let customer = user.customer;
    if (!customer) {
      const { data: newCustomer, error: customerError } = await supabase
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

      if (customerError) throw customerError;
      customer = newCustomer;
    }

    const transactionId = `RECH_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data: transaction, error: txError } = await supabase
      .from('Transactions')
      .insert([{
        id: uuidv4(),
        transaction_id: transactionId,
        amount: amount,
        type: 'recharge',
        method: method,
        status: 'completed',
        points_earned: 0,
        description: `Recharge de ${amount} FCFA via ${method}`,
        reference: transactionId,
        customer_id: customer.id,
        user_id: userId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (txError) throw txError;

    const newBalance = (customer.walletBalance || 0) + amount;
    const { error: updateError } = await supabase
      .from('Customers')
      .update({
        walletBalance: newBalance,
        totalSpent: (customer.totalSpent || 0) + amount,
        updatedAt: new Date().toISOString()
      })
      .eq('id', customer.id);

    if (updateError) throw updateError;

    console.log(`💳 Recharge ${amount} FCFA via ${method} pour ${phoneNumber}`);

    res.status(201).json({
      success: true,
      message: 'Recharge effectuée avec succès',
      transaction: {
        id: transaction.transaction_id,
        amount: amount,
        method: method,
        newBalance: newBalance,
        date: transaction.created_at
      }
    });
  } catch (error) {
    console.error('Error processing recharge:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== ACHAT VIA POS (CORRIGÉ : DÉDUCTION DU WALLET) ====================
router.post('/purchase', auth, async (req, res) => {
  try {
    const { amount, merchantId, customerId, description, paymentMethod, items } = req.body;
    const userId = req.user.id;

    console.log('🛒 Purchase request:', { amount, merchantId, customerId, paymentMethod, items });

    if (!amount || amount <= 0) return res.status(400).json({ message: 'Montant invalide' });
    if (!merchantId) return res.status(400).json({ message: 'Commerçant requis' });

    // 1. Récupérer le client
    let customer = null;
    if (customerId) {
      const { data: customerData } = await supabase.from('Customers').select('*').eq('id', customerId).single();
      if (customerData) customer = customerData;
    }

    // Si pas de customerId, on essaie de le trouver via l'utilisateur connecté
    if (!customer) {
      const { data: userData } = await supabase.from('Users').select('phone').eq('id', userId).single();
      if (userData) {
        const { data: custData } = await supabase.from('Customers').select('*').eq('phoneNumber', userData.phone).single();
        customer = custData;
      }
    }

    // 2. Récupérer le commerçant
    const { data: merchant, error: merchantError } = await supabase
      .from('Merchants')
      .select('*')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant) {
      return res.status(404).json({ message: 'Commerçant non trouvé' });
    }

    // 3. ✅ CORRECTION : Vérification et déduction du solde si paiement par wallet
    let newWalletBalance = customer ? (customer.walletBalance || 0) : 0;
    if (paymentMethod === 'wallet') {
      if (newWalletBalance < amount) {
        return res.status(400).json({ 
          message: 'Solde insuffisant', 
          balance: newWalletBalance, 
          required: amount 
        });
      }
      newWalletBalance -= amount; // On déduit le montant du solde
    }

    // 4. Calcul des points
    const pointsEarned = Math.floor(amount / 100);
    const transactionIdValue = `POS_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 5. Créer la transaction
    const { data: transaction, error: txError } = await supabase
      .from('Transactions')
      .insert({
        id: require('crypto').randomUUID(),
        transaction_id: transactionIdValue,
        amount: amount,
        type: 'purchase',
        method: paymentMethod || 'cash',
        status: 'completed',
        points_earned: pointsEarned,
        description: description || `Achat chez ${merchant.name}`,
        reference: transactionIdValue,
        customer_id: customer?.id || null,
        merchant_id: merchantId,
        user_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (txError) throw txError;

    // 6. ✅ CORRECTION : Mettre à jour le client (Solde, Points, Total dépensé, VIP)
    if (customer) {
      const newTotalSpent = (customer.totalSpent || 0) + amount;
      const newPoints = (customer.loyaltyPoints || 0) + pointsEarned;

      let vipLevel = customer.vipLevel || 'bronze';
      if (newPoints >= 10000) vipLevel = 'platinum';
      else if (newPoints >= 5000) vipLevel = 'gold';
      else if (newPoints >= 2000) vipLevel = 'silver';

      const updateData = {
        totalSpent: newTotalSpent,
        loyaltyPoints: newPoints,
        vipLevel: vipLevel,
        updatedAt: new Date().toISOString()
      };

      // ✅ C'est ici que le solde était oublié ! On l'ajoute :
      if (paymentMethod === 'wallet') {
        updateData.walletBalance = newWalletBalance;
      }

      await supabase.from('Customers').update(updateData).eq('id', customer.id);

      // Historique des points
      await supabase.from('PointsHistory').insert({
        customer_id: customer.id,
        points: pointsEarned,
        type: 'earned',
        reason: `Achat de ${amount.toLocaleString()} FCFA chez ${merchant.name}`,
        transaction_id: transactionIdValue,
        created_at: new Date().toISOString()
      });
    }

    // 7. Mettre à jour le stock des produits (si tableau items fourni)
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (item.productId) {
          const { data: product } = await supabase.from('Products').select('id, stock').eq('id', item.productId).single();
          if (product) {
            const quantityToDeduct = parseInt(item.quantity) || 1;
            const newStock = Math.max(0, (product.stock || 0) - quantityToDeduct);
            await supabase.from('Products').update({ stock: newStock, lastStockUpdate: new Date().toISOString() }).eq('id', product.id);
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Paiement effectué avec succès',
      transaction: {
        id: transactionIdValue,
        amount: amount,
        pointsEarned: pointsEarned,
        newBalance: paymentMethod === 'wallet' ? newWalletBalance : (customer ? customer.walletBalance : 0),
        merchant: merchant.name,
        date: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error processing purchase:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== ACHAT SIMPLE (sans items) ====================
// Route alternative pour les achats sans détails de produits
router.post('/purchase-simple', auth, async (req, res) => {
  try {
    const { amount, merchantId, productId, description, paymentMethod } = req.body;
    const userId = req.user.id;

    console.log('🛒 Achat simple:', { userId, amount, merchantId, productId });

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Montant invalide' });
    }
    if (!merchantId) {
      return res.status(400).json({ message: 'Commerçant requis' });
    }

    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    let { data: customer, error: customerError } = await supabase
      .from('Customers')
      .select('*')
      .eq('phoneNumber', user.phone)
      .single();

    if (customerError || !customer) {
      const { data: newCustomer, error: createError } = await supabase
        .from('Customers')
        .insert([{
          id: uuidv4(),
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

      if (createError) {
        return res.status(500).json({ message: 'Erreur création client' });
      }
      customer = newCustomer;
    }

    const walletBalance = customer.walletBalance || 0;
    if (walletBalance < amount) {
      return res.status(400).json({
        message: 'Solde insuffisant',
        balance: walletBalance,
        required: amount
      });
    }

    const { data: merchant, error: merchantError } = await supabase
      .from('Merchants')
      .select('*')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant) {
      return res.status(404).json({ message: 'Commerçant non trouvé' });
    }

    const pointsEarned = Math.floor(amount / 100);
    const transactionIdValue = `PUR_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data: transaction, error: txError } = await supabase
      .from('Transactions')
      .insert({
        id: uuidv4(),
        transaction_id: transactionIdValue,
        amount: amount,
        type: 'purchase',
        method: paymentMethod || 'wallet',
        status: 'completed',
        points_earned: pointsEarned,
        description: description || `Achat chez ${merchant.name}`,
        reference: transactionIdValue,
        customer_id: customer.id,
        merchant_id: merchantId,
        product_id: productId || null,
        user_id: userId,
        created_at: new Date().toISOString()
      })
      .select();

    if (txError) {
      console.error('Erreur insertion transaction:', txError);
      throw txError;
    }

    const newBalance = walletBalance - amount;
    const newTotalSpent = (customer.totalSpent || 0) + amount;
    const newPoints = (customer.loyaltyPoints || 0) + pointsEarned;

    let vipLevel = customer.vipLevel;
    if (newPoints >= 10000) vipLevel = 'platinum';
    else if (newPoints >= 5000) vipLevel = 'gold';
    else if (newPoints >= 2000) vipLevel = 'silver';

    const { error: updateError } = await supabase
      .from('Customers')
      .update({
        walletBalance: newBalance,
        totalSpent: newTotalSpent,
        loyaltyPoints: newPoints,
        vipLevel: vipLevel,
        updatedAt: new Date().toISOString()
      })
      .eq('id', customer.id);

    if (updateError) throw updateError;

    await supabase
      .from('PointsHistory')
      .insert({
        customer_id: customer.id,
        points: pointsEarned,
        type: 'earned',
        reason: `Achat de ${amount.toLocaleString()} FCFA chez ${merchant.name}`,
        transaction_id: transactionIdValue,
        created_at: new Date().toISOString()
      });

    // ✅ Mise à jour du stock pour un seul produit
    if (productId) {
      const { data: product, error: productError } = await supabase
        .from('Products')
        .select('*')
        .eq('id', productId)
        .eq('merchant_id', merchantId)
        .single();

      if (!productError && product) {
        const newStock = Math.max(0, (product.stock || 0) - 1);
        const { error: updateStockError } = await supabase
          .from('Products')
          .update({
            stock: newStock,
            lastStockUpdate: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateStockError) {
          console.error('Erreur mise à jour stock:', updateStockError);
        } else {
          console.log(`✅ Stock mis à jour: ${product.name} → ${newStock}`);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Paiement effectué avec succès',
      transaction: {
        id: transactionIdValue,
        amount: amount,
        pointsEarned: pointsEarned,
        newBalance: newBalance,
        merchant: merchant.name,
        date: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error processing purchase:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== CASHBACK ====================
router.post('/cashback', auth, async (req, res) => {
  try {
    const { customerId, amount, reason } = req.body;
    const userId = req.user.id;

    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || (user.role !== 'admin' && user.role !== 'merchant')) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const { data: customer, error: customerError } = await supabase
      .from('Customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    const transactionId = `CASH_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data: transaction, error: txError } = await supabase
      .from('Transactions')
      .insert([{
        id: uuidv4(),
        transaction_id: transactionId,
        amount: amount,
        type: 'cashback',
        method: 'cashback',
        status: 'completed',
        points_earned: 0,
        description: reason || 'Cashback fidélité',
        reference: transactionId,
        customer_id: customerId,
        user_id: userId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (txError) throw txError;

    const newBalance = (customer.walletBalance || 0) + amount;
    const { error: updateError } = await supabase
      .from('Customers')
      .update({
        walletBalance: newBalance,
        updatedAt: new Date().toISOString()
      })
      .eq('id', customerId);

    if (updateError) throw updateError;

    res.status(201).json({
      success: true,
      message: `Cashback de ${amount} FCFA ajouté`,
      transaction: {
        id: transaction.transaction_id,
        amount: amount,
        newBalance: newBalance
      }
    });
  } catch (error) {
    console.error('Error processing cashback:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== REMBOURSEMENT ====================
router.post('/:id/refund', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason, partialRefund } = req.body;
    const userId = req.user.id;

    const { data: originalTx, error: txError } = await supabase
      .from('Transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (txError || !originalTx) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }

    if (originalTx.status === 'refunded') {
      return res.status(400).json({ message: 'Transaction déjà remboursée' });
    }

    const refundAmount = partialRefund ? amount : originalTx.amount;

    const { data: customer, error: customerError } = await supabase
      .from('Customers')
      .select('*')
      .eq('id', originalTx.customer_id)
      .single();

    if (customerError || !customer) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    const transactionId = `REF_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data: refundTx, error: refundError } = await supabase
      .from('Transactions')
      .insert([{
        id: uuidv4(),
        transaction_id: transactionId,
        amount: refundAmount,
        type: 'refund',
        method: originalTx.method,
        status: 'completed',
        points_earned: 0,
        description: reason || `Remboursement de ${originalTx.transaction_id}`,
        reference: originalTx.transaction_id,
        customer_id: originalTx.customer_id,
        merchant_id: originalTx.merchant_id,
        user_id: userId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (refundError) throw refundError;

    const newBalance = (customer.walletBalance || 0) + refundAmount;
    const newTotalSpent = Math.max(0, (customer.totalSpent || 0) - refundAmount);

    const { error: updateError } = await supabase
      .from('Customers')
      .update({
        walletBalance: newBalance,
        totalSpent: newTotalSpent,
        updatedAt: new Date().toISOString()
      })
      .eq('id', customer.id);

    if (updateError) throw updateError;

    await supabase
      .from('Transactions')
      .update({ status: 'refunded' })
      .eq('id', originalTx.id);

    res.json({
      success: true,
      message: 'Remboursement effectué',
      refund: {
        id: refundTx.transaction_id,
        amount: refundAmount,
        newBalance: newBalance
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== STATISTIQUES ====================
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: transactions, error } = await supabase
      .from('Transactions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const totalRecharge = transactions
      .filter(t => t.type === 'recharge' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPurchase = transactions
      .filter(t => t.type === 'purchase' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCashback = transactions
      .filter(t => t.type === 'cashback' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      totalRecharge,
      totalPurchase,
      totalCashback,
      totalTransactions: transactions.length,
      lastTransaction: transactions[0] || null
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== EXPORT ====================
router.get('/export/:format', auth, async (req, res) => {
  try {
    const { format } = req.params;
    const userId = req.user.id;

    const { data: transactions, error } = await supabase
      .from('Transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (format === 'csv') {
      let csv = 'ID,Date,Montant,Type,Statut,Description\n';
      transactions.forEach(t => {
        csv += `${t.transaction_id},${t.created_at},${t.amount},${t.type},${t.status},${t.description}\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=transactions_${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json(transactions);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== GET ALL TRANSACTIONS ====================
router.get('/', auth, async (req, res) => {
  try {
    console.log('📊 Récupération des transactions pour user:', req.user.id, 'role:', req.user.role);
    console.log('📊 Query params:', req.query);

    let query = supabase
      .from('Transactions')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtrer par merchantId si présent (pour admin)
    if (req.query.merchantId) {
      console.log('📊 Filtrer par merchantId:', req.query.merchantId);
      query = query.eq('merchant_id', req.query.merchantId);
    }
    // Filtrer par rôle utilisateur
    else if (req.user.role === 'customer') {
      query = query.or(`user_id.eq.${req.user.id},customer_id.eq.${req.user.id}`);
    }
    else if (req.user.role === 'merchant') {
      const merchantId = req.user.merchantId;
      if (!merchantId) {
        return res.status(403).json({ message: 'Commerçant non identifié' });
      }
      query = query.eq('merchant_id', merchantId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: error.message });
    }

    console.log(`✅ ${data?.length || 0} transactions chargées`);
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== CREATE TRANSACTION ====================
router.post('/', auth, async (req, res) => {
  try {
    const newTransaction = {
      id: uuidv4(),
      ...req.body,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('Transactions')
      .insert([newTransaction])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== GET TRANSACTION BY ID ====================
router.get('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Transactions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Transaction not found' });
    res.json(data);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== UPDATE TRANSACTION STATUS ====================
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Transactions')
      .update({ status: req.body.status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== DELETE TRANSACTION ====================
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('Transactions')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: error.message });
  }
});

// Pending orders
router.get('/orders/pending', auth, async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
