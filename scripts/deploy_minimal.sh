#!/bin/bash
# Minimal ABR Payment Infrastructure Deployment

echo "🇦🇫 DEPLOYING ABR PAYMENT INFRASTRUCTURE"
echo "========================================"

# Configuration
BASE_DIR="$HOME/abr-project"
PAYMENT_DIR="$BASE_DIR/payment"
LOG_DIR="$BASE_DIR/logs/payment"

# Create directories (using full paths)
echo "📁 Creating directories..."
mkdir -p "$HOME/abr-project/payment/onramp"
mkdir -p "$HOME/abr-project/payment/offramp"
mkdir -p "$HOME/abr-project/payment/card"
mkdir -p "$HOME/abr-project/payment/merchant"
mkdir -p "$HOME/abr-project/payment/gateway/public"
mkdir -p "$HOME/abr-project/payment/scripts"
mkdir -p "$HOME/abr-project/logs/payment"
mkdir -p "$HOME/abr-project/scripts"

echo "✅ Directories created"

# Create On-Ramp Service
echo "📦 Creating On-Ramp service..."
cat > "$HOME/abr-project/payment/onramp/server.js" << 'ONRAMP'
const express = require('express');
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'onramp' });
});

app.post('/api/deposit', (req, res) => {
    res.json({ success: true, message: 'Deposit created', depositId: 'DEP' + Date.now() });
});

app.listen(3006, () => {
    console.log('✅ On-Ramp running on port 3006');
});
ONRAMP

# Create Off-Ramp Service
echo "📦 Creating Off-Ramp service..."
cat > "$HOME/abr-project/payment/offramp/server.js" << 'OFFRAMP'
const express = require('express');
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'offramp' });
});

app.post('/api/withdraw', (req, res) => {
    res.json({ success: true, message: 'Withdrawal created', withdrawalId: 'WDR' + Date.now() });
});

app.listen(3007, () => {
    console.log('✅ Off-Ramp running on port 3007');
});
OFFRAMP

# Create Card Service
echo "📦 Creating Card service..."
cat > "$HOME/abr-project/payment/card/server.js" << 'CARD'
const express = require('express');
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'card' });
});

app.post('/api/cards', (req, res) => {
    const cardNumber = '9' + Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0');
    res.json({
        success: true,
        cardId: Date.now(),
        cardNumber: 'XXXX-XXXX-XXXX-' + cardNumber.slice(-4),
        message: 'Card created successfully'
    });
});

app.listen(3008, () => {
    console.log('✅ Card service running on port 3008');
});
CARD

# Create Merchant Service
echo "📦 Creating Merchant service..."
cat > "$HOME/abr-project/payment/merchant/server.js" << 'MERCHANT'
const express = require('express');
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'merchant' });
});

app.post('/api/merchants/register', (req, res) => {
    res.json({
        success: true,
        merchantId: Date.now(),
        apiKey: 'abr_' + Math.random().toString(36).substring(2)
    });
});

app.listen(3009, () => {
    console.log('✅ Merchant service running on port 3009');
});
MERCHANT

# Create Gateway
echo "🌐 Creating Gateway..."
cat > "$HOME/abr-project/payment/gateway/server.js" << 'GATEWAY'
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'gateway' });
});

app.get('/pay/:id', (req, res) => {
    res.send('<h1>ABR Payment Page</h1><p>Payment ID: ' + req.params.id + '</p>');
});

app.listen(3000, () => {
    console.log('✅ Gateway running on port 3000');
});
GATEWAY

# Create package.json for each service
echo "📦 Creating package.json files..."
for service in onramp offramp card merchant gateway; do
    cat > "$HOME/abr-project/payment/$service/package.json" << EOF
{
  "name": "abr-$service",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2"
  }
}
