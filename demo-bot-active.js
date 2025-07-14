#!/usr/bin/env node

// Demo script to show "Bot Active" status in preview
const http = require('http');

// Simulate active bot status
let botStatus = {
    isRunning: true,
    lastSeen: new Date().toISOString(),
    currentUsername: 'AIPlayer',
    serverHost: 'GANG_WARS.aternos.me',
    serverPort: 50466,
    uptime: Date.now() - 180000, // 3 minutes ago
    totalSessions: 1,
    totalChatMessages: 8,
    totalPlayersInteracted: 3,
    arrivedAt: new Date(Date.now() - 120000), // 2 minutes ago
    hasArrived: true
};

const webPort = 5002;

const webServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = req.url;
    const now = new Date();
    
    if (url === '/' || url === '/health') {
        res.writeHead(200, { 
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        
        const uptimeHours = Math.floor((Date.now() - botStatus.uptime) / (1000 * 60 * 60));
        const uptimeMinutes = Math.floor((Date.now() - botStatus.uptime) / (1000 * 60)) % 60;
        
        const response = `
<!DOCTYPE html>
<html>
<head>
    <title>Bot Active Demo - Minecraft Bot Monitor</title>
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
            animation: pulse 2s infinite;
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
        
        <div class="bot-arrived">🎉 Bot Has Arrived! 🎉</div>
        
        <div class="status">
            🟢 Bot Active
        </div>
        
        <div class="info">
            <strong>Bot:</strong> ${botStatus.currentUsername}<br>
            <strong>Server:</strong> ${botStatus.serverHost}:${botStatus.serverPort}<br>
            <strong>Uptime:</strong> ${uptimeHours}h ${uptimeMinutes}m<br>
            <strong>Arrived:</strong> ${botStatus.arrivedAt.toLocaleString()}<br>
            <strong>Status:</strong> Connected and Active<br>
            <strong>Last Update:</strong> ${now.toLocaleString()}
        </div>
        
        <p style="background: rgba(0,255,0,0.2); padding: 15px; border-radius: 10px; margin: 20px 0;">
            <strong>✅ DEMO: This shows how the preview looks when bot is active</strong><br>
            - Green "Bot Active" status<br>
            - "Bot Has Arrived" message with glow animation<br>
            - Connected bot username and arrival time
        </p>
    </div>
</body>
</html>`;
        
        res.end(response);
        return;
    }
    
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Demo Server - Access /health to see Bot Active status');
});

webServer.listen(webPort, '0.0.0.0', () => {
    console.log(`🌐 Demo server running on port ${webPort}`);
    console.log(`📊 Demo URL: http://localhost:${webPort}/health`);
    console.log('This shows how "Bot Active" appears when bot is connected');
});

process.on('SIGINT', () => {
    console.log('\nShutting down demo server...');
    webServer.close();
    process.exit(0);
});