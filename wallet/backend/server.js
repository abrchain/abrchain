// ~/abr-project/wallet/backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Database connection
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'abr_wallet',
    user: process.env.DB_USER || 'wallet_user',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
});

// Redis for caching and session management
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
});

// JWT authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Wallet Controller
class WalletController {
    // Create new wallet
    async createWallet(req, res) {
        const client = await pool.connect();
        try {
            const { userId, walletType, walletName, currency } = req.body;
            
            await client.query('BEGIN');
            
            // Generate wallet address (would call C++ core)
            const walletAddress = `abr1${uuidv4().replace(/-/g, '').substring(0, 38)}`;
            
            // Insert wallet
            const result = await client.query(
                `INSERT INTO abr_wallets 
                (user_id, wallet_type, wallet_name, wallet_address, currency)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, wallet_address, created_at`,
                [userId, walletType, walletName, walletAddress, currency]
            );
            
            // Generate backup mnemonic
            const mnemonic = this.generateMnemonic();
            
            // Store encrypted backup
            const encryptedBackup = await this.encryptBackup(mnemonic, userId);
            await client.query(
                `INSERT INTO abr_wallet_backups 
                (wallet_id, backup_type, encrypted_backup)
                VALUES ($1, 'mnemonic', $2)`,
                [result.rows[0].id, encryptedBackup]
            );
            
            await client.query('COMMIT');
            
            res.json({
                success: true,
                wallet: result.rows[0],
                mnemonic: mnemonic // Only shown once!
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Wallet creation error:', error);
            res.status(500).json({ error: 'Failed to create wallet' });
        } finally {
            client.release();
        }
    }
    
    // Get wallet balance
    async getBalance(req, res) {
        try {
            const { walletId } = req.params;
            
            // Try cache first
            const cached = await redis.get(`wallet:${walletId}:balance`);
            if (cached) {
                return res.json(JSON.parse(cached));
            }
            
            const result = await pool.query(
                `SELECT balance_abr, balance_fiat, currency, last_accessed 
                 FROM abr_wallets WHERE id = $1 AND user_id = $2`,
                [walletId, req.user.userId]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Wallet not found' });
            }
            
            const balance = result.rows[0];
            
            // Cache for 30 seconds
            await redis.setex(
                `wallet:${walletId}:balance`,
                30,
                JSON.stringify(balance)
            );
            
            res.json(balance);
            
        } catch (error) {
            console.error('Balance fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch balance' });
        }
    }
    
    // Send transaction
    async sendTransaction(req, res) {
        const client = await pool.connect();
        try {
            const { walletId } = req.params;
            const { toAddress, amount, fee, memo } = req.body;
            
            await client.query('BEGIN');
            
            // Check wallet exists and belongs to user
            const wallet = await client.query(
                `SELECT * FROM abr_wallets WHERE id = $1 AND user_id = $2`,
                [walletId, req.user.userId]
            );
            
            if (wallet.rows.length === 0) {
                return res.status(404).json({ error: 'Wallet not found' });
            }
            
            // Check balance
            if (wallet.rows[0].balance_abr < amount + (fee || 0)) {
                return res.status(400).json({ error: 'Insufficient balance' });
            }
            
            // Create transaction record
            const txResult = await client.query(
                `INSERT INTO abr_wallet_transactions 
                (wallet_id, transaction_type, amount_abr, fee_abr, to_address, memo, status)
                VALUES ($1, 'send', $2, $3, $4, $5, 'pending')
                RETURNING id`,
                [walletId, amount, fee || 0, toAddress, memo]
            );
            
            // Call C++ core to broadcast transaction
            const txHash = await this.broadcastTransaction(
                wallet.rows[0].wallet_address,
                toAddress,
                amount,
                fee || 0
            );
            
            // Update transaction with hash
            await client.query(
                `UPDATE abr_wallet_transactions 
                 SET tx_hash = $1, status = 'completed', completed_at = NOW()
                 WHERE id = $2`,
                [txHash, txResult.rows[0].id]
            );
            
            // Update wallet balance
            await client.query(
                `UPDATE abr_wallets 
                 SET balance_abr = balance_abr - $1,
                     last_transaction_at = NOW()
                 WHERE id = $2`,
                [amount + (fee || 0), walletId]
            );
            
            await client.query('COMMIT');
            
            // Invalidate cache
            await redis.del(`wallet:${walletId}:balance`);
            await redis.del(`wallet:${walletId}:transactions`);
            
            res.json({
                success: true,
                transactionId: txResult.rows[0].id,
                txHash: txHash,
                amount: amount,
                toAddress: toAddress,
                status: 'completed'
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Transaction error:', error);
            res.status(500).json({ error: 'Failed to send transaction' });
        } finally {
            client.release();
        }
    }
    
    // Get transaction history
    async getTransactions(req, res) {
        try {
            const { walletId } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            
            // Try cache first
            const cacheKey = `wallet:${walletId}:transactions:${limit}:${offset}`;
            const cached = await redis.get(cacheKey);
            if (cached) {
                return res.json(JSON.parse(cached));
            }
            
            const result = await pool.query(
                `SELECT * FROM abr_wallet_transactions 
                 WHERE wallet_id = $1 
                 ORDER BY created_at DESC 
                 LIMIT $2 OFFSET $3`,
                [walletId, limit, offset]
            );
            
            // Cache for 1 minute
            await redis.setex(cacheKey, 60, JSON.stringify(result.rows));
            
            res.json({
                transactions: result.rows,
                count: result.rows.length,
                limit: limit,
                offset: offset
            });
            
        } catch (error) {
            console.error('Transaction history error:', error);
            res.status(500).json({ error: 'Failed to fetch transactions' });
        }
    }
    
    // Add to address book
    async addToAddressBook(req, res) {
        try {
            const { walletId } = req.params;
            const { address, label, type } = req.body;
            
            const result = await pool.query(
                `INSERT INTO abr_address_book 
                (user_id, wallet_id, address, label, type)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id`,
                [req.user.userId, walletId, address, label, type || 'external']
            );
            
            res.json({
                success: true,
                id: result.rows[0].id,
                address: address,
                label: label
            });
            
        } catch (error) {
            console.error('Address book error:', error);
            res.status(500).json({ error: 'Failed to add address' });
        }
    }
    
    // Get address book
    async getAddressBook(req, res) {
        try {
            const { walletId } = req.params;
            
            const result = await pool.query(
                `SELECT * FROM abr_address_book 
                 WHERE wallet_id = $1 
                 ORDER BY favorite DESC, last_used DESC NULLS LAST`,
                [walletId]
            );
            
            res.json(result.rows);
            
        } catch (error) {
            console.error('Address book fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch address book' });
        }
    }
    
    // Card operations
    async linkCard(req, res) {
        try {
            const { walletId } = req.params;
            const { cardId } = req.body;
            
            // Call card service to link
            // This would integrate with your card service
            
            res.json({
                success: true,
                message: 'Card linked successfully',
                cardId: cardId,
                walletId: walletId
            });
            
        } catch (error) {
            console.error('Card linking error:', error);
            res.status(500).json({ error: 'Failed to link card' });
        }
    }
    
    async topUpCard(req, res) {
        try {
            const { walletId } = req.params;
            const { cardId, amount } = req.body;
            
            // Call card service to top up
            // This would integrate with your card service
            
            res.json({
                success: true,
                message: 'Card topped up successfully',
                cardId: cardId,
                amount: amount
            });
            
        } catch (error) {
            console.error('Card top-up error:', error);
            res.status(500).json({ error: 'Failed to top up card' });
        }
    }
    
    // Helper methods
    generateMnemonic() {
        const wordlist = ['abandon', 'ability', 'able', 'about', 'above', 'absent',
                          'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident'];
        let mnemonic = [];
        for (let i = 0; i < 12; i++) {
            mnemonic.push(wordlist[Math.floor(Math.random() * wordlist.length)]);
        }
        return mnemonic.join(' ');
    }
    
    async encryptBackup(data, userId) {
        // In production, use proper encryption
        const salt = await bcrypt.genSalt(10);
        const encrypted = await bcrypt.hash(data + userId, salt);
        return encrypted;
    }
    
    async broadcastTransaction(from, to, amount, fee) {
        // Call C++ core via RPC
        // Return transaction hash
        return `0x${uuidv4().replace(/-/g, '')}`;
    }
}

const walletController = new WalletController();

// API Routes
app.post('/api/wallets', authenticateToken, walletController.createWallet.bind(walletController));
app.get('/api/wallets/:walletId/balance', authenticateToken, walletController.getBalance.bind(walletController));
app.post('/api/wallets/:walletId/send', authenticateToken, walletController.sendTransaction.bind(walletController));
app.get('/api/wallets/:walletId/transactions', authenticateToken, walletController.getTransactions.bind(walletController));

// Address book
app.post('/api/wallets/:walletId/addressbook', authenticateToken, walletController.addToAddressBook.bind(walletController));
app.get('/api/wallets/:walletId/addressbook', authenticateToken, walletController.getAddressBook.bind(walletController));

// Card integration
app.post('/api/wallets/:walletId/cards/link', authenticateToken, walletController.linkCard.bind(walletController));
app.post('/api/wallets/:walletId/cards/topup', authenticateToken, walletController.topUpCard.bind(walletController));

// WebSocket for real-time updates
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'subscribe') {
            // Subscribe to wallet updates
            ws.walletId = data.walletId;
            
            // Send initial balance
            const balance = await pool.query(
                'SELECT balance_abr FROM abr_wallets WHERE id = $1',
                [data.walletId]
            );
            
            ws.send(JSON.stringify({
                type: 'balance',
                data: balance.rows[0]
            }));
        }
    });
});

// Start server
const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
    console.log(`🚀 ABR Wallet API running on port ${PORT}`);
    console.log(`📡 WebSocket server running on port 8080`);
});
