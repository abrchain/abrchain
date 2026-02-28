#!/bin/bash
echo "🌍 Installing ABR Protocol..."

# Create directories
mkdir -p ~/.abr/bin

# Download CLI (will be from your repo after push)
curl -sSL https://raw.githubusercontent.com/abrchain/abrchain/main/src/abr-core/abr-cli -o ~/.abr/bin/abr
chmod +x ~/.abr/bin/abr

# Add to PATH
echo 'export PATH="$HOME/.abr/bin:$PATH"' >> ~/.bashrc

echo "✅ Installation complete!"
chmod +x scripts/install.sh
