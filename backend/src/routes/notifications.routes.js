const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');

// Récupérer les notifications de l'utilisateur
router.get('/', auth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('Notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: error.message });
    }
});

// Marquer une notification comme lue
router.put('/:id/read', auth, async (req, res) => {
    try {
        const { error } = await supabase
            .from('Notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: error.message });
    }
});

// Marquer toutes les notifications comme lues
router.put('/read-all', auth, async (req, res) => {
    try {
        const { error } = await supabase
            .from('Notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('user_id', req.user.id)
            .eq('is_read', false);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: error.message });
    }
});

// Récupérer le nombre de notifications non lues
router.get('/unread-count', auth, async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('Notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', req.user.id)
            .eq('is_read', false);

        if (error) throw error;
        res.json({ count: count || 0 });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ message: error.message });
    }
});

// Récupérer l'historique des réapprovisionnements du commerçant
router.get('/supply-history', auth, async (req, res) => {
    try {
        let query = supabase
            .from('SupplyHistory')
            .select('*, product:Products(name), merchant:Merchants(name), creator:Users(firstName, lastName)')
            .order('created_at', { ascending: false });

        if (req.user.role === 'merchant') {
            query = query.eq('merchant_id', req.user.merchantId);
        }

        const { data, error } = await query.limit(100);

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching supply history:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
