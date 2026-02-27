// satoshi-core/api/satoshi-api.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const winston = require('winston');
const Redis = require('ioredis');
const { body, param, query, validationResult } = require('express-validator');
const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ==================== Configuration ====================

const SATOSHI_PER_ABR = 100_000_000;
const MAX_SATOSHI = 1_000_000_000 * SATOSHI_PER_ABR;
const MIN_SATOSHI = 1;
const JWT_SECRET = process.env.JWT_SECRET || 'abr-satoshi-secret-key-change-in-production';
const JWT_EXPIRY = '24h';

const config = {
    port: process.env.PORT || 3016,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    environment: process.env.NODE_ENV || 'development',
    exchangeApi: process.env.EXCHANGE_API || 'http://localhost:3011',
    abrNode: process.env.ABR_NODE || 'http://localhost:9332',
    abrNodeUser: process.env.ABR_NODE_USER || 'abruser',
    abrNodePass: process.env.ABR_NODE_PASS || 'abrpass',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/satoshi-api',
    jwtSecret: JWT_SECRET,
    jwtExpiry: JWT_EXPIRY
};

// ==================== Logger Configuration ====================

const logger = winston.createLogger({
    level: config.environment === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'satoshi-api' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error', maxsize: 5242880, maxFiles: 5 }),
        new winston.transports.File({ filename: 'combined.log', maxsize: 5242880, maxFiles: 5 }),
        new winston.transports.Console({ 
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// ==================== Redis Cache ====================

let redis;
try {
    redis = new Redis(config.redisUrl, {
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
        enableReadyCheck: true
    });
    
    redis.on('connect', () => logger.info('✅ Redis connected'));
    redis.on('error', (err) => {
        logger.warn('Redis connection failed, using memory cache', err.message);
        redis = null;
    });
} catch (error) {
    logger.warn('Redis not available, using memory cache');
    redis = null;
}

// Memory cache fallback
const memoryCache = new Map();
const cache = {
    async get(key) {
        if (redis) {
            try {
                const value = await redis.get(key);
                return value ? JSON.parse(value) : null;
            } catch (err) {
                logger.debug('Redis get error:', err);
            }
        }
        
        const cached = memoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }
        memoryCache.delete(key);
        return null;
    },
    
    async set(key, data, ttlSeconds = 60) {
        const serialized = JSON.stringify(data);
        
        if (redis) {
            try {
                await redis.setex(key, ttlSeconds, serialized);
                return;
            } catch (err) {
                logger.debug('Redis set error:', err);
            }
        }
        
        memoryCache.set(key, {
            data,
            expiry: Date.now() + (ttlSeconds * 1000)
        });
    },
    
    async del(key) {
        if (redis) {
            try {
                await redis.del(key);
            } catch (err) {
                logger.debug('Redis del error:', err);
            }
        }
        memoryCache.delete(key);
    },
    
    async flush() {
        if (redis) {
            await redis.flushall();
        }
        memoryCache.clear();
    }
};

// ==================== Database Models (MongoDB) ====================

// In production, use Mongoose. For now, in-memory store
const users = new Map();
const wallets = new Map();
const transactions = new Map();
const addresses = new Map();
const utxos = new Map();
const contacts = new Map();
const apiKeys = new Map();
const webhooks = new Map();
const rateLimits = new Map();

// ==================== Fee Structure ====================

const FEE_STRUCTURE = {
    transaction: {
        base: 1_000,              // 1,000 sats base fee
        perByte: 1,                // 1 sat per byte
        priority: 2_000,           // 2,000 sats for priority
        bulk: 500,                 // 500 sats per tx in bulk
        min: 1_000,                // Minimum 1,000 sats
        max: 100_000,              // Maximum 100,000 sats
        description: "Standard transaction fee"
    },
    swap: {
        base: 500,                 // 500 sats base
        percentage: 10,            // 0.1% in basis points
        min: 100,                  // Min 100 sats
        max: 100_000,              // Max 100k sats
        description: "Token swap fee"
    },
    bridge: {
        base: 5_000,               // 5,000 sats base
        percentage: 5,             // 0.05% in basis points
        min: 1_000,                // Min 1,000 sats
        max: 1_000_000,            // Max 1M sats
        description: "Cross-chain bridge fee"
    },
    airdrop: {
        base: 100,                 // 100 sats
        description: "Airdrop claim fee"
    },
    deployment: {
        base: 10_000_000,          // 0.1 ABR in sats
        perModule: 1_000_000,      // 0.01 ABR per module
        description: "Contract deployment fee"
    },
    storage: {
        perKb: 10,                 // 10 sats per KB
        description: "Storage fee"
    },
    computation: {
        perGas: 0.001,             // 0.001 sats per gas unit
        description: "Computation fee"
    },
    subscription: {
        monthly: 50_000,           // 50,000 sats/month
        yearly: 500_000,           // 500,000 sats/year
        description: "Subscription fee"
    }
};

// ==================== African Currency Configuration ====================

const AFRICAN_CURRENCIES = {
    // Major currencies for reference
    USD: { name: 'US Dollar', symbol: '$', decimals: 2, satsPerUnit: 100_000 },
    EUR: { name: 'Euro', symbol: '€', decimals: 2, satsPerUnit: 110_000 },
    GBP: { name: 'British Pound', symbol: '£', decimals: 2, satsPerUnit: 130_000 },
    
    // West Africa
    NGN: { name: 'Nigerian Naira', symbol: '₦', decimals: 2, satsPerUnit: 150_000 },
    GHS: { name: 'Ghanaian Cedi', symbol: '₵', decimals: 2, satsPerUnit: 12_000 },
    XOF: { name: 'West African CFA', symbol: 'CFA', decimals: 0, satsPerUnit: 600 },
    GMD: { name: 'Gambian Dalasi', symbol: 'D', decimals: 2, satsPerUnit: 1_900 },
    GNF: { name: 'Guinean Franc', symbol: 'FG', decimals: 0, satsPerUnit: 12 },
    SLE: { name: 'Sierra Leonean Leone', symbol: 'Le', decimals: 2, satsPerUnit: 5_300 },
    LRD: { name: 'Liberian Dollar', symbol: 'L$', decimals: 2, satsPerUnit: 520 },
    
    // East Africa
    KES: { name: 'Kenyan Shilling', symbol: 'KSh', decimals: 2, satsPerUnit: 130_000 },
    UGX: { name: 'Ugandan Shilling', symbol: 'USh', decimals: 0, satsPerUnit: 380 },
    TZS: { name: 'Tanzanian Shilling', symbol: 'TSh', decimals: 0, satsPerUnit: 430 },
    RWF: { name: 'Rwandan Franc', symbol: 'FRw', decimals: 0, satsPerUnit: 100 },
    ETB: { name: 'Ethiopian Birr', symbol: 'Br', decimals: 2, satsPerUnit: 1_800 },
    SOS: { name: 'Somali Shilling', symbol: 'S', decimals: 2, satsPerUnit: 170 },
    DJF: { name: 'Djiboutian Franc', symbol: 'Fdj', decimals: 0, satsPerUnit: 560 },
    ERN: { name: 'Eritrean Nakfa', symbol: 'Nfk', decimals: 2, satsPerUnit: 6_700 },
    BIF: { name: 'Burundian Franc', symbol: 'FBu', decimals: 0, satsPerUnit: 50 },
    KMF: { name: 'Comorian Franc', symbol: 'CF', decimals: 0, satsPerUnit: 220 },
    
    // Southern Africa
    ZAR: { name: 'South African Rand', symbol: 'R', decimals: 2, satsPerUnit: 18_000 },
    ZMW: { name: 'Zambian Kwacha', symbol: 'ZK', decimals: 2, satsPerUnit: 6_000 },
    BWP: { name: 'Botswana Pula', symbol: 'P', decimals: 2, satsPerUnit: 9_000 },
    MZN: { name: 'Mozambican Metical', symbol: 'MT', decimals: 2, satsPerUnit: 1_600 },
    AOA: { name: 'Angolan Kwanza', symbol: 'Kz', decimals: 2, satsPerUnit: 190 },
    NAD: { name: 'Namibian Dollar', symbol: 'N$', decimals: 2, satsPerUnit: 18_000 },
    SZL: { name: 'Swazi Lilangeni', symbol: 'E', decimals: 2, satsPerUnit: 18_000 },
    LSL: { name: 'Lesotho Loti', symbol: 'L', decimals: 2, satsPerUnit: 18_000 },
    MWK: { name: 'Malawian Kwacha', symbol: 'MK', decimals: 2, satsPerUnit: 60 },
    ZWL: { name: 'Zimbabwean Dollar', symbol: 'Z$', decimals: 2, satsPerUnit: 280 },
    
    // North Africa
    EGP: { name: 'Egyptian Pound', symbol: 'E£', decimals: 2, satsPerUnit: 5_000 },
    MAD: { name: 'Moroccan Dirham', symbol: 'DH', decimals: 2, satsPerUnit: 10_000 },
    DZD: { name: 'Algerian Dinar', symbol: 'DA', decimals: 2, satsPerUnit: 750 },
    TND: { name: 'Tunisian Dinar', symbol: 'DT', decimals: 3, satsPerUnit: 33_000 },
    LYD: { name: 'Libyan Dinar', symbol: 'LD', decimals: 3, satsPerUnit: 72_000 },
    MRU: { name: 'Mauritanian Ouguiya', symbol: 'UM', decimals: 2, satsPerUnit: 2_800 },
    SDG: { name: 'Sudanese Pound', symbol: 'SDG', decimals: 2, satsPerUnit: 170 },
    SSP: { name: 'South Sudanese Pound', symbol: 'SSP', decimals: 2, satsPerUnit: 130 },
    
    // Central Africa
    XAF: { name: 'Central African CFA', symbol: 'FCFA', decimals: 0, satsPerUnit: 600 },
    CDF: { name: 'Congolese Franc', symbol: 'FC', decimals: 2, satsPerUnit: 40 },
    STD: { name: 'São Tomé and Príncipe Dobra', symbol: 'Db', decimals: 2, satsPerUnit: 4 },
    
    // Islands
    MUR: { name: 'Mauritian Rupee', symbol: '₨', decimals: 2, satsPerUnit: 2_800 },
    SCR: { name: 'Seychellois Rupee', symbol: 'SR', decimals: 2, satsPerUnit: 7_500 },
    CVE: { name: 'Cape Verdean Escudo', symbol: '$', decimals: 2, satsPerUnit: 1_000 },
    MGA: { name: 'Malagasy Ariary', symbol: 'Ar', decimals: 2, satsPerUnit: 22 }
};

// ==================== Middleware ====================

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:19006', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.headers['x-api-key'] || req.ip
});

app.use('/api/', limiter);

// Authentication middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    const apiKey = req.headers['x-api-key'];
    
    if (!token && !apiKey) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (apiKey) {
        // API key authentication
        const keyData = Array.from(apiKeys.values()).find(k => k.key === apiKey);
        if (!keyData || (keyData.expiresAt && keyData.expiresAt < Date.now())) {
            return res.status(401).json({ error: 'Invalid or expired API key' });
        }
        req.user = { userId: keyData.userId, apiKey: true };
        return next();
    }
    
    // JWT authentication
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Admin authentication
const authenticateAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Input validation
const validateSatoshiAmount = (value) => {
    if (!Number.isInteger(value) || value < MIN_SATOSHI || value > MAX_SATOSHI) {
        throw new Error(`Amount must be between ${MIN_SATOSHI} and ${MAX_SATOSHI} satoshis`);
    }
    return true;
};

// ==================== Helper Functions ====================

/**
 * Convert ABR to satoshis
 */
function toSatoshi(abr) {
    if (typeof abr !== 'number' || abr < 0 || isNaN(abr)) {
        throw new Error('Invalid ABR amount');
    }
    return Math.round(abr * SATOSHI_PER_ABR);
}

/**
 * Convert satoshis to ABR
 */
function toAbr(satoshis) {
    if (!Number.isInteger(satoshis) || satoshis < 0) {
        throw new Error('Invalid satoshi amount');
    }
    return satoshis / SATOSHI_PER_ABR;
}

/**
 * Convert satoshis to local currency
 */
function satoshisToLocal(satoshis, currency) {
    const curr = AFRICAN_CURRENCIES[currency];
    if (!curr) {
        throw new Error(`Unsupported currency: ${currency}`);
    }
    
    const amount = satoshis / curr.satsPerUnit;
    const factor = Math.pow(10, curr.decimals);
    return Math.round(amount * factor) / factor;
}

/**
 * Convert local currency to satoshis
 */
function localToSatoshis(amount, currency) {
    const curr = AFRICAN_CURRENCIES[currency];
    if (!curr) {
        throw new Error(`Unsupported currency: ${currency}`);
    }
    
    return Math.round(amount * curr.satsPerUnit);
}

/**
 * Calculate dynamic fee based on amount and type
 */
function calculateFee(amountSatoshis, feeType, options = {}) {
    const feeConfig = FEE_STRUCTURE[feeType];
    if (!feeConfig) {
        throw new Error(`Unknown fee type: ${feeType}`);
    }
    
    let fee = feeConfig.base || 0;
    
    // Add percentage if applicable
    if (feeConfig.percentage) {
        const percentageFee = Math.round(amountSatoshis * feeConfig.percentage / 10000);
        fee += percentageFee;
    }
    
    // Add per-byte fee if applicable
    if (feeConfig.perByte && options.txSize) {
        fee += options.txSize * feeConfig.perByte;
    }
    
    // Apply priority multiplier
    if (options.priority && feeConfig.priority) {
        fee = feeConfig.priority;
    }
    
    // Apply volume discount for large amounts
    if (amountSatoshis > 1_000_000_000) { // > 10 ABR
        const discount = Math.round(fee * 0.1); // 10% discount
        fee -= discount;
    }
    
    // Apply African discount if applicable
    if (options.africanUser) {
        const discount = Math.round(fee * 0.05); // 5% discount
        fee -= discount;
    }
    
    // Apply min/max bounds
    if (feeConfig.min && fee < feeConfig.min) {
        fee = feeConfig.min;
    }
    if (feeConfig.max && fee > feeConfig.max) {
        fee = feeConfig.max;
    }
    
    return Math.max(fee, MIN_SATOSHI);
}

/**
 * Generate transaction ID
 */
function generateTxid() {
    return 'tx_' + crypto.randomBytes(32).toString('hex').substring(0, 64);
}

/**
 * Generate batch ID
 */
function generateBatchId() {
    return 'batch_' + crypto.randomBytes(16).toString('hex');
}

/**
 * Generate API key
 */
function generateApiKey() {
    return 'abr_' + crypto.randomBytes(32).toString('hex');
}

/**
 * Generate webhook secret
 */
function generateWebhookSecret() {
    return 'whsec_' + crypto.randomBytes(32).toString('hex');
}

/**
 * Check if IP is from Africa (simplified)
 */
function isAfricanIP(ip) {
    // In production, use GeoIP database
    const africanRanges = [
        '41.0.0.0/8', '102.0.0.0/8', '105.0.0.0/8', 
        '154.0.0.0/8', '196.0.0.0/8', '197.0.0.0/8'
    ];
    
    // Simplified check - in production, use actual CIDR matching
    return ip.startsWith('41.') || ip.startsWith('102.') || 
           ip.startsWith('105.') || ip.startsWith('154.') ||
           ip.startsWith('196.') || ip.startsWith('197.');
}

// ==================== WebSocket Server ====================

const wsClients = new Map();

wss.on('connection', (ws, req) => {
    const clientId = crypto.randomBytes(16).toString('hex');
    wsClients.set(clientId, { ws, subscriptions: new Set() });
    
    logger.info(`WebSocket client connected: ${clientId}`);
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'subscribe':
                    if (data.channels) {
                        data.channels.forEach(channel => {
                            wsClients.get(clientId).subscriptions.add(channel);
                        });
                        ws.send(JSON.stringify({ 
                            type: 'subscribed', 
                            channels: data.channels 
                        }));
                    }
                    break;
                    
                case 'unsubscribe':
                    if (data.channels) {
                        data.channels.forEach(channel => {
                            wsClients.get(clientId).subscriptions.delete(channel);
                        });
                    }
                    break;
                    
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    break;
                    
                case 'get_rate':
                    if (data.from && data.to) {
                        // Handle rate request
                        ws.send(JSON.stringify({
                            type: 'rate',
                            from: data.from,
                            to: data.to,
                            rate: 1.0,
                            timestamp: Date.now()
                        }));
                    }
                    break;
                    
                default:
                    logger.debug('Unknown WebSocket message type:', data.type);
            }
        } catch (error) {
            logger.error('WebSocket message error:', error);
        }
    });
    
    ws.on('close', () => {
        wsClients.delete(clientId);
        logger.info(`WebSocket client disconnected: ${clientId}`);
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({ 
        type: 'connected', 
        clientId,
        timestamp: Date.now() 
    }));
});

