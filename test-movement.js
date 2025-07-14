const mineflayer = require('mineflayer');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console()
    ]
});

// Test movement patterns - works with any Minecraft server
function testMovementPatterns() {
    console.log('='.repeat(50));
    console.log('🤖 Minecraft Bot Movement Pattern Test');
    console.log('='.repeat(50));
    console.log('📋 Testing movement patterns without server connection:');
    console.log('🎮 Movement: 3s random direction/sprint every 5s');
    console.log('🦘 Jump: Every 15 seconds');
    console.log('👀 Camera: Every 2 seconds');
    console.log('');
    
    let intervals = [];
    let bot = {
        entity: { position: { x: 0, y: 64, z: 0 } },
        setControlState: (control, state) => {
            if (state) {
                logger.info(`🎮 Control: ${control} ON`);
            } else {
                logger.info(`🎮 Control: ${control} OFF`);
            }
        },
        look: (yaw, pitch) => {
            const yawDegrees = Math.round(yaw * 180 / Math.PI);
            const pitchDegrees = Math.round(pitch * 180 / Math.PI);
            logger.info(`👀 Camera: Look yaw=${yawDegrees}° pitch=${pitchDegrees}°`);
        }
    };
    
    // Movement Pattern: 3 seconds random movement/sprint every 5 seconds
    const moveInterval = setInterval(() => {
        const movements = ['forward', 'back', 'left', 'right'];
        const randomMovement = movements[Math.floor(Math.random() * movements.length)];
        const shouldSprint = Math.random() > 0.5;
        
        // Start movement
        bot.setControlState(randomMovement, true);
        if (shouldSprint) {
            bot.setControlState('sprint', true);
            logger.info(`🏃 Movement: Sprint ${randomMovement} for 3 seconds`);
        } else {
            logger.info(`🚶 Movement: Move ${randomMovement} for 3 seconds`);
        }
        
        // Stop movement after 3 seconds
        setTimeout(() => {
            bot.setControlState(randomMovement, false);
            if (shouldSprint) {
                bot.setControlState('sprint', false);
            }
        }, 3000);
    }, 5000); // Every 5 seconds
    intervals.push(moveInterval);

    // Jump Pattern: Every 15 seconds
    const jumpInterval = setInterval(() => {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
        logger.info('🦘 Jump executed');
    }, 15000); // Every 15 seconds
    intervals.push(jumpInterval);

    // Camera Movement: Every 2 seconds
    const lookInterval = setInterval(() => {
        const yaw = Math.random() * Math.PI * 2; // Random direction
        const pitch = (Math.random() - 0.5) * 0.6; // Random up/down
        bot.look(yaw, pitch);
    }, 2000); // Every 2 seconds
    intervals.push(lookInterval);
    
    logger.info('🔄 Movement pattern test started - will run for 30 seconds');
    
    // Stop test after 30 seconds
    setTimeout(() => {
        intervals.forEach(interval => clearInterval(interval));
        logger.info('✅ Movement pattern test completed');
        console.log('');
        console.log('📝 To test with a real server:');
        console.log('1. Find a public Minecraft server (like mc.hypixel.net)');
        console.log('2. Update MINECRAFT_HOST and MINECRAFT_PORT in your environment');
        console.log('3. Restart the bot - movement will activate when it connects');
        console.log('');
        process.exit(0);
    }, 30000);
}

// Test with a demo server connection (optional)
function testWithDemoServer() {
    console.log('🌍 Testing connection to demo server...');
    
    const bot = mineflayer.createBot({
        host: 'mc.hypixel.net', // Public server for testing
        port: 25565,
        username: 'TestBot' + Math.floor(Math.random() * 1000),
        version: '1.20.1',
        auth: 'offline'
    });

    bot.on('login', () => {
        logger.info('✅ Connected to demo server!');
        logger.info('🎮 Movement patterns will now activate...');
        
        // Start movement patterns on successful connection
        testMovementPatterns();
    });

    bot.on('error', (err) => {
        logger.error(`❌ Connection failed: ${err.message}`);
        logger.info('🔄 Running movement test without server connection instead...');
        testMovementPatterns();
    });

    // Timeout if can't connect in 10 seconds
    setTimeout(() => {
        if (!bot.player) {
            logger.warn('⏰ Connection timeout - running offline test');
            bot.end();
            testMovementPatterns();
        }
    }, 10000);
}

// Run the test
if (process.argv.includes('--demo-server')) {
    testWithDemoServer();
} else {
    testMovementPatterns();
}