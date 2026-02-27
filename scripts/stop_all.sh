#!/bin/bash
# Stop all ABR services

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}🛑 Stopping ABR Ecosystem${NC}"
echo -e "${YELLOW}========================================${NC}"

# Stop ABR Daemon
echo -n "Stopping ABR Daemon... "
pkill -f "abr daemon" 2>/dev/null
rm -f /tmp/abr-daemon.pid
echo -e "${GREEN}✅${NC}"

# Stop REST API Server
echo -n "Stopping REST API Server... "
pkill -f "abr_api_server.py" 2>/dev/null
echo -e "${GREEN}✅${NC}"

# Stop IoT Stack
if [ -f ~/abr-project/abr-iot/docker-compose.yml ]; then
    echo -n "Stopping IoT Stack... "
    cd ~/abr-project/abr-iot
    docker-compose down > /tmp/abr-iot-stop.log 2>&1
    echo -e "${GREEN}✅${NC}"
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}✅ All services stopped${NC}"
echo -e "${YELLOW}========================================${NC}"
