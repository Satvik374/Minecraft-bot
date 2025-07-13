#!/usr/bin/env node

const mineflayer = require('mineflayer');
const logger = require('./utils/logger');

console.log('='.repeat(60));
console.log('🤖 Simple Minecraft Bot (Stable Version)');
console.log('='.repeat(60));

// Parse command line arguments
const args = process.argv.slice(2);
const serverHost = args[0] || process.env.MINECRAFT_HOST || 'localhost';
const serverPort = parseInt(args[1]) || parseInt(process.env.MINECRAFT_PORT) || 25565;
const username = args[2] || process.env.MINECRAFT_USERNAME || 'SimpleBot';

console.log(`🎯 Target Server: ${serverHost}:${serverPort}`);
console.log(`👤 Bot Username: ${username}`);
console.log('');

let bot = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;

function createBot() {
    const botOptions = {
        host: serverHost,
        port: serverPort,
        username: username,
        version: '1.20.1',
        auth: 'offline',
        checkTimeoutInterval: 30000,
        keepAlive: true
    };

    logger.info('Creating simple bot instance...');
    bot = mineflayer.createBot(botOptions);
    
    bot.on('login', () => {
        logger.info(`✅ Bot logged in successfully!`);
        logger.info(`🌍 Connected to ${serverHost}:${serverPort}`);
        reconnectAttempts = 0;
        
        console.log('');
        console.log('🤖 Simple bot is now online!');
        console.log('📊 Bot will stay connected and perform basic actions...');
        console.log('');
        console.log('Press Ctrl+C to stop the bot');
        console.log('='.repeat(60));
    });

    bot.on('spawn', () => {
        logger.info(`Bot spawned at ${bot.entity.position}`);
        
        // Simple anti-idle behavior - just look around occasionally
        setInterval(() => {
            if (bot && bot.entity) {
                const randomYaw = Math.random() * Math.PI * 2;
                const randomPitch = (Math.random() - 0.5) * Math.PI / 4;
                bot.look(randomYaw, randomPitch);
                logger.debug('Looking around to prevent idle timeout');
            }
        }, 30000); // Every 30 seconds

        // Simple movement - walk forward occasionally
        setInterval(() => {
            if (bot && bot.entity) {
                if (Math.random() < 0.3) { // 30% chance
                    bot.setControlState('forward', true);
                    setTimeout(() => {
                        if (bot) bot.setControlState('forward', false);
                    }, 2000); // Walk for 2 seconds
                    logger.debug('Walking forward briefly');
                }
            }
        }, 15000); // Every 15 seconds

        // Simple jump occasionally
        setInterval(() => {
            if (bot && bot.entity && bot.entity.onGround && Math.random() < 0.2) {
                bot.setControlState('jump', true);
                setTimeout(() => {
                    if (bot) bot.setControlState('jump', false);
                }, 100);
                logger.debug('Jumping to prevent idle');
            }
        }, 45000); // Every 45 seconds
    });

    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        logger.info(`<${username}> ${message}`);
        
        // Simple responses
        if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
            if (Math.random() < 0.3) {
                setTimeout(() => {
                    bot.chat('hello there!');
                }, 1000 + Math.random() * 2000);
            }
        }
    });

    bot.on('health', () => {
        logger.debug(`Health: ${bot.health || 'N/A'}, Food: ${bot.food || 'N/A'}`);
    });

    bot.on('error', (err) => {
        logger.error(`❌ Bot error: ${err.message}`);
        scheduleReconnect();
    });

    bot.on('end', (reason) => {
        logger.warn(`🔌 Bot disconnected: ${reason}`);
        scheduleReconnect();
    });

    bot.on('kicked', (reason) => {
        logger.warn(`👢 Bot was kicked: ${reason}`);
        scheduleReconnect();
    });

    return bot;
}

function scheduleReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
        logger.error(`💀 Max reconnection attempts (${maxReconnectAttempts}) reached. Exiting.`);
        console.log('\n❌ Bot failed to maintain connection. Please check server details and try again.');
        process.exit(1);
    }

    reconnectAttempts++;
    const delay = Math.min(5000 * reconnectAttempts, 60000);
    
    logger.info(`🔄 Reconnecting in ${delay/1000}s (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
    
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

// Handle process termination gracefully
process.on('SIGINT', () => {
    console.log('\n');
    logger.info('🛑 Received shutdown signal...');
    console.log('Shutting down bot gracefully...');
    
    if (bot) {
        bot.quit();
    }
    
    setTimeout(() => {
        console.log('✅ Bot shutdown complete. Goodbye!');
        process.exit(0);
    }, 1000);
});

process.on('SIGTERM', () => {
    logger.info('🛑 Received SIGTERM, shutting down gracefully...');
    if (bot) {
        bot.quit();
    }
    process.exit(0);
});

// Start the bot
console.log('🚀 Starting simple bot...');
createBot();