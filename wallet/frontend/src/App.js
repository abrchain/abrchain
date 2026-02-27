// ~/abr-project/wallet/frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import axios from 'axios';
import { useWebSocket } from './hooks/useWebSocket';
import Dashboard from './components/Dashboard';
import Send from './components/Send';
import Receive from './components/Receive';
import Transactions from './components/Transactions';
import Cards from './components/Cards';
import Settings from './components/Settings';
import './App.css';

function App() {
    const [user, setUser] = useState(null);
    const [wallets, setWallets] = useState([]);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [balance, setBalance] = useState(null);
    
    const ws = useWebSocket('ws://localhost:8080');
    
    useEffect(() => {
        // Load user data
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            loadWallets();
        }
    }, []);
    
    useEffect(() => {
        if (selectedWallet) {
            loadBalance(selectedWallet.id);
            
            // Subscribe to WebSocket updates
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    walletId: selectedWallet.id
                }));
            }
        }
    }, [selectedWallet, ws]);
    
    useEffect(() => {
        if (ws) {
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'balance') {
                    setBalance(data.data);
                }
            };
        }
    }, [ws]);
    
    const loadWallets = async () => {
        try {
            const response = await axios.get('/api/wallets');
            setWallets(response.data);
            if (response.data.length > 0) {
                setSelectedWallet(response.data[0]);
            }
        } catch (error) {
            console.error('Failed to load wallets:', error);
        }
    };
    
    const loadBalance = async (walletId) => {
        try {
            const response = await axios.get(`/api/wallets/${walletId}/balance`);
            setBalance(response.data);
        } catch (error) {
            console.error('Failed to load balance:', error);
        }
    };
    
    const createWallet = async () => {
        try {
            const response = await axios.post('/api/wallets', {
                walletType: 'personal',
                walletName: 'My Wallet',
                currency: 'USD'
            });
            
            // Show mnemonic to user
            alert(`Save your recovery phrase: ${response.data.mnemonic}`);
            
            await loadWallets();
        } catch (error) {
            console.error('Failed to create wallet:', error);
        }
    };
    
    return (
        <Router>
            <div className="app">
                <nav className="sidebar">
                    <div className="logo">
                        <h2>ABR Wallet</h2>
                    </div>
                    
                    <div className="wallet-selector">
                        <select 
                            value={selectedWallet?.id} 
                            onChange={(e) => {
                                const wallet = wallets.find(w => w.id === parseInt(e.target.value));
                                setSelectedWallet(wallet);
                            }}
                        >
                            {wallets.map(wallet => (
                                <option key={wallet.id} value={wallet.id}>
                                    {wallet.wallet_name}
                                </option>
                            ))}
                        </select>
                        
                        <button onClick={createWallet} className="btn-add">
                            + New Wallet
                        </button>
                    </div>
                    
                    {balance && (
                        <div className="balance-card">
                            <h3>Total Balance</h3>
                            <div className="balance-amount">
                                {balance.balance_abr} ABR
                            </div>
                            <div className="balance-fiat">
                                ≈ ${balance.balance_fiat} {balance.currency}
                            </div>
                        </div>
                    )}
                    
                    <nav className="menu">
                        <a href="/" className="menu-item active">
                            <i className="icon-dashboard"></i> Dashboard
                        </a>
                        <a href="/send" className="menu-item">
                            <i className="icon-send"></i> Send
                        </a>
                        <a href="/receive" className="menu-item">
                            <i className="icon-receive"></i> Receive
                        </a>
                        <a href="/transactions" className="menu-item">
                            <i className="icon-history"></i> Transactions
                        </a>
                        <a href="/cards" className="menu-item">
                            <i className="icon-card"></i> Cards
                        </a>
                        <a href="/settings" className="menu-item">
                            <i className="icon-settings"></i> Settings
                        </a>
                    </nav>
                </nav>
                
                <main className="content">
                    <Switch>
                        <Route exact path="/">
                            <Dashboard 
                                wallet={selectedWallet} 
                                balance={balance}
                                onRefresh={() => loadBalance(selectedWallet?.id)}
                            />
                        </Route>
                        <Route path="/send">
                            <Send wallet={selectedWallet} />
                        </Route>
                        <Route path="/receive">
                            <Receive wallet={selectedWallet} />
                        </Route>
                        <Route path="/transactions">
                            <Transactions wallet={selectedWallet} />
                        </Route>
                        <Route path="/cards">
                            <Cards wallet={selectedWallet} />
                        </Route>
                        <Route path="/settings">
                            <Settings wallet={selectedWallet} />
                        </Route>
                    </Switch>
                </main>
            </div>
        </Router>
    );
}

export default App;
