import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard({ wallet, balance, onRefresh }) {
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [priceData, setPriceData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cards, setCards] = useState([]);

    useEffect(() => {
        if (wallet) {
            loadTransactions();
            loadPriceData();
            loadCards();
        }
    }, [wallet]);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:3009/api/wallets/${wallet.id}/transactions?limit=5`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRecentTransactions(response.data.transactions || []);
        } catch (error) {
            console.error('Failed to load transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPriceData = () => {
        // Mock price data for demonstration
        setPriceData({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'ABR Price (USD)',
                    data: [0.15, 0.18, 0.22, 0.25, 0.28, 0.32],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#4CAF50',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }
            ]
        });
    };

    const loadCards = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:3009/api/wallets/${wallet.id}/cards`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCards(response.data.cards || []);
        } catch (error) {
            console.error('Failed to load cards:', error);
        }
    };

    const formatAddress = (address) => {
        if (!address) return 'N/A';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const getTransactionIcon = (type) => {
        switch(type) {
            case 'send': return '📤';
            case 'receive': return '📥';
            case 'card_topup': return '💳';
            case 'swap': return '🔄';
            default: return '💱';
        }
    };

    return (
        <div className="dashboard" style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Dashboard</h1>
                <button onClick={onRefresh} style={styles.refreshButton}>
                    ↻ Refresh
                </button>
            </header>
            
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>💰</div>
                    <div style={styles.statContent}>
                        <div style={styles.statLabel}>Total Balance</div>
                        <div style={styles.statValue}>
                            {balance?.balance_abr?.toFixed(4) || '0.0000'} ABR
                        </div>
                        <div style={styles.statSub}>
                            ≈ ${balance?.balance_fiat?.toFixed(2) || '0.00'} {balance?.currency || 'USD'}
                        </div>
                    </div>
                </div>
                
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>📈</div>
                    <div style={styles.statContent}>
                        <div style={styles.statLabel}>24h Change</div>
                        <div style={{...styles.statValue, color: '#4CAF50'}}>+5.2%</div>
                        <div style={styles.statSub}>+$23.45</div>
                    </div>
                </div>
                
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>💳</div>
                    <div style={styles.statContent}>
                        <div style={styles.statLabel}>Active Cards</div>
                        <div style={styles.statValue}>{cards.length}</div>
                        <div style={styles.statSub}>
                            {cards.filter(c => c.type === 'virtual').length} Virtual • {cards.filter(c => c.type !== 'virtual').length} Physical
                        </div>
                    </div>
                </div>
                
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>🔄</div>
                    <div style={styles.statContent}>
                        <div style={styles.statLabel}>Transactions</div>
                        <div style={styles.statValue}>{recentTransactions.length}</div>
                        <div style={styles.statSub}>This month</div>
                    </div>
                </div>
            </div>
            
            {priceData && (
                <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>ABR Price Chart (30 days)</h3>
                    <div style={styles.chartContainer}>
                        <Line 
                            data={priceData} 
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false
                                    },
                                    tooltip: {
                                        backgroundColor: '#1E1E1E',
                                        titleColor: '#FFF',
                                        bodyColor: '#CCC',
                                        borderColor: '#333',
                                        borderWidth: 1
                                    }
                                },
                                scales: {
                                    y: {
                                        grid: {
                                            color: 'rgba(255, 255, 255, 0.1)'
                                        },
                                        ticks: {
                                            callback: (value) => '$' + value
                                        }
                                    },
                                    x: {
                                        grid: {
                                            display: false
                                        }
                                    }
                                }
                            }} 
                        />
                    </div>
                </div>
            )}
            
            <div style={styles.recentTransactions}>
                <div style={styles.sectionHeader}>
                    <h3 style={styles.sectionTitle}>Recent Transactions</h3>
                    <a href="/transactions" style={styles.viewAllLink}>View All →</a>
                </div>
                
                {loading ? (
                    <div style={styles.loading}>Loading transactions...</div>
                ) : recentTransactions.length > 0 ? (
                    <table style={styles.transactionsTable}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Type</th>
                                <th style={styles.th}>Address</th>
                                <th style={styles.th}>Amount</th>
                                <th style={styles.th}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTransactions.map(tx => (
                                <tr key={tx.id} style={styles.tr}>
                                    <td style={styles.td}>{formatDate(tx.created_at)}</td>
                                    <td style={styles.td}>
                                        <span style={{
                                            ...styles.txType,
                                            ...styles[tx.transaction_type]
                                        }}>
                                            {getTransactionIcon(tx.transaction_type)} {tx.transaction_type}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.address}>
                                            {tx.transaction_type === 'send' ? 'To: ' : 'From: '}
                                            {formatAddress(tx.to_address || tx.from_address)}
                                        </span>
                                    </td>
                                    <td style={{
                                        ...styles.td,
                                        ...styles.amount,
                                        color: tx.transaction_type === 'send' ? '#f44336' : '#4CAF50'
                                    }}>
                                        {tx.transaction_type === 'send' ? '-' : '+'}
                                        {tx.amount_abr?.toFixed(4) || '0.0000'} ABR
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{
                                            ...styles.status,
                                            ...styles[tx.status]
                                        }}>
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={styles.noData}>No transactions yet</div>
                )}
            </div>
            
            <div style={styles.quickActions}>
                <button style={styles.actionBtn} onClick={() => window.location.href='/send'}>
                    <span style={styles.actionIcon}>📤</span>
                    Send
                </button>
                <button style={styles.actionBtn} onClick={() => window.location.href='/receive'}>
                    <span style={styles.actionIcon}>📥</span>
                    Receive
                </button>
                <button style={styles.actionBtn} onClick={() => window.location.href='/cards'}>
                    <span style={styles.actionIcon}>💳</span>
                    Cards
                </button>
                <button style={styles.actionBtn} onClick={() => window.location.href='/swap'}>
                    <span style={styles.actionIcon}>🔄</span>
                    Swap
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: '24px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
    },
    title: {
        margin: 0,
        fontSize: '28px',
        color: '#333'
    },
    refreshButton: {
        padding: '8px 16px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.3s'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    statIcon: {
        fontSize: '32px',
        marginRight: '16px'
    },
    statContent: {
        flex: 1
    },
    statLabel: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '4px'
    },
    statValue: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '2px'
    },
    statSub: {
        fontSize: '12px',
        color: '#999'
    },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    chartTitle: {
        margin: '0 0 20px 0',
        fontSize: '18px',
        color: '#333'
    },
    chartContainer: {
        height: '300px'
    },
    recentTransactions: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    sectionTitle: {
        margin: 0,
        fontSize: '18px',
        color: '#333'
    },
    viewAllLink: {
        color: '#4CAF50',
        textDecoration: 'none',
        fontSize: '14px'
    },
    transactionsTable: {
        width: '100%',
        borderCollapse: 'collapse'
    },
    th: {
        textAlign: 'left',
        padding: '12px',
        borderBottom: '2px solid #eee',
        color: '#666',
        fontWeight: '600',
        fontSize: '14px'
    },
    td: {
        padding: '12px',
        borderBottom: '1px solid #eee',
        fontSize: '14px'
    },
    tr: {
        transition: 'background-color 0.3s'
    },
    txType: {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500'
    },
    send: {
        backgroundColor: '#ffebee',
        color: '#f44336'
    },
    receive: {
        backgroundColor: '#e8f5e8',
        color: '#4CAF50'
    },
    card_topup: {
        backgroundColor: '#e3f2fd',
        color: '#2196f3'
    },
    address: {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#666'
    },
    amount: {
        fontWeight: '600'
    },
    status: {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500'
    },
    pending: {
        backgroundColor: '#fff3e0',
        color: '#ff9800'
    },
    completed: {
        backgroundColor: '#e8f5e8',
        color: '#4CAF50'
    },
    failed: {
        backgroundColor: '#ffebee',
        color: '#f44336'
    },
    loading: {
        textAlign: 'center',
        padding: '40px',
        color: '#666'
    },
    noData: {
        textAlign: 'center',
        padding: '40px',
        color: '#999',
        fontStyle: 'italic'
    },
    quickActions: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px'
    },
    actionBtn: {
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '10px',
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        fontSize: '14px',
        color: '#333'
    },
    actionIcon: {
        fontSize: '24px'
    }
};

export default Dashboard;
