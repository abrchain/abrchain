#!/bin/bash
# Check status of all ABR services

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}📊 ABR Ecosystem Status${NC}"
echo -e "${YELLOW}========================================${NC}"

# Check ABR Daemon
echo -n "ABR Daemon:        "
if pgrep -f "abr daemon" > /dev/null; then
    PID=$(pgrep -f "abr daemon")
    echo -e "${GREEN}✅ Running (PID: $PID)${NC}"
else
    echo -e "${RED}❌ Stopped${NC}"
fi

# Check REST API
echo -n "REST API Server:   "
if pgrep -f "abr_api_server.py" > /dev/null; then
    PID=$(pgrep -f "abr_api_server.py")
    echo -e "${GREEN}✅ Running (PID: $PID)${NC}"
else
    echo -e "${RED}❌ Stopped${NC}"
fi

# Check IoT Stack
echo -n "IoT Stack:         "
if docker ps | grep -q "abr-"; then
    echo -e "${GREEN}✅ Running${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep "abr-"
else
    echo -e "${RED}❌ Stopped${NC}"
fi

# Check CLI
echo -n "CLI:               "
if [ -f ~/abr-project/src/abr-core/abr ]; then
    echo -e "${GREEN}✅ Available${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo -e "${YELLOW}========================================${NC}"

# Show quick stats if daemon is running
if pgrep -f "abr daemon" > /dev/null; then
    echo ""
    echo "📈 Quick Stats:"
    ~/abr-project/src/abr-core/abr checkdb 2>/dev/null | head -2
fi
