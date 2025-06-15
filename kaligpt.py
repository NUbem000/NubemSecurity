#!/usr/bin/env python3

import os
import json
import getpass

CONFIG_FILE = os.path.expanduser("~/.kaligpt_config.json")

def save_config(data):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(data, f)

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    return None

def clear_screen():
    os.system('clear' if os.name == 'posix' else 'cls')

def setup():
    print("🧠 Welcome to KaliGPT Setup 🛠️\n")
    api_key = input("🔑 Paste your API key (OpenAI / Gemini / Grok / DeepSeek): ").strip()
    user_name = input("👤 Set your user name: ").strip()
    bot_name = input("🤖 Set your bot name: ").strip()
    
    platform = "Unknown"
    if api_key.startswith("sk-"):
        platform = "OpenAI"
    elif "g-" in api_key:
        platform = "Gemini"
    elif "grok" in api_key.lower():
        platform = "Grok"
    elif "ds-" in api_key.lower():
        platform = "DeepSeek"

    config = {
        "api_key": api_key,
        "platform": platform,
        "user_name": user_name,
        "bot_name": bot_name
    }
    save_config(config)
    print(f"\n✅ API key for {platform} saved successfully!")

def reset_config():
    if os.path.exists(CONFIG_FILE):
        os.remove(CONFIG_FILE)
        print("🔁 Config reset successfully!")
    else:
        print("❌ No existing config found.")

def main():
    config = load_config()
    if not config:
        setup()
        config = load_config()

    print(f"\n💬 {config['bot_name']} is ready! Type '/exit' to quit, '/reset' to reset, '/clear' to clear.\n")

    while True:
        user_input = input(f"{config['user_name']} ➤ ")

        if user_input.strip().lower() == "/exit":
            print("👋 Goodbye!")
            break
        elif user_input.strip().lower() == "/reset":
            reset_config()
            setup()
            config = load_config()
        elif user_input.strip().lower() == "/clear":
            clear_screen()
        else:
            print(f"{config['bot_name']} 🤖 ➤ (This is a placeholder reply, API not wired yet)")

if __name__ == "__main__":
    main()