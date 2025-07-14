// Manual movement test for connected bot
const mineflayer = require('mineflayer');

console.log('🎮 Manual Movement Test');
console.log('This will test movement patterns immediately when bot connects');

const bot = mineflayer.createBot({
    host: process.env.MINECRAFT_HOST || 'GANG_WARS.aternos.me',
    port: parseInt(process.env.MINECRAFT_PORT) || 50466,
    username: 'MovementTest' + Math.floor(Math.random() * 1000),
    version: '1.20.1',
    auth: 'offline',
    timeout: 30000
});

bot.on('login', () => {
    console.log('✅ Connected! Waiting for spawn...');
});

bot.on('spawn', () => {
    console.log('🌍 Spawned! Starting movement tests...');
    
    let testCount = 0;
    
    // Test 1: Jump
    setTimeout(() => {
        console.log('Test 1: Jump');
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
        testCount++;
    }, 1000);
    
    // Test 2: Forward movement
    setTimeout(() => {
        console.log('Test 2: Forward movement for 3 seconds');
        bot.setControlState('forward', true);
        setTimeout(() => bot.setControlState('forward', false), 3000);
        testCount++;
    }, 3000);
    
    // Test 3: Sprint + left movement
    setTimeout(() => {
        console.log('Test 3: Sprint left for 3 seconds');
        bot.setControlState('left', true);
        bot.setControlState('sprint', true);
        setTimeout(() => {
            bot.setControlState('left', false);
            bot.setControlState('sprint', false);
        }, 3000);
        testCount++;
    }, 8000);
    
    // Test 4: Camera movement
    setTimeout(() => {
        console.log('Test 4: Camera movement');
        bot.look(Math.PI, 0); // Look behind
        setTimeout(() => bot.look(0, 0), 1000); // Look forward
        testCount++;
    }, 13000);
    
    // Test 5: Multiple jumps
    setTimeout(() => {
        console.log('Test 5: Multiple jumps');
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 200);
            }, i * 800);
        }
        testCount++;
    }, 16000);
    
    // Summary
    setTimeout(() => {
        console.log(`✅ Movement tests completed! (${testCount}/5 tests run)`);
        console.log('🎮 If you saw the bot moving, the movement system works!');
        console.log('🔄 The main bot will use these same movement patterns automatically');
        bot.quit();
        process.exit(0);
    }, 22000);
});

bot.on('error', (err) => {
    console.log(`❌ Connection failed: ${err.message}`);
    console.log('💡 Make sure your Minecraft server is online and accessible');
    process.exit(1);
});

bot.on('end', () => {
    console.log('🔌 Disconnected from server');
});

// Timeout after 60 seconds
setTimeout(() => {
    console.log('⏰ Test timeout - couldn\'t connect to server');
    bot.quit();
    process.exit(1);
}, 60000);