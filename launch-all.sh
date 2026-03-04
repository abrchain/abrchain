#!/bin/bash

# ABR Protocol - Complete System Launcher
# Version: 2.0.0
# Genesis Hash: 3da515799179d2f8bf0fbb86167bef332ea2bbb972631922b6ca98ce64aff3a7

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ABR_HOME="${HOME}/.abr"
ABR_CONFIG="${ABR_HOME}/config.toml"
ABR_DATA="${ABR_HOME}/data"
ABR_LOGS="${ABR_HOME}/logs"
GENESIS_HASH="3da515799179d2f8bf0fbb86167bef332ea2bbb972631922b6ca98ce64aff3a7"

# Print banner
print_banner() {
    echo -e "${GREEN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║     █████╗ ██████╗ ██████╗     ██████╗ ███████╗███████╗███████╗  ║
║    ██╔══██╗██╔══██╗██╔══██╗    ██╔══██╗██╔════╝██╔════╝██╔════╝  ║
║    ███████║██████╔╝██████╔╝    ██████╔╝█████╗  █████╗  █████╗    ║
║    ██╔══██║██╔══██╗██╔══██╗    ██╔══██╗██╔══╝  ██╔══╝  ██╔══╝    ║
║    ██║  ██║██████╔╝██║  ██║    ██║  ██║███████╗███████╗███████╗  ║
║    ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝    ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝  ║
║                                                                   ║
║              AFRICA BITCOIN RESERVE - SYSTEM LAUNCHER            ║
║                         v2.0.0 - IMMUTABLE                       ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo -e "${BLUE}Genesis Hash: ${GENESIS_HASH}${NC}"
    echo -e "${BLUE}Launch Date: 2026-03-03${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 3 not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Python $(python3 --version)${NC}"
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        echo -e "${RED}❌ pip3 not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ pip3 found${NC}"
    
    # Check Node.js (optional)
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
    else
        echo -e "${YELLOW}⚠️ Node.js not found (optional for mobile app)${NC}"
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✅ Docker $(docker --version | cut -d ' ' -f3 | sed 's/,//')${NC}"
    else
        echo -e "${YELLOW}⚠️ Docker not found (optional)${NC}"
    fi
}

# Setup directories
setup_directories() {
    echo -e "\n${YELLOW}📁 Setting up directories...${NC}"
    
    mkdir -p "${ABR_HOME}"
    mkdir -p "${ABR_DATA}"
    mkdir -p "${ABR_LOGS}"
    mkdir -p "${ABR_DATA}/blocks"
    mkdir -p "${ABR_DATA}/chainstate"
    mkdir -p "${ABR_DATA}/index"
    
    echo -e "${GREEN}✅ Created directories in ${ABR_HOME}${NC}"
}

# Install dependencies
install_dependencies() {
    echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
    
    pip3 install -r requirements.txt
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Python dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
    
    # Install development dependencies if in dev mode
    if [ "$1" == "--dev" ]; then
        pip3 install -r requirements-dev.txt
        echo -e "${GREEN}✅ Development dependencies installed${NC}"
    fi
}

# Verify genesis block
verify_genesis() {
    echo -e "\n${YELLOW}🔒 Verifying genesis block...${NC}"
    
    python3 verify_genesis.py
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Genesis block verified${NC}"
    else
        echo -e "${RED}❌ Genesis verification failed${NC}"
        exit 1
    fi
}

# Start core blockchain
start_core() {
    echo -e "\n${YELLOW}⛓️  Starting ABR Core blockchain...${NC}"
    
    python3 core/blockchain.py --config "${ABR_CONFIG}" --data-dir "${ABR_DATA}" &
    CORE_PID=$!
    echo $CORE_PID > "${ABR_HOME}/core.pid"
    echo -e "${GREEN}✅ Core started (PID: ${CORE_PID})${NC}"
}

# Start API server
start_api() {
    echo -e "\n${YELLOW}🌐 Starting API server...${NC}"
    
    python3 abr_api_server.py &
    API_PID=$!
    echo $API_PID > "${ABR_HOME}/api.pid"
    echo -e "${GREEN}✅ API server started (PID: ${API_PID}) on port 8332${NC}"
}

# Start trading engine
start_trading() {
    echo -e "\n${YELLOW}📊 Starting Trading Engine...${NC}"
    
    python3 trading-engine/engine.py &
    TRADING_PID=$!
    echo $TRADING_PID > "${ABR_HOME}/trading.pid"
    echo -e "${GREEN}✅ Trading Engine started (PID: ${TRADING_PID})${NC}"
}

