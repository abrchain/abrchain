#!/bin/bash
# ABR Ecosystem Control Script

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🇦🇫 ABR Ecosystem Control${NC}"
echo -e "${BLUE}========================================${NC}"

case "$1" in
    start)
        echo -e "${YELLOW}Starting ABR Blockchain...${NC}"
        cd ~/abr-project/src/abr-core
        pkill -f abr 2>/dev/null
        ./abr daemon &
        echo $! > /tmp/abr-daemon.pid
        sleep 2
        echo -e "${GREEN}✅ ABR Daemon started (PID: $(cat /tmp/abr-daemon.pid))${NC}"
        
        echo -e "${YELLOW}Starting IoT Stack...${NC}"
        cd ~/abr-project/abr-iot
        docker-compose up -d
        echo -e "${GREEN}✅ IoT Stack started${NC}"
        
        echo -e "${YELLOW}Starting Explorer...${NC}"
        cd ~/abr-project/explorer
        if [ -f "package.json" ]; then
            npm start &
            echo $! > /tmp/abr-explorer.pid
            echo -e "${GREEN}✅ Explorer started${NC}"
        fi
        ;;
        
    stop)
        echo -e "${YELLOW}Stopping ABR Ecosystem...${NC}"
        
        if [ -f /tmp/abr-daemon.pid ]; then
            kill $(cat /tmp/abr-daemon.pid) 2>/dev/null
            rm /tmp/abr-daemon.pid
            echo -e "${GREEN}✅ ABR Daemon stopped${NC}"
        fi
        
        cd ~/abr-project/abr-iot
        docker-compose down
        echo -e "${GREEN}✅ IoT Stack stopped${NC}"
        
        if [ -f /tmp/abr-explorer.pid ]; then
            kill $(cat /tmp/abr-explorer.pid) 2>/dev/null
            rm /tmp/abr-explorer.pid
            echo -e "${GREEN}✅ Explorer stopped${NC}"
        fi
        ;;
        
    status)
        echo -e "${BLUE}📊 ABR Ecosystem Status${NC}"
        echo "----------------------------------------"
        
        if pgrep -f "abr daemon" > /dev/null; then
            echo -e "ABR Daemon: ${GREEN}✅ Running${NC}"
            ps aux | grep "abr daemon" | grep -v grep
        else
            echo -e "ABR Daemon: ${RED}❌ Stopped${NC}"
        fi
        
        cd ~/abr-project/abr-iot
        docker-compose ps
        
        if pgrep -f "explorer" > /dev/null; then
            echo -e "Explorer: ${GREEN}✅ Running${NC}"
        else
            echo -e "Explorer: ${RED}❌ Stopped${NC}"
        fi
        ;;
        
    logs)
        tail -f ~/.abr/mainnet/debug.log
        ;;
        
    *)
        echo "Usage: $0 {start|stop|status|logs}"
        exit 1
        ;;
esac
