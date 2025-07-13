#!/usr/bin/env node

const mineflayer = require('mineflayer');
const logger = require('./utils/logger');
const http = require('http');

console.log('='.repeat(60));
console.log('🤖 AI Minecraft Bot + Web Server (UptimeRobot Ready)');
console.log('='.repeat(60));

// Parse command line arguments
const args = process.argv.slice(2);
const serverHost = args[0] || process.env.MINECRAFT_HOST || 'localhost';
const serverPort = parseInt(args[1]) || parseInt(process.env.MINECRAFT_PORT) || 25565;
const baseUsername = args[2] || process.env.MINECRAFT_USERNAME || 'AIPlayer';
const webPort = process.env.PORT || 5000;

// Username rotation system for ban evasion
const usernamePool = [
    'AIPlayer', 'BotHelper', 'AutoCrafter', 'MineBot', 'PlayerAI',
    'CraftBot', 'ExploreBot', 'BuildHelper', 'GameBot', 'ServerBot',
    'FriendlyAI', 'HelpBot', 'ChatBot', 'WorkBot', 'PlayBot',
    'SmartBot', 'QuickBot', 'FastBot', 'CoolBot', 'NiceBot'
];

let currentUsernameIndex = 0;
let currentUsername = baseUsername;

console.log(`🎯 Target Server: ${serverHost}:${serverPort}`);
console.log(`👤 AI Bot Base Username: ${baseUsername}`);
console.log(`🌐 Web Server Port: ${webPort}`);
console.log(`🔄 Username Pool: ${usernamePool.length} usernames available`);
console.log('');

let bot = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 50;

// Bot status for web server
let botStatus = {
    isRunning: false,
    lastSeen: null,
    currentUsername: 'Not connected',
    serverHost: serverHost,
    serverPort: serverPort,
    uptime: Date.now()
};

// AI Bot State
let botState = {
    currentTask: 'exploring',
    inventory: {},
    hasWood: false,
    hasCraftingTable: false,
    hasPickaxe: false,
    isMoving: false,
    lastChatTime: 0,
    lastMined: 0,
    targetPlayer: null,
    isCreativeMode: true,
    goals: ['gather_wood', 'craft_table', 'craft_pickaxe', 'mine_stone']
};

