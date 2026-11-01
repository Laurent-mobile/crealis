//backend/src/routes/order.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');

// Pending orders
router.get('/pending', auth, async (req, res) => {
    try {
        // Pour l'instant, retourner un tableau vide
        // À implémenter selon votre logique de commandes
        res.json([]);
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
