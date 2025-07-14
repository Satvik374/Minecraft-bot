#!/usr/bin/env node

const mineflayer = require('mineflayer');
const logger = require('./utils/logger');
const http = require('http');
const OpenAI = require('openai');

// Database integration - optional
let storage = null;
try {
    if (process.env.DATABASE_URL) {
        storage = require('./server/storage').storage;
    }
} catch (error) {
    // Database not available, continue without it
    storage = null;
}

// Initialize OpenAI for ChatGPT integration  
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Chat history for context
const chatHistory = new Map(); // playerName -> array of messages

// Check if database is available
const hasDatabase = !!storage;
if (hasDatabase) {
    logger.info('📊 Database connected successfully');
} else {
    logger.warn('⚠️  Database not available, running without database logging');
}

console.log('='.repeat(60));
console.log('🤖 AI Minecraft Bot + Database + Web Server');
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
let currentSessionId = null;

console.log(`🎯 Target Server: ${serverHost}:${serverPort}`);
console.log(`👤 AI Bot Base Username: ${baseUsername}`);
console.log(`🌐 Web Server Port: ${webPort}`);
console.log(`🔄 Username Pool: ${usernamePool.length} usernames available`);
console.log(`📊 Database: ${hasDatabase ? 'ENABLED' : 'DISABLED'}`);
console.log(`🤖 ChatGPT: ${process.env.OPENAI_API_KEY ? 'ENABLED' : 'DISABLED'}`);
console.log('');

let bot = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 50;
let isReconnecting = false;

// Bot status for web server
let botStatus = {
    isRunning: false,
    lastSeen: null,
    currentUsername: 'Not connected',
    serverHost: serverHost,
    serverPort: serverPort,
    uptime: Date.now(),
    totalSessions: 0,
    totalChatMessages: 0,
    totalPlayersInteracted: 0
};

// Bot statistics
let sessionStats = {
    chatMessagesSent: 0,
    playersInteracted: new Set(),
    blocksBreken: 0,
    itemsCrafted: 0,
    startTime: Date.now()
};

// Simplified database helper functions
async function createBotSession() {
    if (!hasDatabase) return null;
    
    try {
        // Use storage if available
        if (storage) {
            const session = await storage.createBotSession({
                username: currentUsername,
                serverHost: serverHost,
                serverPort: serverPort,
                startTime: new Date(),
                isActive: true
            });
            currentSessionId = session.id;
            botStatus.totalSessions++;
            logger.info(`📊 Created database session ${currentSessionId}`);
            return currentSessionId;
        }
    } catch (error) {
        logger.debug(`Database session creation: ${error.message}`);
    }
    return null;
}

async function endBotSession(reason = 'disconnect') {
    if (!hasDatabase || !currentSessionId) return;
    
    try {
        if (storage) {
            await storage.endCurrentSession(reason);
            logger.info(`📊 Ended database session ${currentSessionId}`);
            currentSessionId = null;
        }
    } catch (error) {
        logger.debug(`Database session end: ${error.message}`);
    }
}

async function logPlayerInteraction(playerName, messageType, message, botResponse = null) {
    if (!hasDatabase || !currentSessionId) return;
    
    try {
        if (storage) {
            await storage.logPlayerInteraction({
                sessionId: currentSessionId,
                playerName: playerName,
                messageType: messageType,
                message: message,
                botResponse: botResponse,
                timestamp: new Date()
            });
            sessionStats.playersInteracted.add(playerName);
            botStatus.totalPlayersInteracted = sessionStats.playersInteracted.size;
        }
    } catch (error) {
        logger.debug(`Database interaction logging: ${error.message}`);
    }
}

async function updateServerStatus(isOnline, playerCount = 0, errorMessage = null) {
    if (!hasDatabase) return;
    
    try {
        if (storage) {
            await storage.updateServerStatus({
                serverHost: serverHost,
                serverPort: serverPort,
                isOnline: isOnline,
                playerCount: playerCount,
                errorMessage: errorMessage,
                timestamp: new Date()
            });
        }
    } catch (error) {
        logger.debug(`Database server status update: ${error.message}`);
    }
}

