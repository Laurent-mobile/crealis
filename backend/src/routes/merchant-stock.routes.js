// backend/src/routes/merchant-stock.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// ==================== PRODUITS ====================

// Récupérer les produits du commerçant
router.get('/products', auth, async (req, res) => {
    try {
        const merchantId = req.user.merchantId;

        if (!merchantId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        let query = supabase.from('Products').select('*');

        if (req.user.role === 'merchant') {
            query = query.eq('merchant_id', merchantId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching merchant products:', error);
        res.status(500).json({ message: error.message });
    }
});

// Ajouter un produit
router.post('/products', auth, async (req, res) => {
    try {
        const merchantId = req.user.merchantId;
        const { name, price, stock, category, description } = req.body;

        if (!name || !price) {
            return res.status(400).json({ message: 'Nom et prix requis' });
        }

        const productId = uuidv4();

        const { data, error } = await supabase
            .from('Products')
            .insert([{
                id: productId,
                name,
                price: parseFloat(price),
                stock: stock || 0,
                category: category || null,
                description: description || null,
                merchant_id: merchantId,
                isActive: true,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: error.message });
    }
});

// Mettre à jour le stock
router.put('/products/:id/stock', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, operation } = req.body;
        const merchantId = req.user.merchantId;

        const { data: product, error: checkError } = await supabase
            .from('Products')
            .select('*')
            .eq('id', id)
            .single();

        if (checkError || !product) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        if (product.merchant_id !== merchantId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        let newStock = product.stock || 0;
        if (operation === 'add') newStock += parseInt(quantity);
        else if (operation === 'remove') newStock -= parseInt(quantity);
        else if (operation === 'set') newStock = parseInt(quantity);

        if (newStock < 0) newStock = 0;

        const { data, error } = await supabase
            .from('Products')
            .update({
                stock: newStock,
                lastStockUpdate: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ message: error.message });
    }
});

// Supprimer un produit
router.delete('/products/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const merchantId = req.user.merchantId;

        const { data: product, error: checkError } = await supabase
            .from('Products')
            .select('*')
            .eq('id', id)
            .single();

        if (checkError || !product) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        if (product.merchant_id !== merchantId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const { error } = await supabase
            .from('Products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Produit supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: error.message });
    }
});

// Admin : Approuver une demande
router.put('/requests/:id/approve', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier que l'utilisateur est admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const { data, error } = await supabase
            .from('StockRequests')
            .update({ status: 'approved' })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error approving request:', error);
        res.status(500).json({ message: error.message });
    }
});

// Admin : Expédier une demande
router.put('/requests/:id/ship', auth, async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const { data, error } = await supabase
            .from('StockRequests')
            .update({
                status: 'shipped',
                shipped_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error shipping request:', error);
        res.status(500).json({ message: error.message });
    }
});
// ==================== DEMANDES DE RÉAPPROVISIONNEMENT ====================

// Récupérer les demandes du commerçant
router.get('/requests', auth, async (req, res) => {
    try {
        const merchantId = req.user.merchantId;

        const { data, error } = await supabase
            .from('StockRequests')
            .select('*, product:Products(*)')
            .eq('merchant_id', merchantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ message: error.message });
    }
});

// Créer une demande de réapprovisionnement
router.post('/requests', auth, async (req, res) => {
    try {
        const merchantId = req.user.merchantId;
        const { productId, quantity, note } = req.body;

        if (!productId || !quantity || quantity < 1) {
            return res.status(400).json({ message: 'Produit et quantité valide requis' });
        }

        const { data, error } = await supabase
            .from('StockRequests')
            .insert([{
                id: uuidv4(),
                merchant_id: merchantId,
                product_id: productId,
                quantity: quantity,
                note: note || null,
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating stock request:', error);
        res.status(500).json({ message: error.message });
    }
});


// Confirmer la réception d'une demande (pour le commerçant)
router.post('/requests/:id/receive', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const merchantId = req.user.merchantId;

        console.log('📦 Réception stock - Demande ID:', id);
        console.log('📦 Merchant ID:', merchantId);

        // 1. Vérifier que la demande appartient au commerçant
        const { data: request, error: checkError } = await supabase
            .from('StockRequests')
            .select('*')
            .eq('id', id)
            .eq('merchant_id', merchantId)
            .single();

        if (checkError || !request) {
            console.error('Demande non trouvée:', checkError);
            return res.status(404).json({ message: 'Demande non trouvée' });
        }

        console.log('📦 Demande trouvée:', request);

        if (request.status !== 'shipped') {
            return res.status(400).json({ message: 'Cette demande n\'a pas encore été expédiée' });
        }

        // 2. Récupérer les infos du produit depuis l'entrepôt
        const { data: originalProduct, error: productError } = await supabase
            .from('Products')
            .select('*')
            .eq('id', request.product_id)
            .single();

        if (productError || !originalProduct) {
            console.error('Produit original non trouvé:', productError);
            return res.status(404).json({ message: 'Produit non trouvé dans l\'entrepôt' });
        }

        console.log('📦 Produit original:', originalProduct);

        // 3. Vérifier si le produit existe déjà pour ce commerçant (par name et merchant_id)
        const { data: existingProduct, error: existingError } = await supabase
            .from('Products')
            .select('*')
            .eq('name', originalProduct.name)
            .eq('merchant_id', merchantId)
            .maybeSingle();

        // 4. Créer ou mettre à jour le produit pour le commerçant
        if (existingProduct) {
            // Mettre à jour le stock existant
            const newStock = (existingProduct.stock || 0) + request.quantity;
            const { error: updateError } = await supabase
                .from('Products')
                .update({
                    stock: newStock,
                    lastStockUpdate: new Date().toISOString()
                })
                .eq('id', existingProduct.id);

            if (updateError) {
                console.error('Erreur mise à jour stock:', updateError);
                throw updateError;
            }
            console.log('✅ Stock mis à jour:', newStock);
        } else {
            // Créer un nouveau produit pour le commerçant (sans product_id)
            const { error: createError } = await supabase
                .from('Products')
                .insert([{
                    id: require('crypto').randomUUID(),
                    merchant_id: merchantId,
                    name: originalProduct.name,
                    price: originalProduct.price,
                    stock: request.quantity,
                    category: originalProduct.category || null,
                    description: originalProduct.description || null,
                    image_url: originalProduct.image_url || null,
                    isActive: true,
                    created_at: new Date().toISOString()
                }]);

            if (createError) {
                console.error('Erreur création produit:', createError);
                throw createError;
            }
            console.log('✅ Nouveau produit créé avec stock:', request.quantity);
        }

        // 5. Mettre à jour le statut de la demande
        const { error: updateRequestError } = await supabase
            .from('StockRequests')
            .update({
                status: 'received',
                received_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateRequestError) {
            console.error('Erreur mise à jour demande:', updateRequestError);
            throw updateRequestError;
        }

        console.log('✅ Demande mise à jour avec succès');

        res.json({
            success: true,
            message: 'Stock reçu avec succès',
            quantity: request.quantity
        });
    } catch (error) {
        console.error('Error receiving stock:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
