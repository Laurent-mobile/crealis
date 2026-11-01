// backend/src/routes/auth.routes.js (version corrigée)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');

// Login avec logs de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Récupérer l'IP du client
    const getClientIp = (req) => {
      return req.headers['x-forwarded-for']?.split(',')[0] ||
        req.socket?.remoteAddress ||
        req.ip ||
        'unknown';
    };

    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    const { data: user, error } = await supabase
      .from('Users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      // Enregistrer la tentative échouée
      await supabase.from('LoginLogs').insert({
        user_email: email,
        user_role: 'unknown',
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'failed',
        error_message: 'Utilisateur non trouvé',
        login_at: new Date().toISOString()
      });
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      // Enregistrer la tentative échouée
      await supabase.from('LoginLogs').insert({
        user_id: user.id,
        user_email: user.email,
        user_role: user.role,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'failed',
        error_message: 'Mot de passe incorrect',
        login_at: new Date().toISOString()
      });
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Enregistrer la connexion réussie
    await supabase.from('LoginLogs').insert({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: 'success',
      login_at: new Date().toISOString()
    });

    // Récupérer le merchant si l'utilisateur est un commerçant
    let merchant = null;
    if (user.role === 'merchant' && user.merchantId) {
      const { data: merchantData } = await supabase
        .from('Merchants')
        .select('*')
        .eq('id', user.merchantId)
        .single();
      merchant = merchantData;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, merchantId: user.merchantId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        merchantId: user.merchantId,
        merchant: merchant
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Récupérer les logs de connexion (admin uniquement)
router.get('/login-logs', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const { limit = 100, offset = 0, userId, status, startDate, endDate } = req.query;

    let query = supabase
      .from('LoginLogs')
      .select('*')
      .order('login_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('login_at', startDate);
    }
    if (endDate) {
      query = query.lte('login_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Récupérer le nombre total
    const { count, error: countError } = await supabase
      .from('LoginLogs')
      .select('*', { count: 'exact', head: true });

    res.json({
      logs: data || [],
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching login logs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Récupérer les statistiques des logs
router.get('/login-logs/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Nombre total de connexions aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todayCount } = await supabase
      .from('LoginLogs')
      .select('*', { count: 'exact', head: true })
      .gte('login_at', today.toISOString());

    // Nombre de connexions ce mois
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const { count: monthCount } = await supabase
      .from('LoginLogs')
      .select('*', { count: 'exact', head: true })
      .gte('login_at', startOfMonth.toISOString());

    // Taux de succès
    const { count: totalCount } = await supabase
      .from('LoginLogs')
      .select('*', { count: 'exact', head: true });

    const { count: successCount } = await supabase
      .from('LoginLogs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success');

    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

    res.json({
      today: todayCount || 0,
      thisMonth: monthCount || 0,
      total: totalCount || 0,
      successRate: Math.round(successRate)
    });
  } catch (error) {
    console.error('Error fetching login stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Inscription commerçant (sans UUID pour merchantId)
router.post('/register-merchant', async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      businessName,
      businessType,
      city,
      address,
      registrationNumber
    } = req.body;

    // 1. Vérifier si l'email existe déjà
    const { data: existingUser, error: checkError } = await supabase
      .from('Users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // 2. Générer un ID simple pour le commerçant (timestamp + random)
    const merchantId = `MERC_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 3. Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Créer d'abord le commerçant
    const { data: merchant, error: merchantError } = await supabase
      .from('Merchants')
      .insert([{
        id: merchantId,
        name: businessName,
        category: businessType || 'general',
        city: city || 'Ouagadougou',
        phone: phone,
        email: email,
        address: address || null,
        registration_number: registrationNumber || null,
        cashback_percent: 2.5,
        is_active: true,
        is_verified: false,
        subscription_plan: 'basic',
        subscription_status: 'trial',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (merchantError) {
      console.error('Merchant creation error:', merchantError);
      throw merchantError;
    }

    // 5. Créer l'utilisateur avec le rôle 'merchant'
    const { data: user, error: userError } = await supabase
      .from('Users')
      .insert([{
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: 'merchant',
        merchantId: merchantId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      // Rollback: supprimer le commerçant créé
      await supabase.from('Merchants').delete().eq('id', merchantId);
      throw userError;
    }

    // 6. Générer le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, merchantId: merchantId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'Commerçant inscrit avec succès',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        merchantId: merchantId,
        merchant: merchant
      }
    });

  } catch (error) {
    console.error('Register merchant error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Vérifier si un email est disponible
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const { data, error } = await supabase
      .from('Users')
      .select('id')
      .eq('email', email)
      .single();

    res.json({ available: !data });
  } catch (error) {
    res.json({ available: true });
  }
});

// Récupérer les infos du commerçant connecté
router.get('/me', async (req, res) => {
  try {
    const token = req.headers['x-auth-token'] || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user, error } = await supabase
      .from('Users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    let merchant = null;
    if (user.merchantId) {
      const { data: merchantData } = await supabase
        .from('Merchants')
        .select('*')
        .eq('id', user.merchantId)
        .single();
      merchant = merchantData;
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      merchantId: user.merchantId,
      merchant: merchant
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: error.message });
  }
});
// Inscription client (NOUVEAU)
router.post('/register', async (req, res) => {
  try {
    const {
      phoneNumber,
      firstName,
      lastName,
      email,
      password
    } = req.body;

    // 1. Vérifier si l'email existe déjà
    const { data: existingUser, error: checkError } = await supabase
      .from('Users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // 2. Vérifier si le téléphone existe déjà
    const { data: existingCustomer, error: checkCustomerError } = await supabase
      .from('Customers')
      .select('id')
      .eq('phoneNumber', phoneNumber)
      .single();

    if (existingCustomer) {
      return res.status(400).json({ message: 'Ce numéro de téléphone est déjà utilisé' });
    }

    // 3. Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Créer d'abord le client
    const { data: customer, error: customerError } = await supabase
      .from('Customers')
      .insert([{
        phoneNumber: phoneNumber,
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

    if (customerError) {
      console.error('Customer creation error:', customerError);
      throw customerError;
    }

    // 5. Créer l'utilisateur avec le rôle 'customer'
    const { data: user, error: userError } = await supabase
      .from('Users')
      .insert([{
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phoneNumber,
        role: 'customer',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      // Rollback: supprimer le client créé
      await supabase.from('Customers').delete().eq('id', customer.id);
      throw userError;
    }

    // 6. Générer le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'Client inscrit avec succès',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        customer: customer
      }
    });

  } catch (error) {
    console.error('Register customer error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