// Broadcast to subscribed clients
function broadcast(channel, data) {
    const message = JSON.stringify({ type: 'broadcast', channel, data, timestamp: Date.now() });
    
    for (const [clientId, client] of wsClients) {
        if (client.subscriptions.has(channel) || client.subscriptions.has('*')) {
            try {
                client.ws.send(message);
            } catch (error) {
                logger.error(`Failed to send to client ${clientId}:`, error);
            }
        }
    }
}

// ==================== API Routes ====================

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Satoshi API',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.environment,
        features: {
            satoshisPerAbr: SATOSHI_PER_ABR,
            currencies: Object.keys(AFRICAN_CURRENCIES).length,
            feeTypes: Object.keys(FEE_STRUCTURE).length,
            redis: !!redis,
            websocket: wss.clients.size,
            users: users.size,
            transactions: transactions.size
        }
    });
});

/**
 * Get supported currencies
 */
app.get('/api/v1/currencies', (req, res) => {
    const currencies = Object.entries(AFRICAN_CURRENCIES).map(([code, data]) => ({
        code,
        name: data.name,
        symbol: data.symbol,
        decimals: data.decimals,
        satsPerUnit: data.satsPerUnit,
        abrPerUnit: data.satsPerUnit / SATOSHI_PER_ABR
    }));
    
    // Group by region
    const byRegion = {
        major: currencies.filter(c => ['USD', 'EUR', 'GBP'].includes(c.code)),
        westAfrica: currencies.filter(c => ['NGN', 'GHS', 'XOF', 'GMD', 'GNF', 'SLE', 'LRD'].includes(c.code)),
        eastAfrica: currencies.filter(c => ['KES', 'UGX', 'TZS', 'RWF', 'ETB', 'SOS', 'DJF', 'ERN', 'BIF', 'KMF'].includes(c.code)),
        southernAfrica: currencies.filter(c => ['ZAR', 'ZMW', 'BWP', 'MZN', 'AOA', 'NAD', 'SZL', 'LSL', 'MWK', 'ZWL'].includes(c.code)),
        northAfrica: currencies.filter(c => ['EGP', 'MAD', 'DZD', 'TND', 'LYD', 'MRU', 'SDG', 'SSP'].includes(c.code)),
        centralAfrica: currencies.filter(c => ['XAF', 'CDF', 'STD'].includes(c.code)),
        islands: currencies.filter(c => ['MUR', 'SCR', 'CVE', 'MGA'].includes(c.code))
    };
    
    res.json({
        success: true,
        currencies,
        byRegion,
        satoshisPerAbr: SATOSHI_PER_ABR,
        timestamp: Date.now()
    });
});