# Check status
check_status() {
    echo -e "\n${YELLOW}📊 System Status:${NC}"
    
    if [ -f "${ABR_HOME}/core.pid" ]; then
        CORE_PID=$(cat "${ABR_HOME}/core.pid")
        if kill -0 $CORE_PID 2>/dev/null; then
            echo -e "${GREEN}✅ Core: Running (PID: ${CORE_PID})${NC}"
        else
            echo -e "${RED}❌ Core: Not running${NC}"
        fi
    else
        echo -e "${RED}❌ Core: Not started${NC}"
    fi
    
    if [ -f "${ABR_HOME}/api.pid" ]; then
        API_PID=$(cat "${ABR_HOME}/api.pid")
        if kill -0 $API_PID 2>/dev/null; then
            echo -e "${GREEN}✅ API: Running (PID: ${API_PID})${NC}"
        else
            echo -e "${RED}❌ API: Not running${NC}"
        fi
    else
        echo -e "${RED}❌ API: Not started${NC}"
    fi
    
    if [ -f "${ABR_HOME}/trading.pid" ]; then
        TRADING_PID=$(cat "${ABR_HOME}/trading.pid")
        if kill -0 $TRADING_PID 2>/dev/null; then
            echo -e "${GREEN}✅ Trading Engine: Running (PID: ${TRADING_PID})${NC}"
        else
            echo -e "${RED}❌ Trading Engine: Not running${NC}"
        fi
    else
        echo -e "${RED}❌ Trading Engine: Not started${NC}"
    fi
}

# Stop all services
stop_services() {
    echo -e "\n${YELLOW}🛑 Stopping services...${NC}"
    
    if [ -f "${ABR_HOME}/core.pid" ]; then
        kill $(cat "${ABR_HOME}/core.pid") 2>/dev/null || true
        rm "${ABR_HOME}/core.pid"
        echo -e "${GREEN}✅ Core stopped${NC}"
    fi
    
    if [ -f "${ABR_HOME}/api.pid" ]; then
        kill $(cat "${ABR_HOME}/api.pid") 2>/dev/null || true
        rm "${ABR_HOME}/api.pid"
        echo -e "${GREEN}✅ API stopped${NC}"
    fi
    
    if [ -f "${ABR_HOME}/trading.pid" ]; then
        kill $(cat "${ABR_HOME}/trading.pid") 2>/dev/null || true
        rm "${ABR_HOME}/trading.pid"
        echo -e "${GREEN}✅ Trading Engine stopped${NC}"
    fi
}

# Show logs
show_logs() {
    local service=$1
    case $service in
        core)
            tail -f "${ABR_LOGS}/core.log"
            ;;
        api)
            tail -f "${ABR_LOGS}/api.log"
            ;;
        trading)
            tail -f "${ABR_LOGS}/trading.log"
            ;;
        all)
            tail -f "${ABR_LOGS}"/*.log
            ;;
        *)
            echo -e "${RED}Usage: $0 logs [core|api|trading|all]${NC}"
            exit 1
            ;;
    esac
}

# Main function
main() {
    print_banner
    
    case "$1" in
        start)
            check_prerequisites
            setup_directories
            install_dependencies "$2"
            verify_genesis
            start_core
            sleep 2
            start_api
            sleep 1
            start_trading
            echo -e "\n${GREEN}✅ ABR Protocol started successfully!${NC}"
            check_status
            ;;
        stop)
            stop_services
            echo -e "\n${GREEN}✅ ABR Protocol stopped${NC}"
            ;;
        restart)
            stop_services
            sleep 2
            exec $0 start
            ;;
        status)
            check_status
            ;;
        logs)
            show_logs "$2"
            ;;
        verify)
            verify_genesis
            ;;
        init)
            check_prerequisites
            setup_directories
            install_dependencies
            verify_genesis
            echo -e "\n${GREEN}✅ Initialization complete! Run '$0 start' to launch${NC}"
            ;;
        help|*)
            echo "Usage: $0 {start|stop|restart|status|logs|verify|init|help} [options]"
            echo ""
            echo "Commands:"
            echo "  start [--dev]   Start all services"
            echo "  stop            Stop all services"
            echo "  restart         Restart all services"
            echo "  status          Check service status"
            echo "  logs [service]  Show logs (core|api|trading|all)"
            echo "  verify          Verify genesis block"
            echo "  init            Initialize directories and install dependencies"
            echo "  help            Show this help"
            ;;
    esac
}

# Run main function
main "$@"
