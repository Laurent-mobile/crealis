// frontend-web/src/pages/MerchantReports.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import toast from 'react-hot-toast';

function MerchantReports() {
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState('sales');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
        end: new Date().toISOString().slice(0, 10)
    });
    const [reportData, setReportData] = useState({
        sales: [],
        products: [],
        customers: [],
        transactions: [],
        stats: {
            totalSales: 0,
            totalTransactions: 0,
            averageTicket: 0,
            topProduct: null,
            totalCustomers: 0,
            cashbackGiven: 0
        }
    });
    const [merchantInfo, setMerchantInfo] = useState({});

    useEffect(() => {
        fetchReportData();
        fetchMerchantInfo();
    }, [dateRange]);

    const fetchMerchantInfo = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            setMerchantInfo({
                name: user.merchant?.name || user.businessName || 'Mon Commerce',
                email: user.email,
                phone: user.phone,
                address: user.merchant?.address || '',
                registrationNumber: user.merchant?.registration_number
            });
        } catch (error) {
            console.error('Error fetching merchant info:', error);
        }
    };

    const fetchReportData = async () => {
        setLoading(true);
        try {
            // Récupérer les transactions du commerçant
            const transactionsRes = await api.get('/transactions');
            const allTransactions = transactionsRes.data || [];

            // Filtrer par date
            const filteredTransactions = allTransactions.filter(t => {
                const txDate = new Date(t.created_at);
                return txDate >= new Date(dateRange.start) && txDate <= new Date(dateRange.end);
            });

            // Récupérer les produits du commerçant
            const productsRes = await api.get('/products');
            const products = productsRes.data.products || [];

            // Récupérer les clients uniques
            const customers = [...new Map(filteredTransactions.map(t => [t.customer_id, {
                id: t.customer_id,
                name: `${t.customer_firstname || ''} ${t.customer_lastname || ''}`.trim(),
                phone: t.customer_phone,
                totalSpent: 0,
                transactions: 0
            }])).values()];

            // Calculer les totaux par client
            filteredTransactions.forEach(t => {
                const customer = customers.find(c => c.id === t.customer_id);
                if (customer) {
                    customer.totalSpent += t.amount;
                    customer.transactions++;
                }
            });

            // Ventes par produit
            const productSales = {};
            filteredTransactions.forEach(t => {
                if (t.product_id) {
                    if (!productSales[t.product_id]) {
                        productSales[t.product_id] = {
                            id: t.product_id,
                            name: t.product_name || 'Produit',
                            quantity: 0,
                            revenue: 0,
                            price: t.product_price || 0
                        };
                    }
                    productSales[t.product_id].quantity++;
                    productSales[t.product_id].revenue += t.amount;
                }
            });

            const salesData = Object.values(productSales);
            const totalSales = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            const totalTransactions = filteredTransactions.length;

            setReportData({
                sales: salesData,
                products: products,
                customers: customers.sort((a, b) => b.totalSpent - a.totalSpent),
                transactions: filteredTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
                stats: {
                    totalSales,
                    totalTransactions,
                    averageTicket: totalTransactions > 0 ? totalSales / totalTransactions : 0,
                    topProduct: salesData.sort((a, b) => b.revenue - a.revenue)[0] || null,
                    totalCustomers: customers.length,
                    cashbackGiven: totalSales * 0.02 // 2% de cashback
                }
            });
        } catch (error) {
            console.error('Error fetching report data:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async () => {
        try {
            console.log('📄 Génération du PDF...');

            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // ============ PAGE 1 ============

            // Logo et en-tête
            doc.setFillColor(37, 99, 235);
            doc.rect(0, 0, pageWidth, 50, 'F');

            doc.setFontSize(24);
            doc.setTextColor(255, 255, 255);
            doc.text('CREALIS MARKET', pageWidth / 2, 20, { align: 'center' });

            doc.setFontSize(12);
            doc.text('Rapport d\'activité', pageWidth / 2, 35, { align: 'center' });

            // Informations du commerçant
            doc.setFillColor(248, 250, 252);
            doc.rect(14, 60, pageWidth - 28, 45, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.rect(14, 60, pageWidth - 28, 45, 'D');

            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);
            doc.text(merchantInfo.name || 'Mon Commerce', 20, 75);

            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            let infoY = 85;
            if (merchantInfo.email) doc.text(`Email: ${merchantInfo.email}`, 20, infoY);
            if (merchantInfo.phone) doc.text(`Tél: ${merchantInfo.phone}`, pageWidth - 20, infoY, { align: 'right' });
            infoY += 8;
            if (merchantInfo.address) doc.text(`Adresse: ${merchantInfo.address}`, 20, infoY);

            // Période
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`Période: ${dateRange.start} au ${dateRange.end}`, pageWidth - 20, 70, { align: 'right' });

            // ============ KPI CARDS ============
            const stats = [
                { icon: '💰', label: 'Chiffre d\'affaires', value: `${reportData.stats.totalSales.toLocaleString()} FCFA`, color: [16, 185, 129] },
                { icon: '🔄', label: 'Transactions', value: `${reportData.stats.totalTransactions}`, color: [59, 130, 246] },
                { icon: '📊', label: 'Ticket moyen', value: `${Math.round(reportData.stats.averageTicket).toLocaleString()} FCFA`, color: [245, 158, 11] },
                { icon: '👥', label: 'Clients uniques', value: `${reportData.stats.totalCustomers}`, color: [139, 92, 246] }
            ];

            let startX = 14;
            const cardWidth = (pageWidth - 28 - 12) / 4;

            stats.forEach((stat, index) => {
                const x = startX + index * (cardWidth + 4);
                doc.setFillColor(255, 255, 255);
                doc.rect(x, 115, cardWidth, 45, 'F');
                doc.setDrawColor(226, 232, 240);
                doc.rect(x, 115, cardWidth, 45, 'D');

                doc.setFontSize(20);
                doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
                doc.text(stat.icon, x + 8, 130);

                doc.setFontSize(9);
                doc.setTextColor(100, 116, 139);
                doc.text(stat.label, x + 8, 142);

                doc.setFontSize(12);
                doc.setTextColor(30, 41, 59);
                doc.text(stat.value, x + 8, 153);
            });

            // ============ TOP PRODUITS ============
            let yPosition = 175;

            if (reportData.sales.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(30, 41, 59);
                doc.text('🏆 Top produits vendus', 14, yPosition);
                yPosition += 8;

                const productData = reportData.sales.slice(0, 5).map(p => [
                    p.name,
                    `${p.quantity}`,
                    `${p.revenue.toLocaleString()} FCFA`
                ]);

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Produit', 'Qté', 'Chiffre']],
                    body: productData,
                    theme: 'striped',
                    headStyles: {
                        fillColor: [37, 99, 235],
                        textColor: [255, 255, 255],
                        fontSize: 10,
                        fontStyle: 'bold'
                    },
                    bodyStyles: { fontSize: 9 },
                    columnStyles: {
                        0: { cellWidth: 80 },
                        1: { cellWidth: 30, halign: 'center' },
                        2: { cellWidth: 50, halign: 'right' }
                    },
                    margin: { left: 14, right: 14 }
                });

                yPosition = doc.lastAutoTable.finalY + 15;
            }

            // ============ MEILLEURS CLIENTS ============
            if (reportData.customers.length > 0 && yPosition < pageHeight - 100) {
                doc.setFontSize(14);
                doc.setTextColor(30, 41, 59);
                doc.text('⭐ Meilleurs clients', 14, yPosition);
                yPosition += 8;

                const customerData = reportData.customers.slice(0, 5).map(c => [
                    c.name || 'Client',
                    `${c.transactions}`,
                    `${c.totalSpent.toLocaleString()} FCFA`
                ]);

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Client', 'Achats', 'Total']],
                    body: customerData,
                    theme: 'striped',
                    headStyles: {
                        fillColor: [37, 99, 235],
                        textColor: [255, 255, 255],
                        fontSize: 10,
                        fontStyle: 'bold'
                    },
                    bodyStyles: { fontSize: 9 },
                    columnStyles: {
                        0: { cellWidth: 80 },
                        1: { cellWidth: 40, halign: 'center' },
                        2: { cellWidth: 50, halign: 'right' }
                    },
                    margin: { left: 14, right: 14 }
                });

                yPosition = doc.lastAutoTable.finalY + 15;
            }

            // ============ PAGE 2 - DERNIÈRES TRANSACTIONS ============
            if (reportData.transactions.length > 0) {
                doc.addPage();
                yPosition = 20;

                doc.setFillColor(37, 99, 235);
                doc.rect(0, 0, pageWidth, 40, 'F');
                doc.setFontSize(18);
                doc.setTextColor(255, 255, 255);
                doc.text('Dernières transactions', pageWidth / 2, 25, { align: 'center' });

                const transactionData = reportData.transactions.slice(0, 20).map(t => [
                    new Date(t.created_at).toLocaleDateString('fr-FR'),
                    `${t.customer_firstname || ''} ${t.customer_lastname || ''}`.trim() || 'Client',
                    `${t.amount.toLocaleString()} FCFA`,
                    t.type === 'purchase' ? 'Achat' : t.type === 'recharge' ? 'Recharge' : t.type,
                    t.points_earned || 0
                ]);

                autoTable(doc, {
                    startY: yPosition + 10,
                    head: [['Date', 'Client', 'Montant', 'Type', 'Points']],
                    body: transactionData,
                    theme: 'striped',
                    headStyles: {
                        fillColor: [37, 99, 235],
                        textColor: [255, 255, 255],
                        fontSize: 10,
                        fontStyle: 'bold'
                    },
                    bodyStyles: { fontSize: 9 },
                    columnStyles: {
                        0: { cellWidth: 35 },
                        1: { cellWidth: 55 },
                        2: { cellWidth: 40, halign: 'right' },
                        3: { cellWidth: 30, halign: 'center' },
                        4: { cellWidth: 25, halign: 'center' }
                    },
                    margin: { left: 14, right: 14 }
                });
            }

            // ============ PIED DE PAGE ============
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(156, 163, 175);
                doc.text(
                    `Généré le ${new Date().toLocaleString('fr-FR')} - CREALIS MARKET - Page ${i}/${pageCount}`,
                    pageWidth / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                );
            }

            doc.save(`rapport_${merchantInfo.name}_${dateRange.start}_${dateRange.end}.pdf`);
            toast.success('PDF généré avec succès');
        } catch (error) {
            console.error('Erreur génération PDF:', error);
            toast.error('Erreur lors de la génération du PDF');
        }
    };

    const generateCSV = () => {
        const headers = ['Date', 'Client', 'Montant', 'Type', 'Méthode', 'Statut', 'Points'];
        const rows = reportData.transactions.map(t => [
            new Date(t.created_at).toLocaleString(),
            `${t.customer_firstname || ''} ${t.customer_lastname || ''}`.trim(),
            t.amount,
            t.type,
            t.method,
            t.status,
            t.points_earned || 0
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `transactions_${dateRange.start}_${dateRange.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('CSV exporté avec succès');
    };

    if (loading) {
        return (
            <Layout>
                <div className="spinner-container"><div className="spinner"></div></div>
            </Layout>
        );
    }

        return (
        <>
            <div className="reports-container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">📊 Mes Rapports</h1>
                        <p className="page-subtitle">Analysez vos performances et générez des rapports</p>
                    </div>
                </div>

                {/* Filtres */}
                <div className="filters-card">
                    <div className="filters-row">
                        <div className="filter-group">
                            <label className="filter-label">Date début</label>
                            <input
                                type="date"
                                className="form-input"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                        </div>
                        <div className="filter-group">
                            <label className="filter-label">Date fin</label>
                            <input
                                type="date"
                                className="form-input"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>
                        <div className="filter-group">
                            <label className="filter-label">Type de rapport</label>
                            <select className="form-select" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                                <option value="sales">Ventes</option>
                                <option value="customers">Clients</option>
                                <option value="products">Produits</option>
                                <option value="transactions">Transactions</option>
                            </select>
                        </div>
                        <div className="filter-actions">
                            <button className="btn btn-primary" onClick={generatePDF}>
                                📄 Générer PDF
                            </button>
                            <button className="btn btn-outline" onClick={generateCSV}>
                                📥 Exporter CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cartes KPI */}
                <div className="kpi-grid">
                    <div className="kpi-card">
                        <div className="kpi-icon">💰</div>
                        <div className="kpi-info">
                            <div className="kpi-title">Chiffre d'affaires</div>
                            <div className="kpi-value">{reportData.stats.totalSales.toLocaleString()} FCFA</div>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon">🔄</div>
                        <div className="kpi-info">
                            <div className="kpi-title">Transactions</div>
                            <div className="kpi-value">{reportData.stats.totalTransactions}</div>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon">📊</div>
                        <div className="kpi-info">
                            <div className="kpi-title">Ticket moyen</div>
                            <div className="kpi-value">{Math.round(reportData.stats.averageTicket).toLocaleString()} FCFA</div>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon">👥</div>
                        <div className="kpi-info">
                            <div className="kpi-title">Clients uniques</div>
                            <div className="kpi-value">{reportData.stats.totalCustomers}</div>
                        </div>
                    </div>
                </div>

                {/* Top produits */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">🏆 Top produits vendus</h3>
                    </div>
                    <div className="top-products-list">
                        {reportData.sales.length === 0 ? (
                            <div className="empty-state">Aucune vente sur cette période</div>
                        ) : (
                            reportData.sales.slice(0, 5).map((product, index) => (
                                <div key={index} className="top-product-item">
                                    <div className="product-rank">{index + 1}</div>
                                    <div className="product-info">
                                        <div className="product-name">{product.name}</div>
                                        <div className="product-stats">{product.quantity} vendus</div>
                                    </div>
                                    <div className="product-revenue">{product.revenue.toLocaleString()} FCFA</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Meilleurs clients */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">⭐ Meilleurs clients</h3>
                    </div>
                    <div className="customers-list">
                        {reportData.customers.length === 0 ? (
                            <div className="empty-state">Aucun client sur cette période</div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Client</th>
                                        <th>Achats</th>
                                        <th>Total dépensé</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.customers.slice(0, 10).map((customer, index) => (
                                        <tr key={index}>
                                            <td>{customer.name || 'Client'} {customer.phone && `(${customer.phone})`}</td>
                                            <td>{customer.transactions}</td>
                                            <td className="amount">{customer.totalSpent.toLocaleString()} FCFA</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Dernières transactions */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">📋 Dernières transactions</h3>
                        <button className="btn btn-sm btn-outline" onClick={generateCSV}>
                            Exporter CSV
                        </button>
                    </div>
                    <div className="transactions-list">
                        {reportData.transactions.length === 0 ? (
                            <div className="empty-state">Aucune transaction sur cette période</div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Client</th>
                                        <th>Montant</th>
                                        <th>Type</th>
                                        <th>Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.transactions.slice(0, 15).map((tx, index) => (
                                        <tr key={index}>
                                            <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                                            <td>{`${tx.customer_firstname || ''} ${tx.customer_lastname || ''}`.trim() || 'Client'}</td>
                                            <td className="amount">{tx.amount.toLocaleString()} FCFA</td>
                                            <td>{tx.type === 'purchase' ? 'Achat' : tx.type}</td>
                                            <td>{tx.points_earned || 0} pts</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .reports-container {
                    padding: 24px;
                    background: #f8fafc;
                    min-height: 100vh;
                }
                .filters-card {
                    background: white;
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 24px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .filters-row {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                    align-items: flex-end;
                }
                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .filter-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: #64748b;
                    text-transform: uppercase;
                }
                .filter-actions {
                    display: flex;
                    gap: 10px;
                    margin-left: auto;
                }
                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 24px;
                }
                .kpi-card {
                    background: white;
                    border-radius: 16px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .kpi-icon {
                    font-size: 32px;
                    width: 56px;
                    height: 56px;
                    background: #e0e7ff;
                    border-radius: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .kpi-info {
                    flex: 1;
                }
                .kpi-title {
                    font-size: 12px;
                    color: #64748b;
                    text-transform: uppercase;
                }
                .kpi-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1e293b;
                }
                .chart-card {
                    background: white;
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 24px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .chart-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .top-products-list, .customers-list, .transactions-list {
                    overflow-x: auto;
                }
                .top-product-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px;
                    border-bottom: 1px solid #f1f5f9;
                }
                .product-rank {
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #3b82f6, #1e40af);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                }
                .product-info {
                    flex: 1;
                }
                .product-name {
                    font-weight: 500;
                }
                .product-stats {
                    font-size: 12px;
                    color: #64748b;
                }
                .product-revenue {
                    font-weight: 600;
                    color: #10b981;
                }
                .amount {
                    font-weight: 600;
                    color: #10b981;
                }
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #94a3b8;
                }
                @media (max-width: 768px) {
                    .kpi-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .filter-actions {
                        margin-left: 0;
                        width: 100%;
                    }
                    .filters-row {
                        flex-direction: column;
                    }
                    .filter-group {
                        width: 100%;
                    }
                }
            `}</style>
        </>
    );
}

export default MerchantReports;