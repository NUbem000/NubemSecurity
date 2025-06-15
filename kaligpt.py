kaligpt.py - KaliGPT Final Version with Multi-Provider Support

import os import sys import json import readline import requests

from pathlib import Path

Constants

CONFIG_PATH = Path.home() / ".kaligpt_config.json" DEFAULT_HEADERS = { "Content-Type": "application/json" }

Detect provider from API key

PROVIDERS = { "openai": lambda k: k.startswith("sk-"), "gemini": lambda k: k.startswith("AIza"), "grok": lambda k: k.startswith("gsk-"), "deepseek": lambda k: k.startswith("dsk-"), }

ENDPOINTS = { "openai": "https://api.openai.com/v1/chat/completions", "gemini": "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", "grok": "https://api.grok.x.ai/v1/chat/completions",  # Placeholder "deepseek": "https://api.deepseek.com/v1/chat/completions"  # Placeholder }

MODELS = { "openai": "gpt-4", "gemini": "gemini-pro", "grok": "grok-1",  # Placeholder "deepseek": "deepseek-chat"  # Placeholder }

def detect_provider(api_key): for provider, check in PROVIDERS.items(): if check(api_key): return provider return None

def load_config(): if CONFIG_PATH.exists(): with open(CONFIG_PATH, "r") as f: return json.load(f) return {}

def save_config(data): with open(CONFIG_PATH, "w") as f: json.dump(data, f, indent=2)

def setup(): print("\n🛠️  Welcome to KaliGPT Setup 🛠️\n") api_key = input("🔑 Paste your API key (OpenAI / Gemini / Grok / DeepSeek): ").strip() provider = detect_provider(api_key) if not provider: print("❌ Unknown API key format. Exiting.") sys.exit(1)

user = input("👤 Set your user name: ").strip()
bot = input("🤖 Set your bot name: ").strip()

save_config({
    "api_key": api_key,
    "provider": provider,
    "user": user or "You",
    "bot": bot or "Bot"
})

print(f"\n✅ API key for {provider.title()} saved successfully!")
print(f"💬 {bot} is ready! Type '/exit' to quit, '/reset' to reset, '/clear' to clear.\n")

def chat_loop(config): history = [] while True: try: user_input = input(f"{config['user']} ➤ ").strip() if user_input.lower() == "/exit": break if user_input.lower() == "/clear": os.system("clear") continue if user_input.lower() == "/reset": history = [] print("🔄 Chat history cleared.") continue

history.append({"role": "user", "content": user_input})

        payload = build_payload(config['provider'], config['api_key'], history)
        response = send_request(config['provider'], config['api_key'], payload)

        if response:
            bot_reply = extract_reply(config['provider'], response)
            print(f"{config['bot']} 🧠 ➤ {bot_reply}\n")
            history.append({"role": "assistant", "content": bot_reply})
        else:
            print("⚠️ Failed to get a response.")

    except KeyboardInterrupt:
        print("\n👋 Exiting...")
        break

def build_payload(provider, api_key, history): if provider == "openai": return { "model": MODELS[provider], "messages": history } elif provider == "gemini": return { "contents": [{"parts": [{"text": history[-1]["content"]}]}] } else: return { "model": MODELS[provider], "messages": history }

def send_request(provider, api_key, payload): try: if provider == "gemini": url = ENDPOINTS[provider] + f"?key={api_key}" res = requests.post(url, json=payload, headers=DEFAULT_HEADERS) else: headers = { **DEFAULT_HEADERS, "Authorization": f"Bearer {api_key}" } res = requests.post(ENDPOINTS[provider], json=payload, headers=headers)

if res.status_code == 200:
        return res.json()
    else:
        print(f"❌ API Error: {res.status_code} - {res.text}")
        return None
except Exception as e:
    print(f"❌ Request failed: {e}")
    return None

def extract_reply(provider, data): try: if provider == "openai" or provider == "deepseek" or provider == "grok": return data['choices'][0]['message']['content'] elif provider == "gemini": return data['candidates'][0]['content']['parts'][0]['text'] except Exception as e: return f"⚠️ Error extracting reply: {e}"

if name == "main": config = load_config() if not config.get("api_key"): setup() config = load_config() chat_loop(config)