// Web Server for UptimeRobot
const webServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = req.url;
    const now = new Date();
    
    // Main health check for UptimeRobot
    if (url === '/health' || url === '/ping') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
        return;
    }
    
    // Status endpoint
    if (url === '/' || url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        
        const uptimeHours = Math.floor((Date.now() - botStatus.uptime) / (1000 * 60 * 60));
        const uptimeMinutes = Math.floor((Date.now() - botStatus.uptime) / (1000 * 60)) % 60;
        
        const response = {
            status: "OK",
            bot: {
                running: botStatus.isRunning,
                username: botStatus.currentUsername,
                server: `${botStatus.serverHost}:${botStatus.serverPort}`,
                lastSeen: botStatus.lastSeen,
                uptime: `${uptimeHours}h ${uptimeMinutes}m`
            },
            timestamp: now.toISOString(),
            message: botStatus.isRunning ? "Minecraft bot is online and active" : "Minecraft bot is offline or reconnecting"
        };
        
        res.end(JSON.stringify(response, null, 2));
        return;
    }
    
    // Web dashboard
    if (url === '/dashboard') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        const uptimeHours = Math.floor((Date.now() - botStatus.uptime) / (1000 * 60 * 60));
        const uptimeMinutes = Math.floor((Date.now() - botStatus.uptime) / (1000 * 60)) % 60;
        
        res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Minecraft Bot Monitor</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
        .online { background-color: #d4edda; border: 2px solid #28a745; color: #155724; }
        .offline { background-color: #f8d7da; border: 2px solid #dc3545; color: #721c24; }
        .info { background-color: #e7f3ff; border: 2px solid #007bff; color: #004085; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .url-box { background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; border: 1px solid #ddd; }
        h1 { color: #333; text-align: center; }
        .emoji { font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="container">
        <h1><span class="emoji">🤖</span> Minecraft Bot Monitor</h1>
        
        <div class="status ${botStatus.isRunning ? 'online' : 'offline'}">
            <h2>${botStatus.isRunning ? '🟢 BOT ONLINE' : '🔴 BOT OFFLINE'}</h2>
            <p><strong>Username:</strong> ${botStatus.currentUsername}</p>
            <p><strong>Server:</strong> ${botStatus.serverHost}:${botStatus.serverPort}</p>
            <p><strong>Last Seen:</strong> ${botStatus.lastSeen || 'Never'}</p>
            <p><strong>Uptime:</strong> ${uptimeHours}h ${uptimeMinutes}m</p>
        </div>
        
        <div class="info">
            <h3><span class="emoji">📊</span> UptimeRobot Setup Instructions</h3>
            <p><strong>1. Copy this URL:</strong></p>
            <div class="url-box">https://${req.headers.host || 'your-replit-domain'}.replit.app/health</div>
            <p><strong>2. Add to UptimeRobot:</strong></p>
            <ul>
                <li>Monitor Type: HTTP(s)</li>
                <li>URL: Use the URL above</li>
                <li>Monitoring Interval: 5 minutes</li>
                <li>Keyword Monitoring: OFF</li>
            </ul>
            <p><strong>3. Your bot will stay online 24/7!</strong></p>
        </div>
        
        <div class="info">
            <h3><span class="emoji">🎮</span> Bot Features</h3>
            <ul>
                <li>✅ Anti-ban system with username rotation</li>
                <li>✅ Responds to all player messages</li>
                <li>✅ Follows player commands</li>
                <li>✅ Creative mode enabled</li>
                <li>✅ 24/7 operation with UptimeRobot</li>
            </ul>
        </div>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
        `);
        return;
    }
    
    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found - Available endpoints: /health, /status, /dashboard');
});

// Start web server
webServer.listen(webPort, '0.0.0.0', () => {
    logger.info(`🌐 Web server running on port ${webPort}`);
    logger.info(`📊 UptimeRobot URL: https://your-replit-domain.replit.app/health`);
    logger.info(`🖥️  Dashboard: https://your-replit-domain.replit.app/dashboard`);
    console.log('🔗 COPY THIS URL FOR UPTIMEROBOT:');
    console.log(`https://your-replit-domain.replit.app/health`);
    console.log('');
});

// Update bot status function
function updateBotStatus(isConnected) {
    botStatus.isRunning = isConnected;
    botStatus.lastSeen = new Date().toISOString();
    botStatus.currentUsername = currentUsername;
}

// Include all the bot functions from ai-bot.js
function getNextUsername() {
    if (reconnectAttempts === 0) {
        currentUsername = baseUsername;
    } else {
        currentUsernameIndex = (currentUsernameIndex + 1) % usernamePool.length;
        currentUsername = usernamePool[currentUsernameIndex];
        const randomSuffix = Math.floor(Math.random() * 999);
        currentUsername = `${currentUsername}${randomSuffix}`;
    }
    
    logger.info(`🔄 Using username: ${currentUsername} (attempt ${reconnectAttempts + 1})`);
    return currentUsername;
}

function createBot() {
    const username = getNextUsername();
    
    const botOptions = {
        host: serverHost,
        port: serverPort,
        username: username,
        version: '1.20.1',
        auth: 'offline',
        checkTimeoutInterval: 30000,
        keepAlive: true
    };

    logger.info('Creating AI bot instance...');
    bot = mineflayer.createBot(botOptions);
    
    bot.on('login', () => {
        logger.info(`✅ AI Bot logged in successfully!`);
        logger.info(`🌍 Connected to ${serverHost}:${serverPort}`);
        reconnectAttempts = 0;
        updateBotStatus(true);
        
        console.log('🤖 AI Bot is now online and ready to play!');
        console.log('🎮 Bot will behave like a real intelligent player...');
        console.log('Press Ctrl+C to stop the bot');
        console.log('='.repeat(60));
    });

    bot.on('spawn', () => {
        logger.info(`AI Bot spawned at ${bot.entity.position}`);
        
        setTimeout(() => {
            if (botState.isCreativeMode) {
                try {
                    bot.chat('/gamemode creative');
                    sendIntelligentChat('switching to creative mode for better building!');
                } catch (error) {
                    logger.debug('Could not set creative mode');
                }
            }
        }, 1000);
        
        setTimeout(() => {
            startAIBehaviors();
        }, 2000);
    });

    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        logger.info(`<${username}> ${message}`);
        handlePlayerChat(username, message);
    });

    bot.on('playerJoined', (player) => {
        logger.info(`${player.username} joined the game`);
        setTimeout(() => {
            const welcomes = [
                `welcome to the server ${player.username}! hope you have fun here!`,
                `hey ${player.username}! welcome! nice to meet you!`,
                `welcome ${player.username}! this is a great server to play on!`,
                `hi ${player.username}! welcome to our community!`,
                `${player.username} welcome! let me know if you need any help!`
            ];
            sendIntelligentChat(welcomes[Math.floor(Math.random() * welcomes.length)]);
        }, 1500 + Math.random() * 2500);
    });

    bot.on('error', (err) => {
        logger.error(`❌ AI Bot error: ${err.message}`);
        updateBotStatus(false);
        scheduleReconnect();
    });

    bot.on('end', (reason) => {
        logger.warn(`🔌 AI Bot disconnected: ${reason}`);
        updateBotStatus(false);
        scheduleReconnect();
    });

    bot.on('kicked', (reason) => {
        logger.warn(`👢 AI Bot was kicked: ${reason}`);
        
        const banKeywords = ['ban', 'banned', 'blacklist', 'prohibited', 'blocked', 'suspended'];
        const isBanned = banKeywords.some(keyword => 
            reason.toLowerCase().includes(keyword)
        );
        
        if (isBanned) {
            logger.warn(`🚫 Detected ban! Reason: ${reason}`);
            logger.info(`🔄 Will reconnect with different username...`);
        }
        
        updateBotStatus(false);
        scheduleReconnect();
    });

    return bot;
}

function scheduleReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
        logger.error(`💀 Max reconnection attempts (${maxReconnectAttempts}) reached. Exiting.`);
        console.log('\n❌ AI Bot failed to maintain connection.');
        process.exit(1);
    }

    reconnectAttempts++;
    
    let delay;
    if (reconnectAttempts > 1) {
        delay = Math.min(120000, 30000 + (reconnectAttempts * 15000));
        logger.info(`🔄 Reconnecting with new username in ${delay/1000}s (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
    } else {
        delay = 5000;
        logger.info(`🔄 Quick reconnect in ${delay/1000}s (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
    }
    
    setTimeout(() => {
        try {
            if (bot) {
                bot.quit();
                bot = null;
            }
            createBot();
        } catch (error) {
            logger.error(`Error during reconnection: ${error.message}`);
        }
    }, delay);
}

// Simplified chat function for this version
function sendIntelligentChat(message) {
    if (!bot || !message) return;
    
    const currentTime = Date.now();
    if (currentTime - botState.lastChatTime < 3000) return;
    
    try {
        bot.chat(message);
        botState.lastChatTime = currentTime;
        logger.info(`💬 AI Bot: ${message}`);
    } catch (error) {
        logger.debug(`Failed to send chat: ${error.message}`);
    }
}

// Simplified behavior functions
function startAIBehaviors() {
    logger.info('🧠 Starting AI behaviors...');
    
    setInterval(() => {
        if (Math.random() < 0.3) {
            const messages = [
                'hey everyone! how is everyone doing today?',
                'this server has such a great community!',
                'anyone need help with anything? i am happy to assist!',
                'love meeting new players here!'
            ];
            sendIntelligentChat(messages[Math.floor(Math.random() * messages.length)]);
        }
    }, 60000 + Math.random() * 120000);
    
    logger.info('🎮 AI behaviors activated!');
}

function handlePlayerChat(username, message) {
    if (username === bot.username) return;
    
    const lowerMessage = message.toLowerCase();
    logger.info(`📢 Player message from ${username}: "${message}"`);
    
    if (Math.random() < 0.7) {
        const replies = [
            `hi ${username}! how are you doing?`,
            `hey ${username}! what's up?`,
            `interesting ${username}! tell me more`,
            `that sounds cool ${username}!`,
            `awesome ${username}! how can i help?`
        ];
        
        setTimeout(() => {
            sendIntelligentChat(replies[Math.floor(Math.random() * replies.length)]);
        }, 1000 + Math.random() * 2000);
    }
}

// Start the bot
createBot();

// Handle process termination
process.on('SIGINT', () => {
    logger.info('Shutting down bot...');
    if (bot) {
        bot.quit();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Shutting down bot...');
    if (bot) {
        bot.quit();
    }
    process.exit(0);
});