//backend/src/routes/product.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');
const upload = require('../services/upload');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Assurer que le dossier uploads existe
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload d'image pour un produit
router.post('/upload-image', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier uploadé' });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

        res.json({
            success: true,
            imageUrl: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: error.message });
    }
});

// Upload d'image avec mise à jour directe du produit
router.post('/:id/upload-image', auth, upload.single('image'), async (req, res) => {
    try {
        const productId = req.params.id;

        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier uploadé' });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

        const { data, error } = await supabase
            .from('Products')
            .update({ image_url: imageUrl })
            .eq('id', productId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            imageUrl: imageUrl,
            product: data
        });
    } catch (error) {
        console.error('Error uploading product image:', error);
        res.status(500).json({ message: error.message });
    }
});

// Supprimer l'image d'un produit
router.delete('/:id/image', auth, async (req, res) => {
    try {
        const productId = req.params.id;

        const { data: product, error: fetchError } = await supabase
            .from('Products')
            .select('image_url')
            .eq('id', productId)
            .single();

        if (fetchError) throw fetchError;

        if (product.image_url) {
            const filename = product.image_url.split('/').pop();
            const filePath = path.join(uploadsDir, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        const { data, error } = await supabase
            .from('Products')
            .update({ image_url: null })
            .eq('id', productId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, product: data });
    } catch (error) {
        console.error('Error deleting product image:', error);
        res.status(500).json({ message: error.message });
    }
});

// Servir les fichiers statiques (images uploadées)
router.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Get all products - Version admin (voit uniquement les produits de l'entrepôt)
// Get all products - Version avec filtre merchantId
router.get('/', auth, async (req, res) => {
    try {
        let query = supabase.from('Products').select('*');

        // Si un merchantId est spécifié dans la requête (pour admin qui consulte un commerçant)
        if (req.query.merchantId) {
            console.log('🔍 Filtrer par merchantId:', req.query.merchantId);
            query = query.eq('merchant_id', req.query.merchantId);
        }
        // Si l'utilisateur est admin et pas de merchantId spécifié -> produits entrepôt
        else if (req.user.role === 'admin') {
            query = query.is('merchant_id', null);
        }
        // Si l'utilisateur est commerçant -> ses produits
        else if (req.user.role === 'merchant') {
            const merchantId = req.user.merchantId;
            if (!merchantId) {
                return res.status(403).json({ message: 'Commerçant non identifié' });
            }
            query = query.eq('merchant_id', merchantId);
        }

        // Filtres supplémentaires
        if (req.query.search) {
            query = query.ilike('name', `%${req.query.search}%`);
        }
        if (req.query.category && req.query.category !== 'all') {
            query = query.eq('category', req.query.category);
        }

        const { data, error } = await query.order('name', { ascending: true });

        if (error) throw error;

        const stats = {
            total: data?.length || 0,
            totalValue: data?.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0) || 0,
            lowStock: data?.filter(p => (p.stock || 0) <= (p.minStockAlert || 10)).length || 0,
            outOfStock: data?.filter(p => (p.stock || 0) === 0).length || 0,
            needsReorder: data?.filter(p => (p.stock || 0) <= (p.reorderPoint || 20)).length || 0
        };

        res.json({ products: data || [], stats });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: error.message });
    }
});

// Top products - avec filtre commerçant
router.get('/top', auth, async (req, res) => {
    try {
        let query = supabase.from('Products').select('name, price, stock');

        if (req.user.role === 'merchant') {
            query = query.eq('merchant_id', req.user.merchantId);
        }

        const { data: products, error } = await query.limit(5);

        if (error) throw error;

        const topProducts = (products || []).map(p => ({
            name: p.name,
            sales: Math.floor(Math.random() * 200) + 50,
            revenue: (p.price || 1000) * (Math.floor(Math.random() * 200) + 50)
        }));

        res.json(topProducts);
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.json([]);
    }
});

// Get product by ID - avec vérification d'appartenance
router.get('/:id', auth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('Products')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) {
            console.error('Error fetching product:', error);
            return res.status(500).json({ message: error.message });
        }

        if (!data) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Vérifier que le commerçant a accès à ce produit
        if (req.user.role === 'merchant' && data.merchant_id !== req.user.merchantId) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create product - avec merchant_id automatique
