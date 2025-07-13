#!/usr/bin/env node

const http = require('http');
const logger = require('./utils/logger');

// Web server for UptimeRobot monitoring
const PORT = process.env.PORT || 5000;
let botStatus = {
    isRunning: false,
    lastSeen: null,
    currentUsername: 'Not connected',
    serverHost: process.env.MINECRAFT_HOST || 'Unknown',
    serverPort: process.env.MINECRAFT_PORT || 'Unknown',
    uptime: Date.now()
};

// Update bot status (called from main bot)
function updateBotStatus(username, isConnected) {
    botStatus.isRunning = isConnected;
    botStatus.lastSeen = new Date().toISOString();
    botStatus.currentUsername = username || 'Unknown';
}

// Simple HTTP server for UptimeRobot
const server = http.createServer((req, res) => {
    // Enable CORS
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
    
    // Main status endpoint for UptimeRobot
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
    
    // Health check endpoint
    if (url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
        return;
    }
    
    // Ping endpoint
    if (url === '/ping') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('pong');
        return;
    }
    
    // Web interface
    if (url === '/dashboard') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Minecraft Bot Monitor</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .status { padding: 20px; border-radius: 8px; margin: 10px 0; }
        .online { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .offline { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .info { background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🤖 Minecraft Bot Status</h1>
    <div class="status ${botStatus.isRunning ? 'online' : 'offline'}">
        <h2>Bot Status: ${botStatus.isRunning ? '🟢 ONLINE' : '🔴 OFFLINE'}</h2>
        <p><strong>Username:</strong> ${botStatus.currentUsername}</p>
        <p><strong>Server:</strong> ${botStatus.serverHost}:${botStatus.serverPort}</p>
        <p><strong>Last Seen:</strong> ${botStatus.lastSeen || 'Never'}</p>
        <p><strong>Uptime:</strong> ${Math.floor((Date.now() - botStatus.uptime) / (1000 * 60 * 60))}h ${Math.floor((Date.now() - botStatus.uptime) / (1000 * 60)) % 60}m</p>
    </div>
    
    <div class="info">
        <h3>📊 UptimeRobot Monitoring</h3>
        <p>Use this URL in UptimeRobot: <code>${req.headers.host ? `https://${req.headers.host}/health` : 'https://your-replit-url.replit.app/health'}</code></p>
        <p>Monitor Type: HTTP(s)</p>
        <p>Check Interval: 5 minutes</p>
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
    res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🌐 Web server running on port ${PORT}`);
    logger.info(`📊 UptimeRobot URL: https://your-replit-url.replit.app/health`);
    logger.info(`🖥️  Dashboard: https://your-replit-url.replit.app/dashboard`);
});

// Handle server errors
server.on('error', (err) => {
    logger.error(`Web server error: ${err.message}`);
});

module.exports = { updateBotStatus };