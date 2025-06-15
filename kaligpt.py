import os
import json

CONFIG_FILE = "config.json"

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def detect_provider(api_key):
    if "sk-" in api_key:
        return "OpenAI"
    elif api_key.startswith("gsk_") or "gemini" in api_key.lower():
        return "Google Gemini"
    elif api_key.startswith("groq_"):
        return "Grok AI"
    elif api_key.startswith("deepseek-") or "deepseek" in api_key.lower():
        return "DeepSeek"
    else:
        return "Unknown"

def save_config(data):
    with open(CONFIG_FILE, "w") as f:
        json.dump(data, f, indent=4)

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE) as f:
            return json.load(f)
    return None

def delete_config():
    if os.path.exists(CONFIG_FILE):
        os.remove(CONFIG_FILE)

def setup():
    clear_screen()
    print("🧠 KaliGPT First-Time Setup by @amarokdevs\n")

    while True:
        api_key = input("🔑 Enter your AI API key: ").strip()
        if len(api_key) > 10:
            break
        print("❌ Invalid key. Try again.")

    provider = detect_provider(api_key)
    print(f"✅ Detected Provider: {provider}\n")

    username = input("👤 Set your name: ").strip()
    bot_name = input("🤖 Name your bot: ").strip()

    config = {
        "username": username,
        "bot_name": bot_name,
        "api_key": api_key,
        "provider": provider
    }
    save_config(config)
    print("\n✅ Setup complete! You can now chat.\n")
    return config

def chat_loop(config):
    clear_screen()
    print(f"💬 {config['bot_name']} (via {config['provider']}) is ready!\n")
    print("💡 Type `/reset` to restart setup, `/clear` to clear screen, `/exit` to quit.\n")

    while True:
        user_input = input(f"{config['username']} > ").strip()
        
        if user_input.lower() in ["/exit", "exit", "quit"]:
            print("👋 Goodbye!")
            break
        elif user_input.lower() == "/reset":
            delete_config()
            print("🔄 Configuration reset. Restarting setup...\n")
            return main()
        elif user_input.lower() == "/clear":
            clear_screen()
            continue

        print(f"\n{config['bot_name']} > [Simulated response for: '{user_input}']\n")
        # Replace above with real API response later

def main():
    config = load_config()
    if not config:
        config = setup()
    chat_loop(config)

if __name__ == "__main__":
    main()