#!/bin/bash

echo "============================================================"
echo "🤖 Minecraft AI Bot - Anti-Ban Edition (24/7 Mode)"
echo "============================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please download and install Node.js from: https://nodejs.org"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Set your server details here (edit these values)
export MINECRAFT_HOST="GANG_WARS.aternos.me"
export MINECRAFT_PORT="50466"
export MINECRAFT_USERNAME="AIPlayer"

echo "🎯 Connecting to: $MINECRAFT_HOST:$MINECRAFT_PORT"
echo "👤 Bot Username Pool: 20 different usernames"
echo "🔄 Anti-Ban System: Enabled"
echo ""
echo "🤖 Bot will run forever and switch usernames if banned"
echo "Press Ctrl+C to stop the bot"
echo "============================================================"
echo ""

# Run the bot with auto-restart on failure
while true; do
    node ai-bot.js
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "Bot stopped normally."
        break
    else
        echo "Bot crashed (exit code: $exit_code). Restarting in 10 seconds..."
        sleep 10
    fi
done

echo ""
echo "Bot has stopped. Goodbye!"