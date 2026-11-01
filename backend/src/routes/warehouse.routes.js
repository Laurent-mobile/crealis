//backend/src/routes/warehouse.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// ==================== GET MAIN WAREHOUSE ====================
router.get('/main', auth, async (req, res) => {
    try {
        res.json({
            id: 'warehouse_main_001',
            name: 'Entrepôt Principal CREALIS',
            code: 'WH_MAIN_001',
            type: 'main',
            address: 'Zone industrielle, Ouagadougou',
            city: 'Ouagadougou',
            country: 'Burkina Faso',
            phone: '+226 70 00 00 00',
            email: 'entrepot@crealis.com',
            manager: 'Directeur Logistique',
            capacity: 10000,
            currentStock: 0,
            isActive: true
        });
    } catch (error) {
        console.error('Error fetching main warehouse:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==================== GET WAREHOUSE STOCK ====================
router.get('/stock', auth, async (req, res) => {
    try {
        // Récupérer uniquement les produits de l'entrepôt (merchant_id IS NULL)
        const { data: products, error } = await supabase
            .from('Products')
            .select('*')
            .is('merchant_id', null)
            .order('name', { ascending: true });

        if (error) throw error;

        const stocks = (products || []).map(product => ({
            id: product.id,
            productId: product.id,
            product: product,
            quantity: product.stock || 0,
            minStock: product.minStockAlert || 10,
            maxStock: product.maxStockAlert || 500,
            reorderPoint: product.reorderPoint || 20
        }));

        const stats = {
            totalProducts: stocks.length,
            totalQuantity: stocks.reduce((sum, s) => sum + s.quantity, 0),
            lowStockItems: stocks.filter(s => s.quantity <= s.minStock).length,
            outOfStock: stocks.filter(s => s.quantity === 0).length
        };

        res.json({ stocks, stats });
    } catch (error) {
        console.error('Error fetching warehouse stock:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==================== GET MOVEMENT HISTORY ====================
router.get('/movements', auth, async (req, res) => {
    try {
        // Récupérer les transactions
        const { data: transactions, error } = await supabase
            .from('Transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(parseInt(req.query.limit) || 50);

        if (error) throw error;

        // Récupérer les marchands séparément
        const merchantIds = [...new Set((transactions || []).map(t => t.merchant_id).filter(Boolean))];

        let merchants = [];
        if (merchantIds.length > 0) {
            const { data: merchantsData } = await supabase
                .from('Merchants')
                .select('*')
                .in('id', merchantIds);
            merchants = merchantsData || [];
        }

        // Transformer les transactions en mouvements de stock
        const movements = (transactions || []).map(t => {
            const merchant = merchants.find(m => m.id === t.merchant_id);
            return {
                id: t.id,
                movementId: t.transaction_id || t.id,
                type: t.type === 'purchase' ? 'outbound' : 'inbound',
                quantity: Math.round(t.amount / 100) || 1,
                productId: t.product_id,
                merchant: merchant ? { id: merchant.id, name: merchant.name } : null,
                reason: t.description || t.type,
                status: t.status,
                createdAt: t.created_at
            };
        });

        res.json(movements);
    } catch (error) {
        console.error('Error fetching movements:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==================== GET WAREHOUSE STATS ====================
router.get('/stats', auth, async (req, res) => {
    try {
        // Récupérer uniquement les produits de l'entrepôt
        const { data: products, error: productsError } = await supabase
            .from('Products')
            .select('*')
            .is('merchant_id', null);

        if (productsError) throw productsError;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentTransactions, error: transactionsError } = await supabase
            .from('Transactions')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', thirtyDaysAgo.toISOString());

        const totalProducts = products?.length || 0;
        const totalQuantity = products?.reduce((sum, p) => sum + (p.stock || 0), 0) || 0;
        const lowStock = products?.filter(p => (p.stock || 0) <= (p.minStockAlert || 10)).length || 0;

        res.json({
            totalProducts,
            totalQuantity,
            lowStock,
            recentMovements: recentTransactions?.length || 0,
            capacity: 10000,
            utilizationRate: totalQuantity > 0 ? (totalQuantity / 10000) * 100 : 0
        });
    } catch (error) {
        console.error('Error fetching warehouse stats:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==================== ADD STOCK ====================
router.post('/stock/add', auth, async (req, res) => {
    try {
        const { productId, quantity, reason } = req.body;

        const { data: product, error: fetchError } = await supabase
            .from('Products')
            .select('*')
            .eq('id', productId)
            .single();

        if (fetchError || !product) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        const newStock = (product.stock || 0) + parseInt(quantity);

        const { data: updatedProduct, error: updateError } = await supabase
            .from('Products')
            .update({ stock: newStock, lastStockUpdate: new Date().toISOString() })
            .eq('id', productId)
            .select()
            .single();

        if (updateError) throw updateError;

        res.json({
            success: true,
            stock: {
                productId,
                quantity: newStock,
                product: updatedProduct
            },
            movement: {
                type: 'inbound',
                quantity: parseInt(quantity),
                reason: reason || 'Ajout de stock'
            }
        });
    } catch (error) {
        console.error('Error adding stock:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==================== RECEIVE STOCK (Réception de marchandises) ====================
router.post('/stock/receive', auth, async (req, res) => {
    try {
        const { productId, quantity, reference, supplier, notes } = req.body;

        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ message: 'Produit et quantité valide requis' });
        }

        // Récupérer le produit actuel
        const { data: product, error: fetchError } = await supabase
            .from('Products')
            .select('*')
            .eq('id', productId)
            .single();

        if (fetchError || !product) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        const previousStock = product.stock || 0;
        const newStock = previousStock + parseInt(quantity);

        // Mettre à jour le stock
        const { data: updatedProduct, error: updateError } = await supabase
            .from('Products')
            .update({
                stock: newStock,
                lastStockUpdate: new Date().toISOString()
            })
            .eq('id', productId)
            .select()
            .single();

        if (updateError) throw updateError;

        // Enregistrer le mouvement de stock
        const movementId = `RCV_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const { data: movement, error: movementError } = await supabase
            .from('StockMovements')
            .insert([{
                movementId: movementId,
                type: 'inbound',
                quantity: parseInt(quantity),
                previousStock: previousStock,
                newStock: newStock,
                reason: `Réception de marchandises - ${supplier || 'Fournisseur'}`,
                reference: reference || null,
                status: 'completed',
                productId: productId,
                notes: notes || null,
                createdAt: new Date().toISOString()
            }])
            .select()
            .single();

        if (movementError) console.error('Error saving movement:', movementError);

        res.json({
            success: true,
            message: `${quantity} ${product.unit || 'unités'} réceptionnés avec succès`,
            product: updatedProduct,
            movement: movement
        });
    } catch (error) {
        console.error('Error receiving stock:', error);
        res.status(500).json({ message: error.message });
    }
});
// ==================== SUPPLY MERCHANT (Réapprovisionnement direct) ====================

router.post('/supply-merchant', auth, async (req, res) => {
    try {
        const { merchantId, productId, quantity, reason } = req.body;

        if (!merchantId || !productId || !quantity || quantity <= 0) {
            return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
        }

        console.log('📦 Approvisionnement direct:', { merchantId, productId, quantity });

        // 1. Vérifier le produit dans l'entrepôt
        const { data: warehouseProduct, error: productError } = await supabase
            .from('Products')
            .select('*')
            .eq('id', productId)
            .is('merchant_id', null)
            .single();

        if (productError || !warehouseProduct) {
            return res.status(404).json({ message: 'Produit non trouvé dans l\'entrepôt' });
        }

        if ((warehouseProduct.stock || 0) < quantity) {
            return res.status(400).json({ message: `Stock insuffisant. Stock actuel: ${warehouseProduct.stock || 0}` });
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

        const previousWarehouseStock = warehouseProduct.stock;
        const newWarehouseStock = previousWarehouseStock - parseInt(quantity);

        // 3. Diminuer le stock de l'entrepôt
        const { error: updateWarehouseError } = await supabase
            .from('Products')
            .update({
                stock: newWarehouseStock,
                lastStockUpdate: new Date().toISOString()
            })
            .eq('id', productId)
            .is('merchant_id', null);

        if (updateWarehouseError) throw updateWarehouseError;

        // 4. Gérer le stock du commerçant
        const { data: merchantProduct, error: merchantProductError } = await supabase
            .from('Products')
            .select('*')
            .eq('product_id', productId)
            .eq('merchant_id', merchantId)
            .maybeSingle();

        let finalMerchantStock;
        let previousMerchantStock = merchantProduct?.stock || 0;

        if (merchantProduct) {
            finalMerchantStock = previousMerchantStock + parseInt(quantity);
            const { error: updateMerchantError } = await supabase
                .from('Products')
                .update({
                    stock: finalMerchantStock,
                    lastStockUpdate: new Date().toISOString()
                })
                .eq('id', merchantProduct.id);

            if (updateMerchantError) throw updateMerchantError;
        } else {
            const newProductId = uuidv4();
            finalMerchantStock = parseInt(quantity);
            const { error: createMerchantError } = await supabase
                .from('Products')
                .insert([{
                    id: newProductId,
                    product_id: productId,
                    merchant_id: merchantId,
                    name: warehouseProduct.name,
                    price: warehouseProduct.price,
                    stock: finalMerchantStock,
                    category: warehouseProduct.category || null,
                    description: warehouseProduct.description || null,
                    image_url: warehouseProduct.image_url || null,
                    isActive: true,
                    created_at: new Date().toISOString()
                }]);

            if (createMerchantError) throw createMerchantError;
        }

        // 5. Enregistrer l'historique du réapprovisionnement
        const { error: historyError } = await supabase
            .from('SupplyHistory')
            .insert({
                product_id: productId,
                merchant_id: merchantId,
                quantity: parseInt(quantity),
                previous_stock: previousMerchantStock,
                new_stock: finalMerchantStock,
                source_type: 'direct',
                created_by: req.user.id,
                note: reason || `Approvisionnement direct depuis l'entrepôt`,
                created_at: new Date().toISOString()
            });

        if (historyError) {
            console.error('Erreur enregistrement historique:', historyError);
        }

        // 6. Enregistrer le mouvement de stock
        const movementId = `SUP_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        await supabase
            .from('StockMovements')
            .insert({
                movementId: movementId,
                type: 'outbound',
                quantity: parseInt(quantity),
                previousStock: previousWarehouseStock,
                newStock: newWarehouseStock,
                reason: reason || `Approvisionnement direct de ${merchant.name}`,
                status: 'completed',
                productId: productId,
                destinationMerchantId: merchantId,
                created_at: new Date().toISOString()
            });

        // 7. Créer une notification pour le commerçant
        await supabase
            .from('Notifications')
            .insert({
                user_id: merchant.user_id,
                type: 'stock_received',
                title: '📦 Réapprovisionnement reçu',
                message: `${quantity} ${warehouseProduct.name} ont été ajoutés à votre stock. Nouveau stock: ${finalMerchantStock} unités.`,
                data: {
                    productId: productId,
                    productName: warehouseProduct.name,
                    quantity: quantity,
                    newStock: finalMerchantStock
                },
                is_read: false,
                created_at: new Date().toISOString()
            });

        res.json({
            success: true,
            message: `${quantity} ${warehouseProduct.unit || 'unités'} livrées à ${merchant.name}`,
            quantity: parseInt(quantity),
            merchant: merchant.name,
            product: warehouseProduct.name,
            newWarehouseStock: newWarehouseStock,
            merchantStock: finalMerchantStock,
            history: {
                previousStock: previousMerchantStock,
                newStock: finalMerchantStock,
                date: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error supplying merchant:', error);
        res.status(500).json({ message: error.message });
    }
});

// Récupérer toutes les demandes (pour admin)
router.get('/requests', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const { data, error } = await supabase
            .from('StockRequests')
            .select('*, merchant:Merchants(*), product:Products(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ message: error.message });
    }
});

// Approuver une demande
router.put('/requests/:id/approve', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const { id } = req.params;

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

// Expédier une demande
router.put('/requests/:id/ship', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const { id } = req.params;

        // Récupérer la demande avec les infos produit
        const { data: request, error: reqError } = await supabase
            .from('StockRequests')
            .select('*, product:Products(*)')
            .eq('id', id)
            .single();

        if (reqError || !request) {
            return res.status(404).json({ message: 'Demande non trouvée' });
        }

        if (request.status !== 'approved') {
            return res.status(400).json({ message: 'Seules les demandes approuvées peuvent être expédiées' });
        }

        // Vérifier le stock disponible
        if (!request.product || request.product.stock < request.quantity) {
            return res.status(400).json({ message: 'Stock insuffisant en entrepôt' });
        }

        // Diminuer le stock de l'entrepôt
        const newStock = request.product.stock - request.quantity;
        const { error: updateStockError } = await supabase
            .from('Products')
            .update({ stock: newStock, lastStockUpdate: new Date().toISOString() })
            .eq('id', request.product_id);

        if (updateStockError) throw updateStockError;

        // Mettre à jour le statut de la demande
        const { data, error } = await supabase
            .from('StockRequests')
            .update({
                status: 'shipped',
                shipped_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, message: 'Stock expédié avec succès', data });
    } catch (error) {
        console.error('Error shipping request:', error);
        res.status(500).json({ message: error.message });
    }
});

// Rejeter/Annuler une demande
router.put('/requests/:id/reject', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const { id } = req.params;

        const { data, error } = await supabase
            .from('StockRequests')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ message: error.message });
    }
});
module.exports = router;
