//backend/src/routes/report.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const auth = require('../middleware/auth');
const ExcelJS = require('exceljs');

// Générer un rapport
router.post('/generate', auth, async (req, res) => {
    try {
        const { reportType, startDate, endDate, format, includeCharts, includeDetails, sendByEmail, email } = req.body;

        let data = [];
        let reportData = {};

        // Récupérer les données selon le type de rapport
        switch (reportType) {
            case 'sales':
                const { data: salesData } = await supabase
                    .from('Transactions')
                    .select('*')
                    .gte('created_at', startDate)
                    .lte('created_at', endDate)
                    .eq('status', 'success');

                data = salesData || [];
                reportData = {
                    title: 'Rapport des ventes',
                    totalAmount: data.reduce((sum, t) => sum + (t.amount || 0), 0),
                    totalTransactions: data.length,
                    averageTransaction: data.length > 0 ? data.reduce((sum, t) => sum + (t.amount || 0), 0) / data.length : 0,
                    data: data
                };
                break;

            case 'transactions':
                const { data: transactionsData } = await supabase
                    .from('Transactions')
                    .select('*, merchant:Merchants(*)')
                    .gte('created_at', startDate)
                    .lte('created_at', endDate);

                data = transactionsData || [];
                reportData = {
                    title: 'Rapport des transactions',
                    totalAmount: data.reduce((sum, t) => sum + (t.amount || 0), 0),
                    totalTransactions: data.length,
                    data: data
                };
                break;

            case 'loyalty':
                const { data: customersData } = await supabase
                    .from('Customers')
                    .select('*');

                data = customersData || [];
                reportData = {
                    title: 'Rapport de fidélité',
                    totalCustomers: data.length,
                    totalPoints: data.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0),
                    totalSpent: data.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
                    vipDistribution: {
                        bronze: data.filter(c => c.vipLevel === 'bronze').length,
                        silver: data.filter(c => c.vipLevel === 'silver').length,
                        gold: data.filter(c => c.vipLevel === 'gold').length,
                        platinum: data.filter(c => c.vipLevel === 'platinum').length
                    },
                    data: data
                };
                break;

            case 'merchants':
                const { data: merchantsData } = await supabase
                    .from('Merchants')
                    .select('*');

                data = merchantsData || [];
                reportData = {
                    title: 'Rapport des commerçants',
                    totalMerchants: data.length,
                    activeMerchants: data.filter(m => m.is_active).length,
                    verifiedMerchants: data.filter(m => m.is_verified).length,
                    data: data
                };
                break;

            case 'customers':
                const { data: allCustomers } = await supabase
                    .from('Customers')
                    .select('*');

                data = allCustomers || [];
                reportData = {
                    title: 'Rapport des clients',
                    totalCustomers: data.length,
                    activeCustomers: data.filter(c => c.isActive).length,
                    totalSpent: data.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
                    data: data
                };
                break;

            case 'stock':
                const { data: productsData } = await supabase
                    .from('Products')
                    .select('*');

                data = productsData || [];
                reportData = {
                    title: 'Rapport de stock',
                    totalProducts: data.length,
                    totalStockValue: data.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0),
                    lowStock: data.filter(p => (p.stock || 0) <= 10).length,
                    outOfStock: data.filter(p => (p.stock || 0) === 0).length,
                    data: data
                };
                break;

            case 'inventory':
                const { data: inventoryData } = await supabase
                    .from('Products')
                    .select('*');

                data = inventoryData || [];
                reportData = {
                    title: 'Rapport d\'inventaire',
                    totalProducts: data.length,
                    totalValue: data.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0),
                    data: data
                };
                break;

            default:
                reportData = { title: 'Rapport', data: [] };
        }

        // Générer le fichier selon le format
        if (format === 'pdf' || format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(reportData.title);

            // Ajouter l'en-tête
            worksheet.addRow([reportData.title]);
            worksheet.addRow([`Période: ${startDate} au ${endDate}`]);
            worksheet.addRow([`Généré le: ${new Date().toLocaleString()}`]);
            worksheet.addRow([]);

            // Ajouter les colonnes
            if (data.length > 0) {
                const headers = Object.keys(data[0]);
                worksheet.addRow(headers);

                // Ajouter les données
                data.forEach(row => {
                    worksheet.addRow(Object.values(row));
                });
            }

            const buffer = await workbook.xlsx.writeBuffer();

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=rapport_${reportType}_${Date.now()}.xlsx`);
            res.send(buffer);
        } else {
            // Format JSON
            res.json(reportData);
        }
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: error.message });
    }
});

// Obtenir l'aperçu du rapport
router.post('/preview', auth, async (req, res) => {
    try {
        const { reportType, startDate, endDate } = req.body;

        let preview = {
            transactions: 0,
            amount: 0,
            customers: 0
        };

        switch (reportType) {
            case 'sales':
                const { data: salesData, count: salesCount } = await supabase
                    .from('Transactions')
                    .select('*', { count: 'exact' })
                    .gte('created_at', startDate)
                    .lte('created_at', endDate)
                    .eq('status', 'success');

                preview = {
                    transactions: salesCount || 0,
                    amount: (salesData || []).reduce((sum, t) => sum + (t.amount || 0), 0),
                    customers: 0
                };
                break;

            case 'customers':
                const { data: customersData, count: customersCount } = await supabase
                    .from('Customers')
                    .select('*', { count: 'exact' });

                preview = {
                    transactions: 0,
                    amount: 0,
                    customers: customersCount || 0
                };
                break;
        }

        res.json(preview);
    } catch (error) {
        console.error('Error getting report preview:', error);
        res.status(500).json({ message: error.message });
    }
});

// Exporter en CSV
router.post('/export/csv', auth, async (req, res) => {
    try {
        const { reportType, startDate, endDate } = req.body;

        let data = [];

        switch (reportType) {
            case 'transactions':
                const { data: transactionsData } = await supabase
                    .from('Transactions')
                    .select('*')
                    .gte('created_at', startDate)
                    .lte('created_at', endDate);
                data = transactionsData || [];
                break;
        }

        // Générer CSV
        let csv = '';
        if (data.length > 0) {
            const headers = Object.keys(data[0]);
            csv += headers.join(',') + '\n';
            data.forEach(row => {
                const values = headers.map(header => JSON.stringify(row[header] || ''));
                csv += values.join(',') + '\n';
            });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=rapport_${reportType}_${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