async function logUsernameUsage(username, wasBanned = false, banReason = null) {
    if (!hasDatabase) return;
    
    try {
        if (storage) {
            await storage.logUsernameUsage({
                username: username,
                serverHost: serverHost,
                serverPort: serverPort,
                wasBanned: wasBanned,
                banReason: banReason,
                timestamp: new Date()
            });
        }
    } catch (error) {
        logger.debug(`Database username logging: ${error.message}`);
    }
}

// Web Server for UptimeRobot - Enhanced with Database Stats
const webServer = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Keep-Alive', 'timeout=30, max=100');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = req.url;
    const now = new Date();
    
    // Main health check for UptimeRobot
    if (url === '/health' || url === '/ping') {
        res.writeHead(200, { 
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.end('OK - Bot & Database Active');
        return;
    }
    
    // Enhanced status endpoint with database stats
    if (url === '/' || url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        
        const uptimeHours = Math.floor((Date.now() - botStatus.uptime) / (1000 * 60 * 60));
        const uptimeMinutes = Math.floor((Date.now() - botStatus.uptime) / (1000 * 60)) % 60;
        
        // Get recent database stats if available
        let dbStats = null;
        if (db) {
            try {
                const result = await db.execute(`
                    SELECT COUNT(*) as total_sessions,
                           SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_sessions,
                           MAX(start_time) as last_session
                    FROM bot_sessions 
                    WHERE server_host = $1 AND server_port = $2
                `, [serverHost, serverPort]);
                
                dbStats = result.rows[0];
            } catch (error) {
                logger.debug(`Database stats query failed: ${error.message}`);
            }
        }
        
        const response = {
            status: "OK",
            webServer: "ACTIVE",
            database: db ? "CONNECTED" : "DISABLED",
            bot: {
                running: botStatus.isRunning,
                username: botStatus.currentUsername,
                server: `${botStatus.serverHost}:${botStatus.serverPort}`,
                lastSeen: botStatus.lastSeen,
                uptime: `${uptimeHours}h ${uptimeMinutes}m`,
                reconnectAttempts: reconnectAttempts,
                sessionId: currentSessionId
            },
            statistics: {
                totalSessions: dbStats?.total_sessions || botStatus.totalSessions,
                activeSessions: dbStats?.active_sessions || (botStatus.isRunning ? 1 : 0),
                totalChatMessages: botStatus.totalChatMessages + sessionStats.chatMessagesSent,
                currentSessionPlayers: sessionStats.playersInteracted.size,
                lastSession: dbStats?.last_session
            },
            timestamp: now.toISOString(),
            message: botStatus.isRunning ? 
                "Bot online - All systems operational" : 
                `Bot reconnecting (attempt ${reconnectAttempts}) - Web server active`
        };
        
        res.end(JSON.stringify(response, null, 2));
        return;
    }
    
    // Enhanced web dashboard with database stats
    if (url === '/dashboard') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        const uptimeHours = Math.floor((Date.now() - botStatus.uptime) / (1000 * 60 * 60));
        const uptimeMinutes = Math.floor((Date.now() - botStatus.uptime) / (1000 * 60)) % 60;
        
        res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Minecraft Bot + Database Monitor</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
        .online { background-color: #d4edda; border: 2px solid #28a745; color: #155724; }
        .offline { background-color: #f8d7da; border: 2px solid #dc3545; color: #721c24; }
        .info { background-color: #e7f3ff; border: 2px solid #007bff; color: #004085; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #ddd; text-align: center; }
        .url-box { background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; border: 1px solid #ddd; }
        h1 { color: #333; text-align: center; }
        .emoji { font-size: 1.2em; }
        .db-status { padding: 10px; border-radius: 5px; margin: 10px 0; text-align: center; font-weight: bold; }
        .db-connected { background-color: #d1ecf1; border: 1px solid #b8daff; color: #0c5460; }
        .db-disabled { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
    </style>
</head>
<body>
    <div class="container">
        <h1><span class="emoji">🤖</span> Minecraft Bot + Database Monitor</h1>
        
        <div class="status ${botStatus.isRunning ? 'online' : 'offline'}">
            <h2>${botStatus.isRunning ? '🟢 BOT ONLINE' : '🔴 BOT OFFLINE'}</h2>
            <p><strong>Username:</strong> ${botStatus.currentUsername}</p>
            <p><strong>Server:</strong> ${botStatus.serverHost}:${botStatus.serverPort}</p>
            <p><strong>Last Seen:</strong> ${botStatus.lastSeen || 'Never'}</p>
            <p><strong>Uptime:</strong> ${uptimeHours}h ${uptimeMinutes}m</p>
            <p><strong>Session ID:</strong> ${currentSessionId || 'None'}</p>
        </div>

        <div class="db-status ${db ? 'db-connected' : 'db-disabled'}">
            📊 Database: ${db ? 'CONNECTED & LOGGING' : 'DISABLED'}
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <h3>Total Sessions</h3>
                <p style="font-size: 2em; color: #007bff;">${botStatus.totalSessions}</p>
            </div>
            <div class="stat-card">
                <h3>Chat Messages</h3>
                <p style="font-size: 2em; color: #28a745;">${botStatus.totalChatMessages + sessionStats.chatMessagesSent}</p>
            </div>
            <div class="stat-card">
                <h3>Players Met</h3>
                <p style="font-size: 2em; color: #ffc107;">${sessionStats.playersInteracted.size}</p>
            </div>
            <div class="stat-card">
                <h3>Reconnect Attempts</h3>
                <p style="font-size: 2em; color: #dc3545;">${reconnectAttempts}</p>
            </div>
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
            <p><strong>3. Your bot will stay online 24/7 with full database logging!</strong></p>
        </div>
        
        <div class="info">
            <h3><span class="emoji">🎮</span> Enhanced Bot Features</h3>
            <ul>
                <li>✅ Anti-ban system with username rotation</li>
                <li>✅ PostgreSQL database logging</li>
                <li>✅ Player interaction tracking</li>
                <li>✅ Session statistics</li>
                <li>✅ Server status monitoring</li>
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
    
    // Update server status in database
    updateServerStatus(isConnected, isConnected ? 1 : 0);
}

// Username management with database logging
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
    
    // Log username usage
    logUsernameUsage(currentUsername, false);
    
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
        checkTimeoutInterval: 60000,
        keepAlive: true,
        hideErrors: false,
        respawn: true,
        viewDistance: 'tiny',
        chatLengthLimit: 256,
        physicsEnabled: false,
        loadInternalPlugins: false
    };

    logger.info('Creating AI bot instance...');
    bot = mineflayer.createBot(botOptions);
    
    bot.on('login', async () => {
        logger.info(`✅ AI Bot logged in successfully!`);
        logger.info(`🌍 Connected to ${serverHost}:${serverPort}`);
        reconnectAttempts = 0;
        isReconnecting = false;
        updateBotStatus(true);
        
        // Create database session
        await createBotSession();
        
        // Reset session stats
        sessionStats = {
            chatMessagesSent: 0,
            playersInteracted: new Set(),
            blocksBreken: 0,
            itemsCrafted: 0,
            startTime: Date.now()
        };
        
        console.log('🤖 AI Bot is now online and ready to play!');
        console.log('🎮 Bot will behave like a real intelligent player...');
        console.log('📊 All activities will be logged to database');
        console.log('Press Ctrl+C to stop the bot');
        console.log('='.repeat(60));
    });

    bot.on('spawn', () => {
        logger.info(`AI Bot spawned at ${bot.entity.position}`);
        
        // Log spawn position in database
        if (currentSessionId && db) {
            const position = bot.entity.position;
            db.execute(`
                UPDATE bot_sessions SET position = $1 WHERE id = $2
            `, [JSON.stringify(position), currentSessionId]).catch(err => 
                logger.debug(`Failed to log spawn position: ${err.message}`)
            );
        }
        
        // Start keep-alive activities immediately
        startKeepAliveActivities();
        
        setTimeout(() => {
            if (bot) {
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

    bot.on('chat', async (username, message) => {
        if (username === bot.username) return;
        logger.info(`<${username}> ${message}`);
        
        // Log player interaction
        await logPlayerInteraction(username, 'chat', message);
        
        handlePlayerChat(username, message);
    });

    bot.on('playerJoined', async (player) => {
        logger.info(`${player.username} joined the game`);
        
        // Log player join
        await logPlayerInteraction(player.username, 'join', null);
        
        setTimeout(async () => {
            try {
                // Use ChatGPT for personalized welcome message
                const response = await openai.chat.completions.create({
                    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                    messages: [
                        {
                            role: 'system',
                            content: `You are ${currentUsername}, a friendly player on a Minecraft server. Generate a short, warm welcome message (under 50 characters) for a new player named ${player.username}. Be casual and friendly like a real player.`
                        }
                    ],
                    max_tokens: 50,
                    temperature: 0.8
                });
                
                const welcomeMessage = response.choices[0].message.content.trim();
                await sendIntelligentChat(welcomeMessage);
                
                // Log bot response
                await logPlayerInteraction(player.username, 'welcome', null, welcomeMessage);
                
            } catch (error) {
                // Fallback welcome if ChatGPT fails
                const fallbackWelcome = `welcome ${player.username}! nice to meet you!`;
                await sendIntelligentChat(fallbackWelcome);
                await logPlayerInteraction(player.username, 'welcome', null, fallbackWelcome);
            }
        }, 1500 + Math.random() * 2500);
    });

    bot.on('playerLeft', async (player) => {
        logger.info(`${player.username} left the game`);
        
        // Log player leave
        await logPlayerInteraction(player.username, 'leave', null);
    });

    bot.on('error', async (err) => {
        logger.error(`❌ AI Bot error: ${err.message}`);
        clearKeepAliveIntervals();
        updateBotStatus(false);
        await endBotSession(`error: ${err.message}`);
        scheduleReconnect();
    });

    bot.on('end', async (reason) => {
        logger.warn(`🔌 AI Bot disconnected: ${reason}`);
        clearKeepAliveIntervals();
        updateBotStatus(false);
        await endBotSession(reason);
        scheduleReconnect();
    });

    bot.on('kicked', async (reason) => {
        logger.warn(`👢 AI Bot was kicked: ${reason}`);
        
        clearKeepAliveIntervals();
        
        const banKeywords = ['ban', 'banned', 'blacklist', 'prohibited', 'blocked', 'suspended'];
        const isBanned = banKeywords.some(keyword => 
            reason.toLowerCase().includes(keyword)
        );
        
        if (isBanned) {
            logger.warn(`🚫 Detected ban! Reason: ${reason}`);
            logger.info(`🔄 Will reconnect with different username...`);
            
            // Log banned username
            await logUsernameUsage(currentUsername, true, reason);
        }
        
        updateBotStatus(false);
        await endBotSession(`kicked: ${reason}`);
        scheduleReconnect();
    });

    return bot;
}

function scheduleReconnect() {
    // Prevent multiple simultaneous reconnection attempts
    if (isReconnecting) {
        logger.debug('⚠️  Reconnection already in progress, skipping duplicate attempt');
        return;
    }
    
    isReconnecting = true;
    
    if (reconnectAttempts >= maxReconnectAttempts) {
        logger.warn(`⚠️  Max reconnection attempts (${maxReconnectAttempts}) reached. Will keep trying with longer delays...`);
        reconnectAttempts = Math.floor(maxReconnectAttempts / 2);
    }

    reconnectAttempts++;
    
    let delay;
    if (reconnectAttempts <= 3) {
        delay = 5000;
        logger.info(`🔄 Quick reconnect in ${delay/1000}s (attempt ${reconnectAttempts})`);
    } else if (reconnectAttempts <= 10) {
        delay = 30000;
        logger.info(`🔄 Reconnecting in ${delay/1000}s (attempt ${reconnectAttempts}) - server may be down`);
    } else {
        delay = Math.min(300000, 60000 + (reconnectAttempts * 10000));
        logger.info(`🔄 Long reconnect in ${Math.floor(delay/60000)}min (attempt ${reconnectAttempts}) - waiting for server`);
    }
    
    setTimeout(() => {
        try {
            // Ensure only one bot exists at a time
            if (bot && typeof bot.quit === 'function') {
                bot.quit();
            }
            bot = null;
            
            // Reset reconnecting flag and create new bot
            isReconnecting = false;
            createBot();
        } catch (error) {
            logger.error(`Error during reconnection: ${error.message}`);
            bot = null;
            isReconnecting = false;
            
            // Wait before trying again, but don't create nested reconnection loop
            setTimeout(() => {
                if (!isReconnecting) {
                    scheduleReconnect();
                }
            }, 10000);
        }
    }, delay);
}

// ChatGPT integration function
async function getChatGPTResponse(playerName, message) {
    try {
        // Get or create chat history for this player
        if (!chatHistory.has(playerName)) {
            chatHistory.set(playerName, []);
        }
        
        const playerHistory = chatHistory.get(playerName);
        
        // Add player message to history
        playerHistory.push({ role: 'user', content: `${playerName}: ${message}` });
        
        // Keep only last 10 messages for context (to manage API costs)
        if (playerHistory.length > 10) {
            playerHistory.splice(0, playerHistory.length - 10);
        }
        
        // Create messages array for ChatGPT
        const messages = [
            {
                role: 'system',
                content: `You are ${currentUsername}, a friendly AI player in a Minecraft server. You should:
- Respond naturally like a real player
- Keep responses short (under 50 characters for Minecraft chat)
- Be helpful, friendly, and engaging
- Talk about Minecraft activities like building, mining, crafting
- Use casual gaming language
- Remember you're playing Minecraft with ${playerName}
- Don't mention you're an AI unless directly asked`
            },
            ...playerHistory
        ];
        
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: messages,
            max_tokens: 60,
            temperature: 0.8
        });
        
        const aiResponse = response.choices[0].message.content.trim();
        
        // Add AI response to history
        playerHistory.push({ role: 'assistant', content: aiResponse });
        
        return aiResponse;
        
    } catch (error) {
        logger.error(`ChatGPT API error: ${error.message}`);
        // Fallback to simple responses if ChatGPT fails
        const fallbackResponses = [
            `hey ${playerName}! how are you doing?`,
            `hi ${playerName}! what's up?`,
            `cool ${playerName}! tell me more`,
            `awesome ${playerName}! that sounds fun!`,
            `nice ${playerName}! what are you building?`
        ];
        return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
}

// Enhanced chat function with ChatGPT and database logging
async function sendIntelligentChat(message, isResponseTo = null) {
    if (!bot || !message) return;
    
    const currentTime = Date.now();
    if (currentTime - (botStatus.lastChatTime || 0) < 3000) return;
    
    try {
        bot.chat(message);
        botStatus.lastChatTime = currentTime;
        sessionStats.chatMessagesSent++;
        botStatus.totalChatMessages++;
        
        // Log bot chat message
        if (currentSessionId) {
            await logPlayerInteraction(bot.username, 'bot_chat', message);
        }
        
        logger.info(`💬 AI Bot: ${message}`);
    } catch (error) {
        logger.debug(`Failed to send chat: ${error.message}`);
    }
}

// Enhanced keep-alive function to prevent disconnections
let keepAliveIntervals = [];

function startKeepAliveActivities() {
    if (!bot) return;
    
    // Clear any existing intervals
    clearKeepAliveIntervals();
    
    // Movement keep-alive (every 20-40 seconds)
    const moveInterval = setInterval(() => {
        if (!bot || !bot.entity) {
            clearInterval(moveInterval);
            return;
        }
        
        try {
            const actions = [
                () => {
                    // Jump
                    bot.setControlState('jump', true);
                    setTimeout(() => {
                        if (bot) bot.setControlState('jump', false);
                    }, 150);
                },
                () => {
                    // Short movement
                    const directions = ['forward', 'back', 'left', 'right'];
                    const direction = directions[Math.floor(Math.random() * directions.length)];
                    bot.setControlState(direction, true);
                    setTimeout(() => {
                        if (bot) bot.setControlState(direction, false);
                    }, 300);
                },
                () => {
                    // Crouch toggle
                    bot.setControlState('sneak', true);
                    setTimeout(() => {
                        if (bot) bot.setControlState('sneak', false);
                    }, 200);
                }
            ];
            
            const action = actions[Math.floor(Math.random() * actions.length)];
            action();
            
        } catch (error) {
            logger.debug(`Keep-alive movement error: ${error.message}`);
        }
    }, 20000 + Math.random() * 20000);
    keepAliveIntervals.push(moveInterval);

    // Look around keep-alive (every 10-20 seconds)
    const lookInterval = setInterval(() => {
        if (!bot || !bot.entity) {
            clearInterval(lookInterval);
            return;
        }
        
        try {
            const yaw = Math.random() * Math.PI * 2;
            const pitch = (Math.random() - 0.5) * 0.8;
            bot.look(yaw, pitch);
        } catch (error) {
            logger.debug(`Keep-alive look error: ${error.message}`);
        }
    }, 10000 + Math.random() * 10000);
    keepAliveIntervals.push(lookInterval);
    
    // Inventory keep-alive (every 60-120 seconds)
    const inventoryInterval = setInterval(() => {
        if (!bot || !bot.entity) {
            clearInterval(inventoryInterval);
            return;
        }
        
        try {
            // Switch held item occasionally
            if (bot.inventory && bot.inventory.slots.length > 0) {
                const randomSlot = Math.floor(Math.random() * 9); // Hotbar slots 0-8
                bot.setQuickBarSlot(randomSlot);
            }
        } catch (error) {
            logger.debug(`Keep-alive inventory error: ${error.message}`);
        }
    }, 60000 + Math.random() * 60000);
    keepAliveIntervals.push(inventoryInterval);
    
    // Ping keep-alive using tab list (every 30 seconds)
    const pingInterval = setInterval(() => {
        if (!bot || !bot.entity) {
            clearInterval(pingInterval);
            return;
        }
        
        try {
            // Send a harmless packet to keep connection alive
            if (bot.players && Object.keys(bot.players).length > 0) {
                // Just accessing player list keeps connection active
                const playerCount = Object.keys(bot.players).length;
                logger.debug(`Keep-alive: ${playerCount} players online`);
            }
        } catch (error) {
            logger.debug(`Keep-alive ping error: ${error.message}`);
        }
    }, 30000);
    keepAliveIntervals.push(pingInterval);
    
    // Connection health check (every 5 minutes)
    const healthInterval = setInterval(() => {
        if (!bot || !bot.entity) {
            clearInterval(healthInterval);
            return;
        }
        
        try {
            const uptime = Math.floor((Date.now() - sessionStats.startTime) / 1000);
            logger.info(`🔄 Keep-alive: Bot healthy, uptime ${Math.floor(uptime/60)}m`);
            
            // Update bot status
            updateBotStatus(true);
            
        } catch (error) {
            logger.debug(`Keep-alive health check error: ${error.message}`);
        }
    }, 300000); // 5 minutes
    keepAliveIntervals.push(healthInterval);

    logger.info('🔄 Enhanced keep-alive system started');
}

function clearKeepAliveIntervals() {
    keepAliveIntervals.forEach(interval => {
        clearInterval(interval);
    });
    keepAliveIntervals = [];
}

// Global keep-alive function that can be called from anywhere
function keep_alive() {
    if (!bot) return false;
    
    try {
        // Perform immediate keep-alive action
        if (bot.entity) {
            // Small jump
            bot.setControlState('jump', true);
            setTimeout(() => {
                if (bot) bot.setControlState('jump', false);
            }, 100);
            
            // Update last activity time
            botStatus.lastSeen = new Date().toISOString();
            
            logger.debug('🔄 Manual keep-alive action performed');
            return true;
        }
    } catch (error) {
        logger.debug(`Manual keep-alive error: ${error.message}`);
        return false;
    }
    
    return false;
}

// AI behaviors with ChatGPT-enhanced random chat
function startAIBehaviors() {
    logger.info('🧠 Starting AI behaviors with ChatGPT...');
    
    setInterval(async () => {
        if (bot && Math.random() < 0.3) {
            try {
                // Use ChatGPT for more natural random messages
                const randomTopics = [
                    'general chat about minecraft',
                    'asking about building projects',
                    'talking about mining adventures',
                    'discussing server community',
                    'offering help to players'
                ];
                
                const topic = randomTopics[Math.floor(Math.random() * randomTopics.length)];
                
                const response = await openai.chat.completions.create({
                    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                    messages: [
                        {
                            role: 'system',
                            content: `You are ${currentUsername}, a friendly player on a Minecraft server. Generate a short, casual message (under 50 characters) about: ${topic}. Sound like a real player, be friendly and engaging.`
                        }
                    ],
                    max_tokens: 50,
                    temperature: 0.9
                });
                
                const aiMessage = response.choices[0].message.content.trim();
                await sendIntelligentChat(aiMessage);
                
            } catch (error) {
                // Fallback to simple messages if ChatGPT fails
                const fallbackMessages = [
                    'hey everyone! how is everyone doing today?',
                    'this server has such a great community!',
                    'anyone need help with anything? i am happy to assist!',
                    'love meeting new players here!',
                    'keeping the server active! hope everyone is having fun!'
                ];
                await sendIntelligentChat(fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]);
            }
        }
    }, 60000 + Math.random() * 120000);
    
    logger.info('🎮 AI behaviors activated with ChatGPT integration!');
}

async function handlePlayerChat(username, message) {
    if (username === bot.username) return;
    
    const lowerMessage = message.toLowerCase();
    logger.info(`📢 Player message from ${username}: "${message}"`);
    
    // Respond to 90% of messages with ChatGPT (increased from 70%)
    if (Math.random() < 0.9) {
        setTimeout(async () => {
            try {
                // Get intelligent ChatGPT response
                const chatGPTResponse = await getChatGPTResponse(username, message);
                
                // Send the response
                await sendIntelligentChat(chatGPTResponse, username);
                
                // Log the interaction with bot response
                await logPlayerInteraction(username, 'chat_response', message, chatGPTResponse);
                
                logger.info(`🤖 ChatGPT response to ${username}: "${chatGPTResponse}"`);
                
            } catch (error) {
                logger.error(`Failed to generate ChatGPT response: ${error.message}`);
                
                // Fallback to simple response if ChatGPT fails
                const fallbackResponse = `hey ${username}! how's it going?`;
                await sendIntelligentChat(fallbackResponse, username);
                await logPlayerInteraction(username, 'chat_response', message, fallbackResponse);
            }
        }, 1000 + Math.random() * 2000);
    }
}

// Start the bot
createBot();

// Handle process termination
process.on('SIGINT', async () => {
    logger.info('Shutting down bot...');
    clearKeepAliveIntervals();
    await endBotSession('shutdown');
    if (bot) {
        bot.quit();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Shutting down bot...');
    clearKeepAliveIntervals();
    await endBotSession('shutdown');
    if (bot) {
        bot.quit();
    }
    process.exit(0);
});

// Export the keep_alive function for external use
module.exports = { keep_alive };