/**
 * Convert between units
 */
app.get('/api/v1/convert', [
    query('amount').isFloat({ min: 0 }),
    query('from').isString().notEmpty(),
    query('to').isString().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { amount, from, to } = req.query;
        const numAmount = parseFloat(amount);
        
        let result;
        let satoshis;
        
        // Convert to satoshis first
        if (from.toUpperCase() === 'ABR') {
            satoshis = toSatoshi(numAmount);
        } else if (from.toUpperCase() === 'SAT' || from.toUpperCase() === 'SATS') {
            satoshis = numAmount;
        } else {
            // From local currency
            satoshis = localToSatoshis(numAmount, from.toUpperCase());
        }
        
        // Convert to target unit
        if (to.toUpperCase() === 'ABR') {
            result = toAbr(satoshis);
        } else if (to.toUpperCase() === 'SAT' || to.toUpperCase() === 'SATS') {
            result = satoshis;
        } else {
            // To local currency
            result = satoshisToLocal(satoshis, to.toUpperCase());
        }
        
        // Get cache key for rate
        const rateKey = `rate:${from}:${to}`;
        let rate = await cache.get(rateKey);
        
        if (!rate) {
            // Calculate rate
            if (from.toUpperCase() === 'ABR' && to.toUpperCase() !== 'SAT') {
                rate = result / numAmount;
            } else if (to.toUpperCase() === 'ABR' && from.toUpperCase() !== 'SAT') {
                rate = numAmount / result;
            } else {
                rate = 1;
            }
            await cache.set(rateKey, rate, 300); // Cache for 5 minutes
        }
        
        res.json({
            success: true,
            from: from.toUpperCase(),
            to: to.toUpperCase(),
            amount: numAmount,
            result,
            satoshis,
            rate,
            formatted: {
                satoshis: formatSatoshis(satoshis),
                abr: toAbr(satoshis).toFixed(8) + ' ABR',
                local: satoshisToLocal(satoshis, to.toUpperCase()).toFixed(2) + ' ' + to.toUpperCase()
            },
            timestamp: Date.now()
        });
        
    } catch (error) {
        logger.error('Conversion error:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * Get all rates
 */
app.get('/api/v1/rates', async (req, res) => {
    try {
        const rates = {};
        
        for (const [currency, info] of Object.entries(AFRICAN_CURRENCIES)) {
            rates[currency] = {
                perAbr: toAbr(info.satsPerUnit),
                perSatoshi: toAbr(info.satsPerUnit) / SATOSHI_PER_ABR,
                satoshisPerUnit: info.satsPerUnit,
                abrPerUnit: info.satsPerUnit / SATOSHI_PER_ABR
            };
        }
        
        res.json({
            success: true,
            rates,
            satoshisPerAbr: SATOSHI_PER_ABR,
            timestamp: Date.now()
        });
        
    } catch (error) {
        logger.error('Rates error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get fee estimates
 */
app.get('/api/v1/fees', (req, res) => {
    const { amountSatoshis, txSize, priority, african } = req.query;
    
    const fees = {};
    
    for (const [type, config] of Object.entries(FEE_STRUCTURE)) {
        let feeSatoshis = config.base;
        
        if (amountSatoshis && config.percentage) {
            const parsedAmount = parseInt(amountSatoshis);
            if (!isNaN(parsedAmount)) {
                const percentageFee = Math.round(parsedAmount * config.percentage / 10000);
                feeSatoshis += percentageFee;
            }
        }
        
        if (txSize && config.perByte) {
            feeSatoshis += parseInt(txSize) * config.perByte;
        }
        
        if (priority === 'true' && config.priority) {
            feeSatoshis = config.priority;
        }
        
        if (african === 'true') {
            feeSatoshis = Math.round(feeSatoshis * 0.95); // 5% discount
        }
        
        // Apply bounds
        if (config.min) feeSatoshis = Math.max(feeSatoshis, config.min);
        if (config.max) feeSatoshis = Math.min(feeSatoshis, config.max);
        
        fees[type] = {
            satoshis: feeSatoshis,
            abr: toAbr(feeSatoshis),
            usd: satoshisToLocal(feeSatoshis, 'USD'),
            description: config.description,
            ...(config.percentage && { percentageBps: config.percentage }),
            ...(config.min && { minSatoshis: config.min }),
            ...(config.max && { maxSatoshis: config.max })
        };
    }
    
    res.json({
        success: true,
        fees,
        satoshisPerAbr: SATOSHI_PER_ABR,
        timestamp: Date.now()
    });
});

/**
 * Create transaction
 */
app.post('/api/v1/transactions', [
    authenticate,
    body('to').isString().isLength({ min: 26, max: 35 }),
    body('amountSatoshis').isInt({ min: MIN_SATOSHI }),
    body('feeSatoshis').optional().isInt({ min: MIN_SATOSHI }),
    body('priority').optional().isIn(['normal', 'priority']),
    body('memo').optional().isString().isLength({ max: 500 }),
    body('metadata').optional().isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { to, amountSatoshis, feeSatoshis, priority = 'normal', memo, metadata = {} } = req.body;
        const userId = req.user.userId;
        
        // Check if user has wallet
        const userWallet = wallets.get(userId);
        if (!userWallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        
        // Calculate fee if not provided
        let finalFee = feeSatoshis;
        if (!finalFee) {
            const isAfrican = isAfricanIP(req.ip);
            finalFee = calculateFee(amountSatoshis, 'transaction', {
                priority: priority === 'priority',
                africanUser: isAfrican,
                txSize: 250 // Average tx size
            });
        }
        
        const totalSatoshis = amountSatoshis + finalFee;
        
        // Check balance
        if (userWallet.balance < totalSatoshis) {
            return res.status(400).json({ 
                error: 'Insufficient balance',
                balance: userWallet.balance,
                needed: totalSatoshis
            });
        }
        
        // Create transaction
        const txid = generateTxid();
        const transaction = {
            txid,
            userId,
            from: userWallet.addresses[0],
            to,
            amountSatoshis,
            feeSatoshis: finalFee,
            totalSatoshis,
            status: 'pending',
            type: 'send',
            priority,
            memo,
            metadata,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            confirmations: 0
        };
        
        transactions.set(txid, transaction);
        
        // Update wallet balance
        userWallet.balance -= totalSatoshis;
        userWallet.transactions.push(txid);
        userWallet.updatedAt = Date.now();
        
        // Update user total sent
        const user = users.get(userId);
        if (user) {
            user.totalSent += amountSatoshis;
            user.transactionCount++;
        }
        
        // Cache transaction
        await cache.set(`tx:${txid}`, transaction, 3600);
        
        // Broadcast via WebSocket
        broadcast('transactions', {
            type: 'new',
            txid,
            userId,
            amountSatoshis,
            status: 'pending'
        });
        
        logger.info(`Transaction created: ${txid} for user ${userId}`);
        
        res.json({
            success: true,
            transaction: {
                txid,
                from: userWallet.addresses[0],
                to,
                amountSatoshis,
                feeSatoshis: finalFee,
                totalSatoshis,
                amountAbr: toAbr(amountSatoshis),
                feeAbr: toAbr(finalFee),
                totalAbr: toAbr(totalSatoshis),
                status: 'pending',
                memo,
                createdAt: transaction.createdAt
            }
        });
        
        // Simulate transaction processing
        setTimeout(() => {
            transaction.status = 'confirmed';
            transaction.confirmations = 6;
            transaction.updatedAt = Date.now();
            transactions.set(txid, transaction);
            broadcast('transactions', { type: 'confirmed', txid });
            logger.info(`Transaction confirmed: ${txid}`);
        }, 30000);
        
    } catch (error) {
        logger.error('Transaction creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get transaction by ID
 */
app.get('/api/v1/transactions/:txid', [
    authenticate,
    param('txid').isString().notEmpty()
], async (req, res) => {
    try {
        const { txid } = req.params;
        
        // Check cache first
        let transaction = await cache.get(`tx:${txid}`);
        
        if (!transaction) {
            transaction = transactions.get(txid);
        }
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        // Check authorization
        if (transaction.userId !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        res.json({
            success: true,
            transaction: {
                ...transaction,
                amountAbr: toAbr(transaction.amountSatoshis),
                feeAbr: toAbr(transaction.feeSatoshis),
                totalAbr: toAbr(transaction.totalSatoshis)
            }
        });
        
    } catch (error) {
        logger.error('Transaction fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get user transactions
 */
app.get('/api/v1/users/:userId/transactions', [
    authenticate,
    param('userId').isString().notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('status').optional().isIn(['pending', 'confirmed', 'failed'])
], async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0, status } = req.query;
        
        // Check authorization
        if (userId !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const userWallet = wallets.get(userId);
        if (!userWallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        
        let userTransactions = [];
        for (const txid of userWallet.transactions) {
            const tx = transactions.get(txid);
            if (tx) {
                if (!status || tx.status === status) {
                    userTransactions.push({
                        ...tx,
                        amountAbr: toAbr(tx.amountSatoshis),
                        feeAbr: toAbr(tx.feeSatoshis)
                    });
                }
            }
        }
        
        // Sort by date (newest first)
        userTransactions.sort((a, b) => b.createdAt - a.createdAt);
        
        // Paginate
        const paginated = userTransactions.slice(offset, offset + limit);
        
        res.json({
            success: true,
            transactions: paginated,
            total: userTransactions.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: offset + limit < userTransactions.length
        });
        
    } catch (error) {
        logger.error('User transactions fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create batch transaction
 */
app.post('/api/v1/batch/transactions', [
    authenticate,
    body('payments').isArray().isLength({ min: 1, max: 1000 }),
    body('payments.*.to').isString().isLength({ min: 26, max: 35 }),
    body('payments.*.amountSatoshis').isInt({ min: MIN_SATOSHI }),
    body('payments.*.memo').optional().isString(),
    body('priority').optional().isIn(['normal', 'priority']),
    body('metadata').optional().isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { payments, priority = 'normal', metadata = {} } = req.body;
        const userId = req.user.userId;
        
        // Check wallet
        const userWallet = wallets.get(userId);
        if (!userWallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        
        // Calculate totals
        let totalSatoshis = 0;
        const results = [];
        
        for (const payment of payments) {
            totalSatoshis += payment.amountSatoshis;
            results.push({
                to: payment.to,
                amountSatoshis: payment.amountSatoshis,
                amountAbr: toAbr(payment.amountSatoshis)
            });
        }
        
        // Calculate fee (discounted for batch)
        const isAfrican = isAfricanIP(req.ip);
        const baseFee = calculateFee(totalSatoshis, 'transaction', {
            priority: priority === 'priority',
            africanUser: isAfrican
        });
        
        // Bulk discount: 50% off for batches
        const feeSatoshis = Math.max(Math.round(baseFee * 0.5), MIN_SATOSHI);
        const totalWithFee = totalSatoshis + feeSatoshis;
        
        // Check balance
        if (userWallet.balance < totalWithFee) {
            return res.status(400).json({ 
                error: 'Insufficient balance',
                balance: userWallet.balance,
                needed: totalWithFee
            });
        }
        
        const batchId = generateBatchId();
        const transactionIds = [];
        
        // Create individual transactions
        for (const payment of payments) {
            const txid = generateTxid();
            const transaction = {
                txid,
                userId,
                from: userWallet.addresses[0],
                to: payment.to,
                amountSatoshis: payment.amountSatoshis,
                feeSatoshis: Math.round(feeSatoshis / payments.length),
                totalSatoshis: payment.amountSatoshis + Math.round(feeSatoshis / payments.length),
                status: 'pending',
                type: 'send',
                batchId,
                priority,
                memo: payment.memo || metadata.batchMemo,
                metadata,
                createdAt: Date.now(),
                confirmations: 0
            };
            
            transactions.set(txid, transaction);
            transactionIds.push(txid);
            userWallet.transactions.push(txid);
        }
        
        // Update wallet balance
        userWallet.balance -= totalWithFee;
        userWallet.updatedAt = Date.now();
        
        // Update user stats
        const user = users.get(userId);
        if (user) {
            user.totalSent += totalSatoshis;
            user.transactionCount += payments.length;
        }
        
        // Store batch info
        const batchInfo = {
            batchId,
            userId,
            transactionIds,
            totalSatoshis,
            feeSatoshis,
            totalWithFee,
            paymentCount: payments.length,
            status: 'pending',
            createdAt: Date.now()
        };
        
        await cache.set(`batch:${batchId}`, batchInfo, 86400); // 24 hours
        
        logger.info(`Batch created: ${batchId} with ${payments.length} payments for user ${userId}`);
        
        res.json({
            success: true,
            batchId,
            totalSatoshis,
            feeSatoshis,
            totalWithFee,
            totalAbr: toAbr(totalSatoshis),
            feeAbr: toAbr(feeSatoshis),
            paymentCount: payments.length,
            transactions: results,
            transactionIds,
            createdAt: batchInfo.createdAt
        });
        
        // Simulate batch processing
        setTimeout(() => {
            for (const txid of transactionIds) {
                const tx = transactions.get(txid);
                if (tx) {
                    tx.status = 'confirmed';
                    tx.confirmations = 6;
                    transactions.set(txid, tx);
                }
            }
            broadcast('transactions', { type: 'batch_confirmed', batchId, transactionIds });
            logger.info(`Batch confirmed: ${batchId}`);
        }, 60000);
        
    } catch (error) {
        logger.error('Batch creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get batch status
 */
app.get('/api/v1/batch/:batchId', [
    authenticate,
    param('batchId').isString().notEmpty()
], async (req, res) => {
    try {
        const { batchId } = req.params;
        
        const batchInfo = await cache.get(`batch:${batchId}`);
        if (!batchInfo) {
            return res.status(404).json({ error: 'Batch not found' });
        }
        
        // Check authorization
        if (batchInfo.userId !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Get transaction statuses
        const transactions_status = [];
        for (const txid of batchInfo.transactionIds) {
            const tx = transactions.get(txid);
            if (tx) {
                transactions_status.push({
                    txid,
                    status: tx.status,
                    confirmations: tx.confirmations
                });
            }
        }
        
        // Check if all confirmed
        const allConfirmed = transactions_status.every(t => t.status === 'confirmed');
        const somePending = transactions_status.some(t => t.status === 'pending');
        
        let batchStatus = 'pending';
        if (allConfirmed) batchStatus = 'confirmed';
        else if (!somePending) batchStatus = 'partial';
        
        res.json({
            success: true,
            batchId,
            status: batchStatus,
            totalSatoshis: batchInfo.totalSatoshis,
            feeSatoshis: batchInfo.feeSatoshis,
            paymentCount: batchInfo.paymentCount,
            createdAt: batchInfo.createdAt,
            transactions: transactions_status,
            summary: {
                total: transactions_status.length,
                confirmed: transactions_status.filter(t => t.status === 'confirmed').length,
                pending: transactions_status.filter(t => t.status === 'pending').length,
                failed: transactions_status.filter(t => t.status === 'failed').length
            }
        });
        
    } catch (error) {
        logger.error('Batch fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Estimate transaction
 */
app.post('/api/v1/estimate', [
    body('amountSatoshis').isInt({ min: MIN_SATOSHI }),
    body('type').isIn(['transaction', 'swap', 'bridge', 'airdrop', 'deployment']),
    body('priority').optional().isIn(['normal', 'priority']),
    body('africanUser').optional().isBoolean(),
    body('txSize').optional().isInt({ min: 100, max: 100000 })
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { amountSatoshis, type, priority = 'normal', africanUser = false, txSize } = req.body;
        
        const feeSatoshis = calculateFee(amountSatoshis, type, { 
            priority: priority === 'priority', 
            africanUser,
            txSize 
        });
        
        // Get detailed breakdown
        const baseFee = FEE_STRUCTURE[type].base || 0;
        const percentageFee = FEE_STRUCTURE[type].percentage 
            ? Math.round(amountSatoshis * FEE_STRUCTURE[type].percentage / 10000) 
            : 0;
        const perByteFee = (txSize && FEE_STRUCTURE[type].perByte) 
            ? txSize * FEE_STRUCTURE[type].perByte 
            : 0;
        
        const volumeDiscount = amountSatoshis > 1_000_000_000 ? Math.round(feeSatoshis * 0.1) : 0;
        const africanDiscount = africanUser ? Math.round(feeSatoshis * 0.05) : 0;
        
        res.json({
            success: true,
            type,
            amountSatoshis,
            amountAbr: toAbr(amountSatoshis),
            feeBreakdown: {
                base: baseFee,
                percentage: percentageFee,
                perByte: perByteFee,
                volumeDiscount,
                africanDiscount,
                total: feeSatoshis
            },
            feeSatoshis,
            feeAbr: toAbr(feeSatoshis),
            feeUsd: satoshisToLocal(feeSatoshis, 'USD'),
            totalSatoshis: amountSatoshis + feeSatoshis,
            totalAbr: toAbr(amountSatoshis + feeSatoshis),
            priority,
            africanUser,
            rates: {
                usd: satoshisToLocal(amountSatoshis, 'USD'),
                ngn: satoshisToLocal(amountSatoshis, 'NGN'),
                kes: satoshisToLocal(amountSatoshis, 'KES'),
                zar: satoshisToLocal(amountSatoshis, 'ZAR')
            },
            timestamp: Date.now()
        });
        
    } catch (error) {
        logger.error('Estimate error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create user wallet
 */
app.post('/api/v1/wallets', [
    authenticate,
    body('currency').optional().isString().isLength({ min: 3, max: 3 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const userId = req.user.userId;
        const { currency = 'USD' } = req.body;
        
        // Check if wallet already exists
        if (wallets.has(userId)) {
            return res.status(400).json({ error: 'Wallet already exists' });
        }
        
        // Generate wallet addresses
        const addresses = [];
        for (let i = 0; i < 5; i++) {
            addresses.push(generateBitcoinAddress());
        }
        
        const wallet = {
            userId,
            addresses,
            balance: 1_000_000_000, // Initial balance for demo: 10 ABR
            lockedBalance: 0,
            unconfirmedBalance: 0,
            transactions: [],
            utxos: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            settings: {
                defaultFee: 1000,
                priority: 'normal',
                currency
            }
        };
        
        wallets.set(userId, wallet);
        
        logger.info(`Wallet created for user ${userId}`);
        
        res.json({
            success: true,
            wallet: {
                userId,
                addresses,
                balanceSatoshis: wallet.balance,
                balanceAbr: toAbr(wallet.balance),
                balanceLocal: satoshisToLocal(wallet.balance, currency),
                currency,
                createdAt: wallet.createdAt
            }
        });
        
    } catch (error) {
        logger.error('Wallet creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get wallet info
 */
app.get('/api/v1/wallets/:userId', [
    authenticate,
    param('userId').isString().notEmpty()
], async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check authorization
        if (userId !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const wallet = wallets.get(userId);
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        
        const currency = wallet.settings?.currency || 'USD';
        
        res.json({
            success: true,
            wallet: {
                userId: wallet.userId,
                addresses: wallet.addresses,
                balanceSatoshis: wallet.balance,
                balanceAbr: toAbr(wallet.balance),
                balanceLocal: satoshisToLocal(wallet.balance, currency),
                lockedBalance: wallet.lockedBalance,
                unconfirmedBalance: wallet.unconfirmedBalance,
                transactionCount: wallet.transactions.length,
                currency,
                createdAt: wallet.createdAt,
                updatedAt: wallet.updatedAt
            }
        });
        
    } catch (error) {
        logger.error('Wallet fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get wallet balance
 */
app.get('/api/v1/wallets/:userId/balance', [
    authenticate,
    param('userId').isString().notEmpty(),
    query('currency').optional().isString().isLength({ min: 3, max: 3 })
], async (req, res) => {
    try {
        const { userId } = req.params;
        const { currency = 'USD' } = req.query;
        
        // Check authorization
        if (userId !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const wallet = wallets.get(userId);
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        
        // Calculate spendable balance (confirmed - locked)
        const spendable = wallet.balance - wallet.lockedBalance;
        
        res.json({
            success: true,
            userId,
            balances: {
                satoshis: {
                    total: wallet.balance,
                    spendable,
                    locked: wallet.lockedBalance,
                    unconfirmed: wallet.unconfirmedBalance
                },
                abr: {
                    total: toAbr(wallet.balance),
                    spendable: toAbr(spendable),
                    locked: toAbr(wallet.lockedBalance),
                    unconfirmed: toAbr(wallet.unconfirmedBalance)
                },
                local: {
                    total: satoshisToLocal(wallet.balance, currency),
                    spendable: satoshisToLocal(spendable, currency),
                    locked: satoshisToLocal(wallet.lockedBalance, currency),
                    unconfirmed: satoshisToLocal(wallet.unconfirmedBalance, currency),
                    currency
                }
            },
            timestamp: Date.now()
        });
        
    } catch (error) {
        logger.error('Balance fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Generate new address
 */
app.post('/api/v1/wallets/:userId/addresses', [
    authenticate,
    param('userId').isString().notEmpty(),
    body('label').optional().isString().isLength({ max: 50 })
], async (req, res) => {
    try {
        const { userId } = req.params;
        const { label = '' } = req.body;
        
        // Check authorization
        if (userId !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const wallet = wallets.get(userId);
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        
        const newAddress = generateBitcoinAddress();
        wallet.addresses.push(newAddress);
        wallet.updatedAt = Date.now();
        
        res.json({
            success: true,
            address: newAddress,
            label,
            index: wallet.addresses.length - 1
        });
        
    } catch (error) {
        logger.error('Address generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create API key
 */
app.post('/api/v1/apikeys', [
    authenticate,
    body('name').isString().notEmpty(),
    body('expiresIn').optional().isInt({ min: 3600, max: 31536000 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const userId = req.user.userId;
        const { name, expiresIn = 31536000 } = req.body; // Default 1 year
        
        const apiKey = generateApiKey();
        const secret = generateWebhookSecret();
        
        const keyData = {
            key: apiKey,
            secret,
            userId,
            name,
            createdAt: Date.now(),
            expiresAt: Date.now() + (expiresIn * 1000),
            lastUsed: null,
            permissions: ['read', 'write']
        };
        
        apiKeys.set(apiKey, keyData);
        
        logger.info(`API key created for user ${userId}: ${name}`);
        
        res.json({
            success: true,
            apiKey,
            secret,
            name,
            expiresAt: keyData.expiresAt,
            createdAt: keyData.createdAt
        });
        
    } catch (error) {
        logger.error('API key creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Register webhook
 */
app.post('/api/v1/webhooks', [
    authenticate,
    body('url').isURL(),
    body('events').isArray(),
    body('events.*').isIn(['transaction.created', 'transaction.confirmed', 'transaction.failed', 'wallet.update'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const userId = req.user.userId;
        const { url, events } = req.body;
        
        const webhookId = generateBatchId();
        const secret = generateWebhookSecret();
        
        const webhook = {
            id: webhookId,
            userId,
            url,
            events,
            secret,
            active: true,
            createdAt: Date.now(),
            lastTriggered: null,
            failureCount: 0
        };
        
        webhooks.set(webhookId, webhook);
        
        logger.info(`Webhook registered for user ${userId}: ${url}`);
        
        res.json({
            success: true,
            webhookId,
            url,
            events,
            secret,
            createdAt: webhook.createdAt
        });
        
    } catch (error) {
        logger.error('Webhook registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get stats
 */
app.get('/api/v1/stats', [
    authenticate
], async (req, res) => {
    try {
        const now = Date.now();
        const dayAgo = now - 86400000;
        const weekAgo = now - 604800000;
        
        // Calculate stats
        const totalUsers = users.size;
        const totalWallets = wallets.size;
        const totalTransactions_ = transactions.size;
        
        const recentTransactions = Array.from(transactions.values())
            .filter(tx => tx.createdAt > dayAgo).length;
        
        const totalVolume = Array.from(transactions.values())
            .filter(tx => tx.status === 'confirmed')
            .reduce((sum, tx) => sum + tx.amountSatoshis, 0);
        
        const recentVolume = Array.from(transactions.values())
            .filter(tx => tx.status === 'confirmed' && tx.createdAt > dayAgo)
            .reduce((sum, tx) => sum + tx.amountSatoshis, 0);
        
        const weeklyVolume = Array.from(transactions.values())
            .filter(tx => tx.status === 'confirmed' && tx.createdAt > weekAgo)
            .reduce((sum, tx) => sum + tx.amountSatoshis, 0);
        
        const totalFees = Array.from(transactions.values())
            .filter(tx => tx.status === 'confirmed')
            .reduce((sum, tx) => sum + (tx.feeSatoshis || 0), 0);
        
        const africanUsers = Array.from(users.values())
            .filter(u => u.country && isAfricanCountry(u.country)).length;
        
        res.json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    african: africanUsers,
                    active: recentTransactions > 0 ? 100 : 0 // Simplified
                },
                transactions: {
                    total: totalTransactions_,
                    recent: recentTransactions,
                    confirmed: Array.from(transactions.values()).filter(tx => tx.status === 'confirmed').length,
                    pending: Array.from(transactions.values()).filter(tx => tx.status === 'pending').length
                },
                volume: {
                    total: totalVolume,
                    totalAbr: toAbr(totalVolume),
                    today: recentVolume,
                    todayAbr: toAbr(recentVolume),
                    week: weeklyVolume,
                    weekAbr: toAbr(weeklyVolume),
                    average: totalTransactions_ > 0 ? totalVolume / totalTransactions_ : 0
                },
                fees: {
                    total: totalFees,
                    totalAbr: toAbr(totalFees),
                    average: totalTransactions_ > 0 ? totalFees / totalTransactions_ : 0
                },
                system: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    websocketConnections: wss.clients.size,
                    cacheHits: 0, // Would track actual hits
                    cacheMisses: 0
                },
                timestamp: now
            }
        });
        
    } catch (error) {
        logger.error('Stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to check if country is African
function isAfricanCountry(countryCode) {
    const africanCountries = [
        'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD',
        'KM', 'CG', 'CD', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA',
        'GM', 'GH', 'GN', 'GW', 'CI', 'KE', 'LS', 'LR', 'LY', 'MG',
        'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW',
        'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG',
        'TN', 'UG', 'ZM', 'ZW'
    ];
    return africanCountries.includes(countryCode);
}

// Helper function to generate Bitcoin address
function generateBitcoinAddress() {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let address = '1';
    for (let i = 0; i < 33; i++) {
        address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
}

// Helper function to format satoshis
function formatSatoshis(sats) {
    return sats.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' sats';
}

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: config.environment === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// ==================== Start Server ====================

server.listen(config.port, () => {
    console.log('\n' + '='.repeat(70));
    console.log('💰 SATOSHI API v2.0.0');
    console.log('='.repeat(70));
    console.log(`✅ Server running on port ${config.port}`);
    console.log(`📊 WebSocket: ws://localhost:${config.port}`);
    console.log(`📊 1 ABR = ${SATOSHI_PER_ABR.toLocaleString()} satoshis`);
    console.log(`🌍 Supported currencies: ${Object.keys(AFRICAN_CURRENCIES).length}`);
    console.log(`💸 Fee types: ${Object.keys(FEE_STRUCTURE).length}`);
    console.log(`💾 Cache: ${redis ? 'Redis' : 'Memory'}`);
    console.log(`🌐 Environment: ${config.environment}`);
    console.log('='.repeat(70) + '\n');
    
    logger.info(`Satoshi API started on port ${config.port}`);
    
    // Create demo user for testing
    const demoUserId = 'demo-user-123';
    if (!users.has(demoUserId)) {
        users.set(demoUserId, {
            userId: demoUserId,
            username: 'demo',
            email: 'demo@example.com',
            role: 'user',
            country: 'NG',
            createdAt: Date.now(),
            totalSent: 0,
            transactionCount: 0
        });
        
        // Create demo wallet
        const demoWallet = {
            userId: demoUserId,
            addresses: [generateBitcoinAddress()],
            balance: 10_000_000_000, // 100 ABR for demo
            lockedBalance: 0,
            unconfirmedBalance: 0,
            transactions: [],
            utxos: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            settings: {
                defaultFee: 1000,
                priority: 'normal',
                currency: 'USD'
            }
        };
        wallets.set(demoUserId, demoWallet);
        
        logger.info('Demo user created');
    }
});

// ==================== Graceful Shutdown ====================

process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down...');
    
    // Close WebSocket server
    wss.close(() => {
        logger.info('WebSocket server closed');
    });
    
    // Close Redis connection
    if (redis) {
        await redis.quit();
    }
    
    // Close HTTP server
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', error);
});

module.exports = { app, server, wss, cache };
