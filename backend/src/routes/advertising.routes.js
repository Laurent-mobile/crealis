//backend/src/routes/advertising.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');

// Get all campaigns
router.get('/campaigns', auth, async (req, res) => {
    try {
        console.log('📢 Fetching campaigns...');

        // Vérifier d'abord si la table existe
        const { data: tableCheck, error: tableError } = await supabase
            .from('Campaigns')
            .select('count', { count: 'exact', head: true });

        console.log('Table check:', { tableCheck, tableError });

        // Récupérer toutes les campagnes
        const { data, error } = await supabase
            .from('Campaigns')
            .select('*');

        console.log('Raw data from Supabase:', data);
        console.log('Error:', error);

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            console.log('No campaigns found');
            return res.json([]);
        }

        console.log(`Found ${data.length} campaigns`);

        // Transformer les données
        const formattedCampaigns = data.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            type: c.type,
            budget: parseFloat(c.budget),
            spent: parseFloat(c.spent),
            targetAudience: c.target_audience,
            startDate: c.start_date,
            endDate: c.end_date,
            status: c.status,
            impressions: c.impressions || 0,
            clicks: c.clicks || 0,
            discountPercent: parseFloat(c.discount_percent || 0),
            createdAt: c.created_at
        }));

        console.log('Formatted campaigns:', formattedCampaigns.length);
        res.json(formattedCampaigns);
    } catch (error) {
        console.error('Error in campaigns route:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get campaign stats - Ajoute cette route avant module.exports
router.get('/stats', auth, async (req, res) => {
    try {
        const { data: campaigns, error } = await supabase
            .from('Campaigns')
            .select('*');

        if (error) throw error;

        const totalImpressions = campaigns?.reduce((sum, c) => sum + (c.impressions || 0), 0) || 0;
        const totalClicks = campaigns?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0;

        const stats = {
            totalCampaigns: campaigns?.length || 0,
            activeCampaigns: campaigns?.filter(c => c.status === 'active').length || 0,
            totalImpressions: totalImpressions,
            totalClicks: totalClicks,
            totalBudget: campaigns?.reduce((sum, c) => sum + parseFloat(c.budget || 0), 0) || 0,
            totalSpent: campaigns?.reduce((sum, c) => sum + parseFloat(c.spent || 0), 0) || 0,
            avgCTR: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0,
            byType: {
                banner: campaigns?.filter(c => c.type === 'banner').length || 0,
                video: campaigns?.filter(c => c.type === 'video').length || 0,
                notification: campaigns?.filter(c => c.type === 'notification').length || 0
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching campaign stats:', error);
        res.json({
            totalCampaigns: 0,
            activeCampaigns: 0,
            totalImpressions: 0,
            totalClicks: 0,
            totalBudget: 0,
            totalSpent: 0,
            avgCTR: 0,
            byType: { banner: 0, video: 0, notification: 0 }
        });
    }
});
module.exports = router;
