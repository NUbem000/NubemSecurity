
import os
import openai
import requests

def detect_provider(api_key):
    if api_key.startswith("sk-"):
        return "openai"
    elif api_key.startswith("AIza") or api_key.startswith("GEMINI_"):
        return "gemini"
    elif api_key.startswith("grok_") or api_key.startswith("xapp-"):
        return "grok"
    elif api_key.startswith("deepseek-"):
        return "deepseek"
    else:
        return "unknown"

def ask_openai(prompt, api_key):
    openai.api_key = api_key
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content.strip()

def ask_gemini(prompt, api_key):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + api_key
    headers = {"Content-Type": "application/json"}
    data = {"contents": [{"parts": [{"text": prompt}]}]}
    res = requests.post(url, headers=headers, json=data)
    return res.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "Gemini error")

def ask_deepseek(prompt, api_key):
    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": prompt}]
    }
    res = requests.post(url, headers=headers, json=data)
    return res.json()["choices"][0]["message"]["content"]

def ask_grok(prompt, api_key):
    return "Grok API not publicly available yet."

def main():
    print("🤖 Welcome to KaliGPT Setup 🛠️")
    api_key = os.getenv("KALIGPT_API_KEY") or input("🔑 Paste your API key (OpenAI / Gemini / Grok / DeepSeek): ").strip()
    user_name = input("👤 Set your user name: ")
    bot_name = input("🤖 Set your bot name: ")
    provider = detect_provider(api_key)

    os.environ["KALIGPT_API_KEY"] = api_key
    print(f"✅ API key for {provider.capitalize()} saved successfully!")
    print(f"💬 {bot_name} is ready! Type '/exit' to quit, '/reset' to reset.\n")

    while True:
        user_input = input(f"\n{user_name} 💬➤ ").strip()
        if user_input.lower() in ["/exit", "/quit"]:
            print("👋 Goodbye!")
            break

        if provider == "openai":
            response = ask_openai(user_input, api_key)
        elif provider == "gemini":
            response = ask_gemini(user_input, api_key)
        elif provider == "deepseek":
            response = ask_deepseek(user_input, api_key)
        elif provider == "grok":
            response = ask_grok(user_input, api_key)
        else:
            response = "❌ Unknown provider or API key format."

        print(f"{bot_name} 💻➤ {response}")

if __name__ == "__main__":
    main()
