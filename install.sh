#!/bin/bash

echo "🔧 Installing KaliGPT by @amarokdevs..."

if ! command -v python3 &> /dev/null; then
    echo "🚨 Python 3 is not installed."
    exit 1
fi

if ! command -v pip &> /dev/null; then
    echo "⚙️ Installing pip..."
    sudo apt install python3-pip -y
fi

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

echo "✅ Installed! Run it with:"
echo "source .venv/bin/activate && python3 kaligpt.py"