router.post('/', auth, async (req, res) => {
    try {
        const productData = {
            id: uuidv4(),
            ...req.body,
            merchant_id: req.user.role === 'merchant' ? req.user.merchantId : req.body.merchant_id,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('Products')
            .insert([productData])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update product - avec vérification d'appartenance
router.put('/:id', auth, async (req, res) => {
    try {
        const productId = req.params.id;

        // Vérifier que le produit appartient au commerçant
        const { data: existingProduct, error: checkError } = await supabase
            .from('Products')
            .select('merchant_id')
            .eq('id', productId)
            .single();

        if (checkError || !existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (req.user.role === 'merchant' && existingProduct.merchant_id !== req.user.merchantId) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const { name, price, stock, category, brand, description, image_url } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (stock !== undefined) updateData.stock = parseInt(stock);
        if (category !== undefined) updateData.category = category;
        if (brand !== undefined) updateData.brand = brand;
        if (description !== undefined) updateData.description = description;
        if (image_url !== undefined) updateData.image_url = image_url;

        const { data, error } = await supabase
            .from('Products')
            .update(updateData)
            .eq('id', productId)
            .select();

        if (error) {
            console.error('Supabase update error:', error);
            return res.status(500).json({ message: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(data[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update stock - avec vérification d'appartenance
router.put('/:id/stock', auth, async (req, res) => {
    try {
        const { quantity, operation, reason } = req.body;

        const { data: product, error: fetchError } = await supabase
            .from('Products')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (req.user.role === 'merchant' && product.merchant_id !== req.user.merchantId) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        let newStock = product.stock || 0;
        if (operation === 'add') newStock += parseInt(quantity);
        else if (operation === 'remove') newStock -= parseInt(quantity);
        else if (operation === 'set') newStock = parseInt(quantity);

        const { data, error } = await supabase
            .from('Products')
            .update({
                stock: newStock,
                lastStockUpdate: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete product - avec vérification d'appartenance
router.delete('/:id', auth, async (req, res) => {
    try {
        const { data: existingProduct, error: checkError } = await supabase
            .from('Products')
            .select('merchant_id')
            .eq('id', req.params.id)
            .single();

        if (checkError || !existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (req.user.role === 'merchant' && existingProduct.merchant_id !== req.user.merchantId) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const { error } = await supabase
            .from('Products')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get categories
router.get('/categories/all', auth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('Categories')
            .select('*')
            .eq('isActive', true)
            .order('name', { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: error.message });
    }
});

// Low stock alerts - uniquement produits entrepôt pour admin
router.get('/alerts/low-stock', auth, async (req, res) => {
    try {
        let query = supabase.from('Products').select('*');

        // Pour admin, uniquement produits entrepôt
        if (req.user.role === 'admin') {
            query = query.is('merchant_id', null);
        }
        // Pour commerçant, uniquement ses produits
        else if (req.user.role === 'merchant') {
            query = query.eq('merchant_id', req.user.merchantId);
        }

        const { data, error } = await query;

        if (error) throw error;

        const lowStockProducts = (data || []).filter(p => (p.stock || 0) <= (p.minStockAlert || 10));

        const alerts = lowStockProducts.map(p => ({
            id: p.id,
            name: p.name,
            stock: p.stock,
            image_url: p.image_url,
            severity: p.stock === 0 ? 'critical' : 'warning',
            message: p.stock === 0
                ? `⚠️ Produit en rupture: ${p.name}`
                : `⚠️ Stock faible: ${p.name} (${p.stock})`,
            recommendedAction: `Commander ${p.reorderQuantity || 50} unités`
        }));

        res.json(alerts);
    } catch (error) {
        console.error('Error fetching low stock alerts:', error);
        res.status(500).json({ message: error.message });
    }
});

// Reorder recommendations - filtré par commerçant
router.get('/alerts/reorder', auth, async (req, res) => {
    try {
        let query = supabase.from('Products').select('*');

        if (req.user.role === 'merchant') {
            query = query.eq('merchant_id', req.user.merchantId);
        }

        const { data, error } = await query;

        if (error) throw error;

        const reorderProducts = (data || []).filter(p => (p.stock || 0) <= (p.reorderPoint || 20));

        const recommendations = reorderProducts.map(p => ({
            id: p.id,
            name: p.name,
            currentStock: p.stock || 0,
            reorderPoint: p.reorderPoint || 20,
            recommendedQuantity: p.reorderQuantity || 50,
            urgency: (p.stock || 0) <= (p.reorderPoint / 2) ? 'high' : 'medium',
            image_url: p.image_url
        }));

        res.json(recommendations);
    } catch (error) {
        console.error('Error fetching reorder recommendations:', error);
        res.status(500).json({ message: error.message });
    }
});

// Stats dashboard - filtré par commerçant
router.get('/stats/dashboard', auth, async (req, res) => {
    try {
        let query = supabase.from('Products').select('*');

        if (req.user.role === 'merchant') {
            query = query.eq('merchant_id', req.user.merchantId);
        }

        const { data: products, error } = await query;

        if (error) throw error;

        const stats = {
            total: products?.length || 0,
            totalValue: products?.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0) || 0,
            lowStock: products?.filter(p => (p.stock || 0) <= (p.minStockAlert || 10)).length || 0,
            outOfStock: products?.filter(p => (p.stock || 0) === 0).length || 0,
            needsReorder: products?.filter(p => (p.stock || 0) <= (p.reorderPoint || 20)).length || 0
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: error.message });
    }
});

// Top products list - uniquement produits entrepôt pour admin
router.get('/top/list', auth, async (req, res) => {
    try {
        let query = supabase.from('Products').select('id, name, price, stock, image_url');

        // Pour admin, uniquement produits entrepôt
        if (req.user.role === 'admin') {
            query = query.is('merchant_id', null);
        }
        // Pour commerçant, uniquement ses produits
        else if (req.user.role === 'merchant') {
            query = query.eq('merchant_id', req.user.merchantId);
        }

        const { data: products, error } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ message: error.message });
        }

        if (!products || products.length === 0) {
            return res.json([]);
        }

        const topProducts = products.slice(0, 5).map(p => ({
            id: p.id,
            name: p.name,
            sales: Math.floor((p.stock || 0) * 0.3) + 10,
            revenue: (p.price || 0) * (Math.floor((p.stock || 0) * 0.3) + 10),
            image_url: p.image_url
        }));

        topProducts.sort((a, b) => b.sales - a.sales);
        res.json(topProducts);
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
