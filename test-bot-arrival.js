#!/usr/bin/env node

// Simple test script to demonstrate "Bot Has arrived" functionality
const http = require('http');

// Simulate bot status when arrived
let botStatus = {
    isRunning: true,
    lastSeen: new Date().toISOString(),
    currentUsername: 'TestBot',
    serverHost: 'GANG_WARS.aternos.me',
    serverPort: 50466,
    uptime: Date.now() - 60000, // 1 minute ago
    totalSessions: 1,
    totalChatMessages: 5,
    totalPlayersInteracted: 2,
    arrivedAt: new Date(),
    hasArrived: true
};

const webPort = 5001;

// Create test web server
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
    
    if (url === '/health' || url === '/ping') {
        res.writeHead(200, { 
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        const keepAliveStatus = true;
        const uptimeHours = Math.floor((Date.now() - botStatus.uptime) / (1000 * 60 * 60));
        const uptimeMinutes = Math.floor((Date.now() - botStatus.uptime) / (1000 * 60)) % 60;
        
        const response = `
<!DOCTYPE html>
<html>
<head>
    <title>Alive! - Minecraft Bot Monitor</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { 
            background: rgba(255,255,255,0.1); 
            padding: 40px; 
            border-radius: 20px; 
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 600px;
        }
        .alive { 
            font-size: 4em; 
            color: #4ade80; 
            font-weight: bold; 
            margin-bottom: 20px;
            text-shadow: 0 0 20px rgba(74, 222, 128, 0.5);
        }
        .bot-arrived { 
            font-size: 3em; 
            color: #fbbf24; 
            font-weight: bold; 
            margin: 20px 0;
            text-shadow: 0 0 15px rgba(251, 191, 36, 0.6);
            animation: glow 2s ease-in-out infinite alternate;
        }
        @keyframes glow {
            from { text-shadow: 0 0 15px rgba(251, 191, 36, 0.6), 0 0 30px rgba(251, 191, 36, 0.4); }
            to { text-shadow: 0 0 25px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.6); }
        }
        .status { 
            font-size: 1.5em; 
            margin: 20px 0;
            color: ${botStatus.isRunning ? '#4ade80' : '#f87171'};
        }
        .info { 
            background: rgba(255,255,255,0.1); 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0;
            font-size: 1.1em;
        }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 15px; 
            margin: 20px 0;
        }
        .stat { 
            background: rgba(255,255,255,0.1); 
            padding: 15px; 
            border-radius: 10px;
        }
        .stat-value { 
            font-size: 2em; 
            font-weight: bold; 
            color: #4ade80;
        }
        .pulse { 
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="alive pulse">Alive!</div>
        
        ${botStatus.hasArrived && botStatus.isRunning ? 
            '<div class="bot-arrived">🎉 Bot Has Arrived! 🎉</div>' : 
            ''
        }
        
        <div class="status">
            ${botStatus.isRunning ? '🟢 Bot Online' : '🔴 Bot Reconnecting'}
        </div>
        
        <div class="info">
            <strong>Bot:</strong> ${botStatus.currentUsername}<br>
            <strong>Server:</strong> ${botStatus.serverHost}:${botStatus.serverPort}<br>
            <strong>Uptime:</strong> ${uptimeHours}h ${uptimeMinutes}m<br>
            ${botStatus.arrivedAt ? `<strong>Arrived:</strong> ${botStatus.arrivedAt.toLocaleString()}<br>` : ''}
            <strong>Status:</strong> Successfully connected and active<br>
            <strong>Last Update:</strong> ${now.toLocaleString()}
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${botStatus.totalSessions}</div>
                <div>Sessions</div>
            </div>
            <div class="stat">
                <div class="stat-value">${botStatus.totalChatMessages}</div>
                <div>Messages</div>
            </div>
            <div class="stat">
                <div class="stat-value">${botStatus.totalPlayersInteracted}</div>
                <div>Players</div>
            </div>
        </div>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
        `;
        
        res.end(response);
        return;
    }
    
    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

// Start test web server
webServer.listen(webPort, '0.0.0.0', () => {
    console.log(`🌐 Test web server running on port ${webPort}`);
    console.log(`📊 Test URL: http://localhost:${webPort}/health`);
    console.log('This demonstrates how "Bot Has arrived" message appears when bot connects successfully');
});

// Keep server running
process.on('SIGINT', () => {
    console.log('\nShutting down test server...');
    webServer.close();
    process.exit(0);
});