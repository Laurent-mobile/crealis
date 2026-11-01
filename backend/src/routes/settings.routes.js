// backend/src/routes/settings.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');

// Get all settings
router.get('/', auth, async (req, res) => {
    try {
        console.log('🔧 Route /api/settings appelée');
        console.log('🔑 Utilisateur:', req.user);

        const { data, error } = await supabase
            .from('AppSettings')
            .select('*');

        console.log('📦 Données brutes:', data);

        if (error) {
            console.error('❌ Erreur:', error);
            throw error;
        }

        const settings = {};
        (data || []).forEach(item => {
            settings[item.key] = item.value;
        });

        console.log('✅ Paramètres envoyés:', settings);
        res.json(settings);
    } catch (error) {
        console.error('❌ Erreur:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get setting by key
router.get('/:key', auth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('AppSettings')
            .select('value, type')
            .eq('key', req.params.key)
            .single();

        if (error) throw error;

        let value = data.value;
        if (data.type === 'number') value = parseFloat(value);
        if (data.type === 'boolean') value = value === 'true';
        if (data.type === 'json') value = JSON.parse(value);

        res.json({ [req.params.key]: value });
    } catch (error) {
        console.error('Error fetching setting:', error);
        res.status(500).json({ message: error.message });
    }
});

// ✅ ROUTE SPÉCIFIQUE POUR LA LIVRAISON (GET)
router.get('/livraison', auth, async (req, res) => {
    try {
        const keys = ['prix_par_km', 'distance_max', 'frais_min', 'frais_max', 'commande_min', 'delai_livraison', 'zones_couvertes', 'livraison_gratuite_des'];

        const { data, error } = await supabase
            .from('AppSettings')
            .select('key, value, type')
            .in('key', keys);

        if (error) throw error;

        // Construire l'objet de retour
        const result = {
            prix_par_km: 200,
            distance_max: 20,
            frais_min: 500,
            frais_max: 3000,
            commande_min: 2000,
            delai_livraison: 45,
            zones_couvertes: 'Ouagadougou, Bobo-Dioulasso, Koudougou',
            livraison_gratuite_des: 50000
        };

        // Mettre à jour avec les valeurs de la base
        (data || []).forEach(item => {
            let value = item.value;
            if (item.type === 'number') value = parseFloat(value);
            if (item.type === 'boolean') value = value === 'true';
            if (item.type === 'json') value = JSON.parse(value);
            result[item.key] = value;
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching delivery settings:', error);
        // Retourner les valeurs par défaut en cas d'erreur
        res.json({
            prix_par_km: 200,
            distance_max: 20,
            frais_min: 500,
            frais_max: 3000,
            commande_min: 2000,
            delai_livraison: 45,
            zones_couvertes: 'Ouagadougou, Bobo-Dioulasso, Koudougou',
            livraison_gratuite_des: 50000
        });
    }
});

// ✅ ROUTE SPÉCIFIQUE POUR LA LIVRAISON (PUT - Mise à jour multiple)
router.put('/livraison', auth, async (req, res) => {
    try {
        const deliverySettings = req.body;
        const results = {};

        for (const [key, value] of Object.entries(deliverySettings)) {
            const type = typeof value;
            let stringValue = value;
            if (typeof value === 'object') stringValue = JSON.stringify(value);
            if (typeof value === 'boolean') stringValue = value.toString();
            if (typeof value === 'number') stringValue = value.toString();

            const { data, error } = await supabase
                .from('AppSettings')
                .update({
                    value: stringValue,
                    type: type,
                    updatedAt: new Date().toISOString()
                })
                .eq('key', key)
                .select()
                .single();

            if (!error && data) {
                let returnValue = data.value;
                if (data.type === 'number') returnValue = parseFloat(returnValue);
                if (data.type === 'boolean') returnValue = returnValue === 'true';
                if (data.type === 'json') returnValue = JSON.parse(returnValue);
                results[key] = returnValue;
            }
        }

        res.json(results);
    } catch (error) {
        console.error('Error updating delivery settings:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update setting
router.put('/:key', auth, async (req, res) => {
    try {
        const { value, type } = req.body;

        let stringValue = value;
        if (typeof value === 'object') stringValue = JSON.stringify(value);
        if (typeof value === 'boolean') stringValue = value.toString();
        if (typeof value === 'number') stringValue = value.toString();

        const { data, error } = await supabase
            .from('AppSettings')
            .update({
                value: stringValue,
                type: type || typeof value,
                updatedAt: new Date().toISOString()
            })
            .eq('key', req.params.key)
            .select()
            .single();

        if (error) throw error;

        let returnValue = data.value;
        if (data.type === 'number') returnValue = parseFloat(returnValue);
        if (data.type === 'boolean') returnValue = returnValue === 'true';
        if (data.type === 'json') returnValue = JSON.parse(returnValue);

        res.json({ [data.key]: returnValue });
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ message: error.message });
    }
});

// Batch update settings
router.post('/batch', auth, async (req, res) => {
    try {
        const settings = req.body;
        const results = {};

        for (const [key, value] of Object.entries(settings)) {
            const type = typeof value;
            let stringValue = value;
            if (typeof value === 'object') stringValue = JSON.stringify(value);
            if (typeof value === 'boolean') stringValue = value.toString();
            if (typeof value === 'number') stringValue = value.toString();

            const { data, error } = await supabase
                .from('AppSettings')
                .update({
                    value: stringValue,
                    type: type,
                    updatedAt: new Date().toISOString()
                })
                .eq('key', key)
                .select()
                .single();

            if (!error && data) {
                let returnValue = data.value;
                if (data.type === 'number') returnValue = parseFloat(returnValue);
                if (data.type === 'boolean') returnValue = returnValue === 'true';
                if (data.type === 'json') returnValue = JSON.parse(returnValue);
                results[key] = returnValue;
            }
        }

        res.json(results);
    } catch (error) {
        console.error('Error batch updating settings:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;