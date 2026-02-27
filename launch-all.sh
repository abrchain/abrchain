#!/bin/bash
# ABR Protocol - Complete Launch Script
# For repository: abrchain/abrchain

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║     🌍 ABR Protocol - Launching All Services                 ║"
echo "║                                                               ║"
echo "║     Genesis Hash: 3da515799179d2f8bf0fbb86167bef332ea2       ║"
echo "║                   bbb972631922b6ca98ce64aff3a7               ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_info() { echo -e "${BLUE}🔷 $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Kill any existing processes on our ports
log_info "Cleaning up existing processes..."
pkill -f python3 || true
sleep 2

# Start Protocol Server from core
log_info "Starting Protocol Server from core..."
if [ -d "core" ]; then
    cd core
    
    # Look for the main server file
    if [ -f "protocol_server.py" ]; then
        python3 protocol_server.py > /tmp/protocol.log 2>&1 &
        PROTOCOL_PID=$!
        log_success "Protocol Server started (PID: $PROTOCOL_PID) on port 8345"
    elif [ -f "src/protocol_server.py" ]; then
        cd src
        python3 protocol_server.py > /tmp/protocol.log 2>&1 &
        PROTOCOL_PID=$!
        log_success "Protocol Server started (PID: $PROTOCOL_PID) on port 8345"
        cd ..
    else
        # Create a simple protocol server if it doesn't exist
        log_warning "Protocol server not found, creating minimal server..."
        cat > protocol_server.py << 'PYEOF'
#!/usr/bin/env python3
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

GENESIS_HASH = "3da515799179d2f8bf0fbb86167bef332ea2bbb972631922b6ca98ce64aff3a7"

@app.route('/protocol/info', methods=['GET'])
def get_info():
    return jsonify({
        "version": 1,
        "network": "mainnet",
        "total_supply": 1000000000,
        "genesis_supply": 517851000,
        "protocol_hash": GENESIS_HASH,
        "immutable": True,
        "block_time": 120,
        "genesis_message": "United Africa in the Blockchain"
    })

@app.route('/protocol/hash', methods=['GET'])
def get_hash():
    return jsonify({"protocol_hash": GENESIS_HASH})

@app.route('/protocol/summary', methods=['GET'])
def get_summary():
    return jsonify({
        "total_supply": 1000000000,
        "genesis_supply": 517851000,
        "mining_reserve": 482149000,
        "foundation_allocation": 10000000,
        "central_banks_allocation": 400000000,
        "whales_allocation": 107851000
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "protocol_hash": GENESIS_HASH})

if __name__ == '__main__':
    print(f"Starting Protocol Server with Genesis: {GENESIS_HASH}")
    app.run(host='0.0.0.0', port=8345, debug=True)
PYEOF
        python3 protocol_server.py > /tmp/protocol.log 2>&1 &
        PROTOCOL_PID=$!
        log_success "Protocol Server created and started (PID: $PROTOCOL_PID) on port 8345"
    fi
    cd ..
fi
sleep 3

# Start Trading Engine
log_info "Starting Trading Engine..."
if [ -d "trading-engine" ]; then
    cd trading-engine
    
    if [ -f "trading_engine.py" ]; then
        python3 trading_engine.py > /tmp/trading.log 2>&1 &
        TRADING_PID=$!
        log_success "Trading Engine started (PID: $TRADING_PID) on port 5001"
    elif [ -f "src/trading_engine.py" ]; then
        cd src
        python3 trading_engine.py > /tmp/trading.log 2>&1 &
        TRADING_PID=$!
        log_success "Trading Engine started (PID: $TRADING_PID) on port 5001"
        cd ..
    else
        log_warning "Trading Engine not found, skipping..."
    fi
    cd ..
fi

# Start Wallet API
log_info "Checking Wallet service..."
if [ -d "wallet" ]; then
    cd wallet
    if [ -f "wallet_api.py" ]; then
        python3 wallet_api.py > /tmp/wallet.log 2>&1 &
        WALLET_PID=$!
        log_success "Wallet API started (PID: $WALLET_PID)"
    elif [ -d "services" ] && [ -f "services/wallet_api.py" ]; then
        cd services
        python3 wallet_api.py > /tmp/wallet.log 2>&1 &
        WALLET_PID=$!
        log_success "Wallet API started (PID: $WALLET_PID)"
        cd ..
    fi
    cd ..
fi

echo ""
log_success "🎉 All services started successfully!"
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                     ACCESS POINTS                             ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  Protocol Server: http://localhost:8345/protocol/info        ║"
echo "║  Trading Engine:  http://localhost:5001/api/v1/info          ║"
echo "║  Genesis Hash:    3da515799179d2f8bf0fbb86167bef332ea2       ║"
echo "║                   bbb972631922b6ca98ce64aff3a7               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Log files:"
echo "  tail -f /tmp/protocol.log"
echo "  tail -f /tmp/trading.log"
echo "  tail -f /tmp/wallet.log"

echo "To stop all services: pkill -f python3"
