# 🌍 ABR Protocol v2.0.0

[![GitHub Release](https://img.shields.io/github/v/release/abrchain/abrchain)](https://github.com/abrchain/abrchain/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/abrchain/abrchain/ci.yml)](https://github.com/abrchain/abrchain/actions)
[![License](https://img.shields.io/github/license/abrchain/abrchain)](LICENSE)
[![Discord](https://img.shields.io/discord/1234567890?color=5865F2&label=Discord&logo=discord)](https://discord.gg/abrchain)
[![Twitter Follow](https://img.shields.io/twitter/follow/AbrChain?style=social)](https://twitter.com/AbrChain)

**Africa Bitcoin Reserve (ABR)** - A sovereign digital currency for 1.4 billion Africans. Backed by Bitcoin, governed by Africans, built for the future.

## 📋 Genesis Information
═══════════════════════════════════════════════════════════════════
ABR PROTOCOL - GENESIS BLOCK
═══════════════════════════════════════════════════════════════════

Genesis Hash: 3da515799179d2f8bf0fbb86167bef332ea2bbb972631922b6ca98ce64aff3a7
Genesis TXID: 1780952e177d6b42e92ae4df7be0a60ee3cc33a13f3ef437ddea61b4ab86c7bf
Genesis Address: 1HANfZH6ZF7UfMkJ6F3tgZmyfyptoVGHPQ
Timestamp: 1771545600 (2026-02-19 12:00:00 UTC)
Message: "Africa Bitcoin Reserve - Genesis Block - February 19, 2026 - United Africa"
Total Supply: 1,000,000,000 ABR
Pre-mined: 517,851,000 ABR (51%)
Nation Supply: 146,000,000 ABR
UTXO Count: 155

═══════════════════════════════════════════════════════════════════

text

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- Docker (optional)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/abrchain/abrchain.git
cd abrchain

# Install dependencies
pip install -r requirements.txt
npm install

# Run setup script
./scripts/deploy.sh --setup

# Verify genesis block
python verify_genesis.py
Launch ABR Node
bash
# Launch complete system
./launch-all.sh

# Or launch individual components
python abr_api_server.py           # API Server
python core/blockchain.py           # Blockchain Core
python trading-engine/engine.py     # Trading Engine
🏗️ Project Structure
text
abrchain/
├── core/                    # Core blockchain implementation
│   ├── blockchain.py        # Main blockchain logic
│   ├── consensus.py         # Consensus mechanism
│   ├── genesis.py           # Genesis block handler
│   └── validator.py         # Block validator
├── consensus/               # Consensus algorithms
│   ├── pow.py              # Proof of Work
│   ├── difficulty.py        # Difficulty adjustment
│   └── validation.py        # Block validation
├── trading-engine/          # Trading and settlement
│   ├── engine.py            # Trading engine core
│   ├── orderbook.py         # Order book management
│   ├── settlement.py        # Settlement processing
│   ├── sepa.py              # SEPA integration
│   └── swift.py             # SWIFT integration
├── wallet/                  # Wallet application
│   ├── wallet.py            # Wallet core
│   ├── transaction.py       # Transaction handling
│   ├── address.py           # Address management
│   └── crypto.py            # Cryptographic functions
├── abr-mobile-app/          # Mobile application
├── scripts/                  # Deployment scripts
├── config/                   # Configuration files
├── docker/                   # Docker configurations
├── docs/                     # Documentation
└── test/                     # Test suite
🔧 Configuration
Mainnet Configuration
bash
cp config/mainnet.conf /etc/abr/mainnet.conf
# Edit configuration as needed
./scripts/mainnet.sh start
Testnet Configuration
bash
cp config/testnet.conf /etc/abr/testnet.conf
./scripts/testnet.sh start
📡 API Reference
REST API Endpoints
bash
# Get blockchain info
curl http://localhost:8332/api/v1/info

# Get block by height
curl http://localhost:8332/api/v1/block/1234567

# Get transaction
curl http://localhost:8332/api/v1/tx/3da51579...

# Get address balance
curl http://localhost:8332/api/v1/address/1HANfZH6...
WebSocket API
javascript
const ws = new WebSocket('wss://seed.nairax.ng:8334');

ws.on('open', () => {
    ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'blocks'
    }));
});

ws.on('message', (data) => {
    console.log('New block:', JSON.parse(data));
});
🐳 Docker Deployment
bash
# Build and run with Docker Compose
cd docker/compose
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
🧪 Testing
bash
# Run unit tests
python -m pytest test/unit/

# Run integration tests
python -m pytest test/integration/

# Run end-to-end tests
python test_wallet_transfer.py

# Verify genesis block
python verify_genesis.py
📊 CLI Commands
bash
# ABR CLI Reference
abr-cli getgenesisblock          # Display genesis block info
abr-cli getgenesisaddress        # Show genesis address
abr-cli getnationsupply          # Show nation allocation
abr-cli gettxoutsetinfo          # UTXO database info
abr-cli verifyreserve             # Check reserve ratio
abr-cli getblockchaininfo         # Blockchain status
abr-cli getpeerinfo                # Connected peers
abr-cli addnode seed.nairax.ng add # Add seed node
🌐 Network Information
Seed Nodes
seed.nairax.ng:8333 - Primary seed node (Nigeria)

seed.central.nairax.ng:8333 - Backup seed node

Network Statistics
text
Current Block:      1,234,567
Network Hashrate:   2.45 EH/s
Difficulty:         345.67 T
Active Peers:       1,234
Total Transactions: 5,678,901
🔒 Security
Reporting Vulnerabilities
Please report security vulnerabilities to security@nairax.ng. Do not create public issues.

Responsible Disclosure
We follow responsible disclosure practices. Please give us 90 days to address issues before public disclosure.

🤝 Contributing
We welcome contributions! Please see our Contributing Guidelines.

Development Process
Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit changes (git commit -m 'Add amazing feature')

Push to branch (git push origin feature/amazing-feature)

Open a Pull Request

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
African Central Bank Council (12 nations)

ABR Foundation

NairaX Ecosystem

Open source community

📞 Contact
Website: https://abr.nairax.ng

Email: info@nairax.ng

Twitter: @AbrChain

Discord: ABR Protocol

Telegram: t.me/abrchain

⚡ Quick Links
Whitepaper

API Documentation

Wallet Guide

Mining Guide

Governance

Genesis Hash: 3da515799179d2f8bf0fbb86167bef332ea2bbb972631922b6ca98ce64aff3a7
Launch Date: February 19, 2026
Version: 2.0.0
Status: 🟢 Mainnet Live
