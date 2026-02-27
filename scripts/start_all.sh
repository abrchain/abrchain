#!/bin/bash
# Start all ABR services

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}🚀 Starting ABR Ecosystem${NC}"
echo -e "${YELLOW}========================================${NC}"

# 1. Start ABR Daemon
echo -n "Starting ABR Daemon... "
cd ~/abr-project/src/abr-core
pkill -f "abr daemon" 2>/dev/null
nohup ./abr daemon > /tmp/abr-daemon.log 2>&1 &
sleep 3
if pgrep -f "abr daemon" > /dev/null; then
    echo -e "${GREEN}✅${NC}"
    pgrep -f "abr daemon" > /tmp/abr-daemon.pid
else
    echo -e "${RED}❌${NC}"
fi

# 2. Start REST API Server
echo -n "Starting REST API Server... "
cd ~/abr-project
pkill -f "abr_api_server.py" 2>/dev/null
nohup python3 abr_api_server.py > /tmp/abr-api.log 2>&1 &
sleep 3
if pgrep -f "abr_api_server.py" > /dev/null; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

# 3. Start IoT Stack (if docker-compose exists)
if [ -f ~/abr-project/abr-iot/docker-compose.yml ]; then
    echo -n "Starting IoT Stack... "
    cd ~/abr-project/abr-iot
    docker-compose up -d > /tmp/abr-iot.log 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
    fi
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}✅ All services started${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "📊 Service Status:"
echo "  • ABR Daemon:     http://localhost:9332"
echo "  • REST API:       http://localhost:5000"
echo "  • IoT Dashboard:  http://localhost:3000"
echo ""
echo "📝 Logs:"
echo "  • Daemon:  tail -f /tmp/abr-daemon.log"
echo "  • API:     tail -f /tmp/abr-api.log"
