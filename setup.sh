#!/bin/bash

echo "📦 Installing dependencies..."
pip3 install openai google-generativeai requests

echo "🔧 Making kaligpt executable..."
chmod +x kaligpt.py

echo "🛠️ Creating CLI launcher..."
echo -e '#!/bin/bash\npython3 ~/KaliGPT/kaligpt.py "$@"' | sudo tee /usr/local/bin/kaligpt > /dev/null
sudo chmod +x /usr/local/bin/kaligpt

echo "✅ Installation complete. Run using: kaligpt"