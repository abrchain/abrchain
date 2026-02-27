#!/bin/bash
# ABR Quick Health Check

echo "🇦🇫 ABR Health Check - $(date)"
echo "================================"

# Check ABR daemon
if pgrep -x "abrd" > /dev/null; then
    echo "✅ ABR Daemon: RUNNING"
else
    echo "❌ ABR Daemon: STOPPED"
fi

# Check payment services
for port in 3006 3007 3008 3009 3000; do
    case $port in
        3006) service="On-Ramp" ;;
        3007) service="Off-Ramp" ;;
        3008) service="Card" ;;
        3009) service="Merchant" ;;
        3000) service="Gateway" ;;
    esac
    
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ $service: RUNNING"
    else
        echo "❌ $service: STOPPED"
    fi
done

# Check disk space
df -h ~ | awk 'NR==2 {print "💾 Disk Usage: " $5 " used"}'

# Check memory
free -h | awk 'NR==2 {print "🧠 Memory: " $3 " used / " $2 " total"}'

# Check system load
uptime | awk '{print "📊 Load Average: " $(NF-2) " " $(NF-1) " " $NF}'

echo "================================"
