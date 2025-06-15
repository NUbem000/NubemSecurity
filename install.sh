#!/bin/bash

echo "🔧 Installing KaliGPT..."

sudo apt update
sudo apt install -y python3 python3-pip
pip3 install --user -r requirements.txt

chmod +x kaligpt.py

# Add to /usr/local/bin
sudo ln -sf "$(pwd)/kaligpt.py" /usr/local/bin/kaligpt
sudo chmod +x /usr/local/bin/kaligpt

echo "✅ Installation complete. Run using: kaligpt"