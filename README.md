# 🤖 Minecraft 24/7 Bot

A sophisticated Minecraft bot that runs 24/7 and simulates realistic human gameplay behavior.

## ✨ Features

- **Continuous Movement**: Bot walks forward with natural direction changes and occasional stops
- **Block Breaking**: Randomly breaks common blocks like dirt, stone, and wood logs
- **Chat Interaction**: Sends natural chat messages and responds to other players
- **Anti-Idle**: Performs jumps, look-arounds, and inventory checks to avoid server kicks
- **24/7 Operation**: Automatic reconnection with exponential backoff
- **Safety Features**: Avoids lava, void, and dangerous blocks

## 🚀 Quick Start

### Method 1: Command Line Arguments
```bash
node start.js <server-ip> <port> <username>
```

**Examples:**
```bash
# Connect to Hypixel
node start.js hypixel.net 25565 MyBot

# Connect to a local server
node start.js localhost 25565 TestBot

# Connect to any server
node start.js play.example.com 25565 AutoPlayer
```

### Method 2: Environment Variables
```bash
# Set environment variables
export MINECRAFT_HOST=your-server.com
export MINECRAFT_PORT=25565
export MINECRAFT_USERNAME=YourBotName

# Start the bot
node start.js
```

### Method 3: Quick Test (Default Settings)
```bash
# Uses localhost:25565 with username "AutoBot"
node start.js
```

## 🎮 Bot Behaviors

### Movement Behavior
- Walks forward continuously with random direction changes
- Occasionally stops for 2-8 seconds to look natural
- Avoids dangerous areas like lava and void
- Changes direction every 5-15 seconds

### Block Breaking
- Randomly breaks blocks within 4.5 block reach
- Prefers common blocks: dirt, grass, stone, wood logs
- Avoids important blocks: chests, spawners, beacons
- Automatically equips best tools when available

### Chat System
- Sends friendly messages like "hey there!", "how is everyone doing?"
- Responds to greetings and mentions with natural replies
- Includes 30% chance to respond to keywords
- 70% chance to respond when mentioned by name

### Anti-Idle Features
- Jumps every 1-2 minutes
- Looks around every 10-30 seconds
- Checks inventory every 45-90 seconds
- Switches held items occasionally

## ⚙️ Configuration

The bot can be customized by editing `config.js`:

```javascript
// Example: Make bot more chatty
behavior: {
    chat: {
        enabled: true,
        messageChance: 0.1,  // Increased from 0.05
        checkInterval: 15000  // Check every 15s instead of 30s
    }
}
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MINECRAFT_HOST` | Server IP address | localhost |
| `MINECRAFT_PORT` | Server port | 25565 |
| `MINECRAFT_USERNAME` | Bot username | AutoBot |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | info |

## 📋 Requirements

- Node.js 16.0.0 or higher
- Internet connection
- Valid Minecraft server to connect to

## 🛡️ Safety Features

- **Void Protection**: Bot won't walk into void (y < 5)
- **Lava Avoidance**: Detects and avoids lava blocks
- **Fall Protection**: Won't walk off cliffs higher than 3 blocks
- **Block Safety**: Won't break important blocks like chests or spawners

## 🔄 Error Handling

- Automatic reconnection with exponential backoff
- Up to 10 reconnection attempts before giving up
- Graceful handling of server kicks and disconnections
- Comprehensive logging for debugging

## 📝 Logging

The bot creates detailed logs:
- `bot.log` - All bot activity
- `bot-error.log` - Error messages only
- `exceptions.log` - Critical errors

## 🎯 Use Cases

- Keep your spot on a server when AFK
- Simulate player activity for testing
- Maintain server population
- Automated resource gathering
- Testing server performance under load

## ⚠️ Important Notes

- Ensure you have permission to run bots on the target server
- Some servers prohibit automated clients - check server rules
- Bot requires a valid Minecraft username (3-16 characters)
- Uses offline mode by default (change in config.js for premium accounts)

## 🛑 Stopping the Bot

Press `Ctrl+C` to gracefully shutdown the bot. It will:
1. Stop all behaviors
2. Disconnect from server
3. Save final logs
4. Exit cleanly

---

**Ready to start your 24/7 Minecraft bot? Just run with your server details!**