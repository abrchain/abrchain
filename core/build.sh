#!/bin/bash

echo "🔨 Building Satoshi Core..."

# Create build directory
mkdir -p build

# Compile Satoshi CLI
g++ -std=c++17 -o build/satoshi-cli \
    cli/satoshi-cli.cpp \
    math/SatoshiMath.cpp \
    wallet/SatoshiWallet.cpp \
    -I.

if [ $? -eq 0 ]; then
    echo "✅ Satoshi CLI built successfully"
    echo "   Binary: $(pwd)/build/satoshi-cli"
else
    echo "❌ Build failed"
    exit 1
fi

# Make executable
chmod +x build/satoshi-cli

echo "📦 Build complete"
