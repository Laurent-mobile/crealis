//backend/src/routes/pos.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');  // ← Ajoutez cette ligne
const jwt = require('jsonwebtoken');

// Get all POS devices - avec jointure vers merchants
router.get('/', auth, async (req, res) => {
  try {
    // Récupérer tous les terminaux
    const { data: devices, error } = await supabase
      .from('POSDevices')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    // Récupérer les IDs des commerçants uniques
    const merchantIds = [...new Set(devices.map(d => d.merchantId).filter(Boolean))];

    // Récupérer les informations des commerçants
    let merchants = [];
    if (merchantIds.length > 0) {
      const { data: merchantsData } = await supabase
        .from('Merchants')
        .select('id, name, businessName')
        .in('id', merchantIds);
      merchants = merchantsData || [];
    }

    // Associer les commerçants aux terminaux
    const devicesWithMerchants = devices.map(device => ({
      ...device,
      merchant: merchants.find(m => m.id === device.merchantId)
    }));

    res.json(devicesWithMerchants);
  } catch (error) {
    console.error('Error fetching POS devices:', error);
    res.status(500).json({ message: error.message });
  }
});

// Register POS device
router.post('/register', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('POSDevices')
      .insert([{
        deviceId: req.body.deviceId,
        model: req.body.model || 'Z108',
        serialNumber: req.body.serialNumber,
        merchantId: req.body.merchantId,
        location: req.body.location || null,
        status: 'active',
        lastSync: new Date().toISOString(),
        firmwareVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error registering POS device:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update POS device
router.put('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('POSDevices')
      .update({
        ...req.body,
        updatedAt: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating POS device:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update POS status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('POSDevices')
      .update({
        status: req.body.status,
        updatedAt: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating POS status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete POS device
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('POSDevices')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'POS device deleted successfully' });
  } catch (error) {
    console.error('Error deleting POS device:', error);
    res.status(500).json({ message: error.message });
  }
});

// Sync POS - Corrigé pour utiliser l'ID UUID
router.post('/sync', auth, async (req, res) => {
  try {
    // Récupérer l'ID du device depuis le token
    const deviceId = req.user.deviceId;  // C'est l'UUID

    const { data, error } = await supabase
      .from('POSDevices')
      .update({
        lastSync: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', deviceId)  // Utiliser l'ID UUID, pas le deviceId texte
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, lastSync: data.lastSync });
  } catch (error) {
    console.error('Error syncing POS:', error);
    res.status(500).json({ message: error.message });
  }
});

// Login POS (authentification du terminal) - Version corrigée
router.post('/login', async (req, res) => {
  try {
    const { deviceId, pin } = req.body;

    console.log('🔐 ===== POS LOGIN ATTEMPT =====');
    console.log('📱 deviceId reçu:', deviceId);

    // Récupérer le terminal
    const { data: device, error } = await supabase
      .from('POSDevices')
      .select('*')
      .eq('deviceId', deviceId)
      .single();

    console.log('device trouvé:', device ? 'OUI' : 'NON');
    console.log('device.merchantId (UUID):', device?.merchantId);

    if (error || !device) {
      console.log('❌ Terminal non trouvé');
      return res.status(401).json({ message: 'Terminal non reconnu' });
    }

    if (device.status !== 'active') {
      return res.status(401).json({ message: 'Terminal désactivé' });
    }

    // Vérification du PIN
    if (pin !== '1234') {
      return res.status(401).json({ message: 'PIN incorrect' });
    }

    // Récupérer les infos du commerçant - CORRIGÉ
    let merchant = null;
    if (device.merchantId) {
      console.log('🔍 Recherche du commerçant avec uuid_id:', device.merchantId);

      // Chercher par uuid_id (c'est la colonne qui contient l'UUID)
      const { data: merchantData, error: merchantError } = await supabase
  .from('Merchants')
  .select('*')
  .eq('id', device.merchantId)
  .single();

      if (merchantError) {
        console.log('Erreur recherche par uuid_id:', merchantError.message);
      }

      if (merchantData) {
        merchant = merchantData;
        console.log('🏪 Marchand trouvé par uuid_id:', merchant.name);
      } else {
        // Si pas trouvé, essayer par id texte
        console.log('🔍 Recherche par id texte...');
        const { data: merchantData2 } = await supabase
          .from('Merchants')
          .select('*')
          .eq('id', device.merchantId)
          .single();
        merchant = merchantData2;
        if (merchant) {
          console.log('🏪 Marchand trouvé par id texte:', merchant.name);
        }
      }
    }

    // Si toujours pas de marchand, chercher dans la liste des marchands existants
    if (!merchant) {
      console.log('⚠️ Recherche de tous les marchands...');
      const { data: allMerchants } = await supabase
        .from('Merchants')
        .select('*');
      console.log('Marchands disponibles:', allMerchants?.map(m => ({ id: m.id, uuid_id: m.uuid_id, name: m.name })));

      // Prendre le premier marchand
      if (allMerchants && allMerchants.length > 0) {
        merchant = allMerchants[0];
        console.log('📌 Marchand par défaut utilisé:', merchant.name);
      }
    }

    // Mettre à jour lastSync
    await supabase
      .from('POSDevices')
      .update({ lastSync: new Date().toISOString() })
      .eq('id', device.id);

    // Générer un token
    const token = jwt.sign(
      {
        deviceId: device.id,
        merchantId: device.merchantId,
        role: 'pos'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ Login réussi pour:', merchant?.name || 'Unknown');
    console.log('📦 Merchant envoyé:', merchant ? { id: merchant.id, name: merchant.name } : null);

    res.json({
      token,
      merchant: merchant ? {
        id: merchant.id,
        name: merchant.name,
        city: merchant.city,
        businessName: merchant.name
      } : null,
      device: {
        id: device.id,
        deviceId: device.deviceId,
        model: device.model
      }
    });

  } catch (error) {
    console.error('❌ POS login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Synchronisation du POS - Version corrigée pour le frontend
router.post('/:deviceId/sync', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const merchantId = req.merchantId;

    console.log('🔄 Sync POS:', deviceId);

    // Mettre à jour lastSync du device
    const { error: deviceError } = await supabase
      .from('POSDevices')
      .update({
        lastSync: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('deviceId', deviceId);

    if (deviceError) {
      console.error('Erreur update device:', deviceError);
    }

    // Récupérer les mises à jour produits
    const { data: products, error: productsError } = await supabase
      .from('Products')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('isActive', true);

    if (productsError) throw productsError;

    // Récupérer les alertes stock bas
    const lowStockProducts = products?.filter(p => p.stock <= (p.minStockAlert || 10) && p.stock > 0) || [];
    const outOfStockProducts = products?.filter(p => p.stock === 0) || [];

    // Récupérer les commandes en ligne en attente
    const { data: pendingOrders, error: ordersError } = await supabase
      .from('Orders')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('type', 'online')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Erreur orders:', ordersError);
    }

    // Récupérer les promotions actives
    const { data: promotions } = await supabase
      .from('Promotions')
      .select('*')
      .eq('merchantId', merchantId)
      .eq('isActive', true)
      .lte('startDate', new Date().toISOString())
      .gte('endDate', new Date().toISOString());

    res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      products: products || [],
      alerts: {
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts
      },
      pendingOnlineOrders: pendingOrders || [],
      activePromotions: promotions || [],
      message: 'Synchronisation réussie'
    });

  } catch (error) {
    console.error('❌ Sync error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Récupérer les produits du commerçant pour le POS
router.get('/products', auth, async (req, res) => {
  try {
    const merchantId = req.merchantId;

    console.log('🔍 ===== PRODUCTS REQUEST =====');
    console.log('📦 merchantId from token:', merchantId);
    console.log('📦 Type of merchantId:', typeof merchantId);

    // Test avec l'ID texte directement
    const textId = 'MERC_1780503831417_4V1QWH';

    const { data, error } = await supabase
      .from('Products')
      .select('*')
      .eq('merchant_id', textId)
      .eq('isActive', true);

    console.log('📊 Query result:', { count: data?.length, error: error?.message });
    console.log('📝 First product:', data?.[0]);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching POS products:', error);
    res.status(500).json({ message: error.message });
  }
});

// Détecter les achats en ligne (synchronisation)
router.get('/online-orders', auth, async (req, res) => {
  try {
    const merchantId = req.merchantId;

    // Récupérer les commandes en ligne non encore traitées
    const { data, error } = await supabase
      .from('Orders')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('type', 'online')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching online orders:', error);
    res.status(500).json({ message: error.message });
  }
});

// Marquer une commande en ligne comme récupérée/retirée
router.put('/online-orders/:id/collect', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('Orders')
      .update({
        status: 'collected',
        collected_at: new Date().toISOString(),
        collected_by: req.user.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error collecting order:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get POS stats
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const { data: devices, error } = await supabase
      .from('POSDevices')
      .select('*');

    if (error) throw error;

    const stats = {
      total: devices?.length || 0,
      active: devices?.filter(d => d.status === 'active').length || 0,
      inactive: devices?.filter(d => d.status === 'inactive').length || 0,
      maintenance: devices?.filter(d => d.status === 'maintenance').length || 0,
      recentlySynced: devices?.filter(d => {
        if (!d.lastSync) return false;
        const hoursSinceSync = (new Date() - new Date(d.lastSync)) / (1000 * 60 * 60);
        return hoursSinceSync < 24;
      }).length || 0,
      byModel: {
        Z108: devices?.filter(d => d.model === 'Z108').length || 0,
        Z110: devices?.filter(d => d.model === 'Z110').length || 0,
        other: devices?.filter(d => d.model !== 'Z108' && d.model !== 'Z110').length || 0
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching POS stats:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
