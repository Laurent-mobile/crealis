//backend/src/routes/category.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');

// Get all categories
router.get('/', auth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('Categories')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get category by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('Categories')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create category
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, icon } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Le nom de la catégorie est requis' });
        }

        const { data, error } = await supabase
            .from('Categories')
            .insert([{
                name,
                description: description || null,
                icon: icon || '📦',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update category
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, description, icon, isActive } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (icon !== undefined) updateData.icon = icon;
        if (isActive !== undefined) updateData.isActive = isActive;
        updateData.updatedAt = new Date().toISOString();

        const { data, error } = await supabase
            .from('Categories')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete category
router.delete('/:id', auth, async (req, res) => {
    try {
        // Vérifier si des produits utilisent cette catégorie
        const { data: products, error: checkError } = await supabase
            .from('Products')
            .select('id')
            .eq('category', req.params.id)
            .limit(1);

        if (products && products.length > 0) {
            return res.status(400).json({
                message: 'Impossible de supprimer cette catégorie car elle est utilisée par des produits'
            });
        }

        const { error } = await supabase
            .from('Categories')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Catégorie supprimée avec succès' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
