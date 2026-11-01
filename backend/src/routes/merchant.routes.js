//backend/src/routes/merchant.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');

// Get all merchants
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Merchants')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching merchants:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get merchant by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Merchants')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Merchant not found' });
    res.json(data);
  } catch (error) {
    console.error('Error fetching merchant:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create merchant - Version avec ID généré
router.post('/', auth, async (req, res) => {
  try {
    console.log('📦 Données reçues:', req.body);

    // Générer un ID unique
    const { v4: uuidv4 } = require('uuid');

    // Utiliser UNIQUEMENT les colonnes qui existent dans ta table
    const merchantData = {
      id: uuidv4(), // ← Ajouter l'ID généré
      businessName: req.body.businessName,
      category: req.body.category || 'supermarket',
      city: req.body.city || 'Ouagadougou',
      latitude: req.body.latitude ? parseFloat(req.body.latitude) : null,
      longitude: req.body.longitude ? parseFloat(req.body.longitude) : null,
      cashback_percent: parseFloat(req.body.commissionRate) || 2.5,
      is_active: true,
      created_at: new Date().toISOString()
    };

    console.log('📦 Données à insérer:', merchantData);

    const { data, error } = await supabase
      .from('Merchants')
      .insert([merchantData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('✅ Merchant créé:', data);
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Error creating merchant:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update merchant
router.put('/:id', auth, async (req, res) => {
  try {
    const updateData = {};

    // Mapper les champs correctement
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.city !== undefined) updateData.city = req.body.city;
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.subscription_plan !== undefined) updateData.subscription_plan = req.body.subscription_plan;
    if (req.body.subscription_status !== undefined) updateData.subscription_status = req.body.subscription_status;
    if (req.body.commission_rate !== undefined) updateData.commission_rate = parseFloat(req.body.commission_rate);
    if (req.body.cashback_percent !== undefined) updateData.cashback_percent = parseFloat(req.body.cashback_percent);
    if (req.body.latitude !== undefined) updateData.latitude = req.body.latitude;
    if (req.body.longitude !== undefined) updateData.longitude = req.body.longitude;
    if (req.body.is_verified !== undefined) updateData.is_verified = req.body.is_verified;

    console.log('🔄 Mise à jour:', updateData);

    const { data, error } = await supabase
      .from('Merchants')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Mis à jour:', data);
    res.json(data);
  } catch (error) {
    console.error('Error updating merchant:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete merchant
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('Merchants')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Merchant deleted successfully' });
  } catch (error) {
    console.error('Error deleting merchant:', error);
    res.status(500).json({ message: error.message });
  }
});

// Verify merchant
router.put('/:id/verify', auth, async (req, res) => {
  try {
    const { isVerified } = req.body;

    const { data, error } = await supabase
      .from('Merchants')
      .update({ is_verified: isVerified })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('✅ Merchant verified:', data);
    res.json(data);
  } catch (error) {
    console.error('Error verifying merchant:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
