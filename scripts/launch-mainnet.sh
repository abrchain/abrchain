#!/bin/bash
# ABR Mainnet Launch Script

echo "================================================================="
echo "🚀 LAUNCHING AFRICA BITCOIN RESERVE MAINNET"
echo "================================================================="
echo ""

# Start ABR daemon
echo "Starting ABR daemon..."
cd ~/abr-project/src/abr-core
./src/abrd -daemon -conf=~/.abrcore/abr.conf
sleep 3
echo "✅ ABR daemon started"

# Start payment services
echo "Starting payment services..."
cd ~/abr-project
./abr-payment.sh start
echo "✅ Payment services started"

echo ""
echo "================================================================="
echo "📊 SYSTEM STATUS"
echo "================================================================="
./health-check.sh

echo ""
echo "✅ MAINNET LAUNCH COMPLETE!"
echo "📝 Genesis Block: c2dc80be0ba8353fcf5e152854647b5cb4f15486732bfc0879e70068084cd7bd"
echo "📝 Genesis Address: 1HANfZH6ZF7UfMkJ6F3tgZmyfyptoVGHPQ"
echo "================================================================="
