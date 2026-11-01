//backend/src/routes/supplier.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');

// Get all suppliers
router.get('/', auth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('Suppliers')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get supplier by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('Suppliers')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching supplier:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create supplier
router.post('/', auth, async (req, res) => {
    try {
        const supplierData = {
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('Suppliers')
            .insert([supplierData])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update supplier
router.put('/:id', auth, async (req, res) => {
    try {
        const updateData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('Suppliers')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete supplier
router.delete('/:id', auth, async (req, res) => {
    try {
        const { error } = await supabase
            .from('Suppliers')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
