// satoshi-core/api/satoshi-api.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = 3016;
const SATOSHI_PER_ABR = 100_000_000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Satoshi API',
        satoshisPerAbr: SATOSHI_PER_ABR,
        timestamp: Date.now()
    });
});

// Convert endpoint
app.get('/api/v1/convert', (req, res) => {
    const { amount, from, to } = req.query;
    
    if (!amount || !from || !to) {
        return res.status(400).json({ error: 'Missing parameters' });
    }
    
    const numAmount = parseFloat(amount);
    let result;
    
    if (from.toUpperCase() === 'ABR' && to.toUpperCase() === 'SAT') {
        result = numAmount * SATOSHI_PER_ABR;
    } else if (from.toUpperCase() === 'SAT' && to.toUpperCase() === 'ABR') {
        result = numAmount / SATOSHI_PER_ABR;
    } else {
        return res.status(400).json({ error: 'Unsupported conversion' });
    }
    
    res.json({
        success: true,
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        amount: numAmount,
        result,
        satoshisPerAbr: SATOSHI_PER_ABR
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`💰 Satoshi API running on port ${PORT}`);
    console.log(`📊 1 ABR = ${SATOSHI_PER_ABR} satoshis`);
});

module.exports = app;
