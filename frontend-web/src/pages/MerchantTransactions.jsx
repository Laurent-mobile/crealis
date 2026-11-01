// frontend-web/src/pages/MerchantTransactions.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';

function MerchantTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, totalAmount: 0 });

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/transactions');
            // Filtrer les transactions du commerçant
            const merchantTx = response.data.filter(t => t.merchant_id === localStorage.getItem('merchantId'));
            setTransactions(merchantTx);
            setStats({
                total: merchantTx.length,
                totalAmount: merchantTx.reduce((sum, t) => sum + (t.amount || 0), 0)
            });
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        
            <div className="page-container">
                <div className="page-header">
                    <h1 className="page-title">💰 Mes Transactions</h1>
                    <p className="page-subtitle">Historique des ventes de ma boutique</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Transactions</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalAmount.toLocaleString()} FCFA</div>
                        <div className="stat-label">Chiffre d'affaires</div>
                    </div>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Montant</th>
                                <th>Type</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(tx => (
                                <tr key={tx.id}>
                                    <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                                    <td>{tx.customer_name || 'Client'}</td>
                                    <td>{tx.amount?.toLocaleString()} FCFA</td>
                                    <td>{tx.type}</td>
                                    <td><span className="badge badge-success">✓</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        
    );
}

export default MerchantTransactions;
