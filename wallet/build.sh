#!/bin/bash
# ~/abr-project/wallet/build.sh

set -e  # Exit on error

echo "========================================="
echo "🔧 ABR Wallet System Build Script v1.0"
echo "========================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[BUILD]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed. Aborting." >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { print_warning "PostgreSQL client not found. Database setup will be skipped."; }
command -v docker >/dev/null 2>&1 || { print_warning "Docker not found. Container deployment will be skipped."; }
command -v docker-compose >/dev/null 2>&1 || { print_warning "Docker Compose not found. Container deployment will be skipped."; }

print_success "Prerequisites checked"

# Build ABR Core with wallet support
print_status "Building ABR Core with wallet support..."

cd ~/abr-project/src/abr-core

# Check if card directory exists, create if not
if [ ! -d "src/card" ]; then
    print_status "Creating card service directory structure..."
    mkdir -p src/card/{bin,crypto,rpc,models,database}
fi

# Create build directory
mkdir -p build
cd build

print_status "Running CMake..."
cmake .. -DBUILD_WALLET=ON -DBUILD_CARD_SERVICE=ON

print_status "Building with make..."
make -j4

if [ $? -eq 0 ]; then
    print_success "ABR Core built successfully"
else
    print_error "ABR Core build failed"
    exit 1
fi

# Setup wallet database
print_status "Setting up wallet database..."

cd ~/abr-project/wallet

# Create database if it doesn't exist
if command -v psql >/dev/null 2>&1; then
    print_status "Creating database..."
    psql -U postgres -c "CREATE DATABASE IF NOT EXISTS abr_wallet_dev;" 2>/dev/null || print_warning "Database may already exist"
    
    print_status "Running migrations..."
    for migration in database/migrations/*.sql; do
        if [ -f "$migration" ]; then
            print_status "Applying migration: $(basename $migration)"
            psql -U postgres -d abr_wallet_dev -f "$migration" || print_error "Migration failed: $(basename $migration)"
        fi
    done
    
    print_success "Database setup complete"
else
    print_warning "Skipping database setup (PostgreSQL client not available)"
fi

# Install backend dependencies
print_status "Installing backend dependencies..."

cd ~/abr-project/wallet/backend

if [ -f "package.json" ]; then
    print_status "Running npm install..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "Backend dependencies installed"
    else
        print_error "Backend dependency installation failed"
        exit 1
    fi
else
    print_warning "backend/package.json not found, skipping..."
fi

# Install frontend dependencies
print_status "Installing frontend dependencies..."

cd ~/abr-project/wallet/frontend

if [ -f "package.json" ]; then
    print_status "Running npm install..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "Frontend dependencies installed"
        
        # Build frontend
        print_status "Building frontend..."
        npm run build
        
        if [ $? -eq 0 ]; then
            print_success "Frontend built successfully"
        else
            print_error "Frontend build failed"
            exit 1
        fi
    else
        print_error "Frontend dependency installation failed"
        exit 1
    fi
else
    print_warning "frontend/package.json not found, skipping..."
fi

# Setup configuration
print_status "Setting up configuration..."

cd ~/abr-project/wallet/config

# Generate JWT secret if not exists
if [ ! -f ".env" ]; then
    print_status "Creating .env file..."
    JWT_SECRET=$(openssl rand -hex 32)
    DB_PASSWORD=$(openssl rand -hex 16)
    CARD_API_KEY=$(openssl rand -hex 24)
    
    cat > .env << EOF
# Wallet Service Environment Variables
NODE_ENV=development
PORT=3009
WS_PORT=8080

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=abr_wallet_dev
DB_USER=wallet_user
DB_PASSWORD=${DB_PASSWORD}

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# Card Service
CARD_SERVICE_URL=http://localhost:3008
CARD_SERVICE_API_KEY=${CARD_API_KEY}

# Exchange Rate API
EXCHANGE_API_URL=https://api.exchangerate.host
EXCHANGE_API_KEY=

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
EOF
    
    print_success ".env file created"
else
    print_warning ".env file already exists, skipping..."
fi

# Start services with docker-compose
if command -v docker-compose >/dev/null 2>&1; then
    print_status "Starting services with Docker Compose..."
    
    if [ -f "docker-compose.yml" ]; then
        docker-compose up -d
        
        if [ $? -eq 0 ]; then
            print_success "Docker services started"
        else
            print_error "Failed to start Docker services"
            exit 1
        fi
    else
        print_warning "docker-compose.yml not found, skipping..."
    fi
else
    print_warning "Docker Compose not available, skipping container deployment"
fi

# Create service integration
print_status "Setting up service integrations..."

cd ~/abr-project/wallet/services

# Create index file for services
cat > index.js << 'EOF'
// Service exports
const cardIntegration = require('./card/CardIntegration');
const exchangeService = require('./exchange/ExchangeService');
const kycService = require('./kyc/KYCService');
const notificationService = require('./notification/NotificationService');
const transactionService = require('./transaction/TransactionService');

module.exports = {
    cardIntegration,
    exchangeService,
    kycService,
    notificationService,
    transactionService
};
EOF

print_success "Service integrations configured"

# Final status
echo
echo "========================================="
echo -e "${GREEN}✅ ABR Wallet System Build Complete!${NC}"
echo "========================================="
echo
echo -e "${YELLOW}Services:${NC}"
echo "  📱 Frontend:     http://localhost:3000"
echo "  🔌 Backend API:  http://localhost:3009"
echo "  📡 WebSocket:    ws://localhost:8080"
echo "  💳 Card Service: http://localhost:3008"
echo "  🗄️  Database:     postgresql://localhost:5432/abr_wallet_dev"
echo "  ⚡ Redis:        redis://localhost:6379"
echo
echo -e "${YELLOW}To start services manually:${NC}"
echo "  Backend:  cd ~/abr-project/wallet/backend && npm run dev"
echo "  Frontend: cd ~/abr-project/wallet/frontend && npm start"
echo
echo -e "${YELLOW}To stop Docker services:${NC}"
echo "  cd ~/abr-project/wallet/config && docker-compose down"
echo
echo -e "${GREEN}Happy building! 🚀${NC}"
