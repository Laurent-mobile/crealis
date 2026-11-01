// backend/src/routes/ticker.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Récupérer tous les messages (pour admin)
router.get('/', auth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('TickerMessages')
            .select('*, creator:created_by(email, firstName, lastName)')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching ticker messages:', error);
        res.status(500).json({ message: error.message });
    }
});

// Récupérer les messages actifs (pour mobile)
router.get('/active', async (req, res) => {
    try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('TickerMessages')
            .select('id, message, type, priority')
            .eq('is_active', true)
            .or(`start_date.is.null,start_date.lte.${now}`)
            .or(`end_date.is.null,end_date.gte.${now}`)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching active ticker messages:', error);
        res.status(500).json({ message: error.message });
    }
});

// Créer un message
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const { message, type, priority, start_date, end_date } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Le message est requis' });
        }

        const { data, error } = await supabase
            .from('TickerMessages')
            .insert([{
                id: uuidv4(),
                message,
                type: type || 'info',
                priority: priority || 1,
                is_active: true,
                start_date: start_date || null,
                end_date: end_date || null,
                created_by: req.user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating ticker message:', error);
        res.status(500).json({ message: error.message });
    }
});

// Route PUT corrigée

router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const { id } = req.params;
        const { message, type, priority, is_active, start_date, end_date } = req.body;

        console.log('🔄 Mise à jour message UUID:', id);

        // Vérifier d'abord si le message existe avec une requête simple
        const { data: existing, error: checkError } = await supabase
            .from('TickerMessages')
            .select('id')
            .eq('id', id);

        if (checkError) {
            console.error('Erreur vérification:', checkError);
            return res.status(500).json({ message: checkError.message });
        }

        if (!existing || existing.length === 0) {
            console.log('❌ Message non trouvé');
            return res.status(404).json({ message: 'Message non trouvé' });
        }

        console.log('✅ Message trouvé, mise à jour...');

        // Mise à jour
        const { data, error } = await supabase
            .from('TickerMessages')
            .update({
                message,
                type,
                priority,
                is_active,
                start_date: start_date || null,
                end_date: end_date || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Erreur mise à jour:', error);
            return res.status(500).json({ message: error.message });
        }

        console.log('✅ Message mis à jour:', data);
        res.json(data[0] || { message: 'Mis à jour avec succès' });
    } catch (error) {
        console.error('Error updating ticker message:', error);
        res.status(500).json({ message: error.message });
    }
});
// Supprimer un message
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const { id } = req.params;

        // Vérifier si le message existe
        const { data: existing, error: checkError } = await supabase
            .from('TickerMessages')
            .select('id')
            .eq('id', id)
            .single();

        if (checkError || !existing) {
            return res.status(404).json({ message: 'Message non trouvé' });
        }

        const { error } = await supabase
            .from('TickerMessages')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ message: error.message });
        }

        res.json({ message: 'Message supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting ticker message:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
