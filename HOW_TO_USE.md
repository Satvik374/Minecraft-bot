# 🎮 How to Use Your Minecraft Bot

## ✅ Quick Start - Click "Run" Button

1. **Click the "Run" button** at the top of this page
2. Your bot will start automatically!

## 🎯 Connect to Your Server

To connect to your specific Minecraft server, you have two options:

### Option 1: Edit the Command (Recommended)
1. Stop the current bot (if running)
2. Edit the workflow to use your server details
3. Replace the command with:
   ```
   node start.js YOUR_SERVER_IP PORT YOUR_BOT_NAME
   ```
   
   **Example:**
   ```
   node start.js hypixel.net 25565 MyBot
   ```

### Option 2: Set Environment Variables
1. Click on "Secrets" in the sidebar
2. Add these environment variables:
   - `MINECRAFT_HOST` = your server IP
   - `MINECRAFT_PORT` = your server port  
   - `MINECRAFT_USERNAME` = your bot name
3. Click "Run" to start with your settings

## 🤖 What Your Bot Does

Once connected, your bot will:
- ✅ **Keep moving forward** with natural direction changes
- ✅ **Break blocks randomly** (dirt, stone, wood, etc.)
- ✅ **Send chat messages** like "hey there!" and "how is everyone doing?"
- ✅ **Respond to other players** when they talk to it
- ✅ **Stay active 24/7** without getting kicked for being idle
- ✅ **Automatically reconnect** if disconnected

## 📊 Monitoring Your Bot

Watch the console output to see:
- Connection status
- Bot activities (moving, breaking blocks, chatting)
- Any errors or reconnection attempts
- Health and status updates

## 🛑 Stopping Your Bot

Click the "Stop" button in the console or press Ctrl+C to gracefully shutdown.

## ⚠️ Important Notes

- Make sure your target server allows bots
- Bot uses offline mode by default
- Ensure server IP and port are correct
- Bot will try to reconnect automatically if disconnected

---

**Your bot is ready! Just click "Run" and it will start working immediately!**