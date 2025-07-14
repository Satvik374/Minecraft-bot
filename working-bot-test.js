const mineflayer = require('mineflayer');

// Reproduce the exact configuration that worked in the version test
console.log('🔧 Testing exact working configuration...');

const bot = mineflayer.createBot({
    host: 'GANG_WARS.aternos.me',
    port: 50466,
    username: 'AIPlayer_' + Date.now(),
    auth: 'offline',
    version: '1.20.6',
    hideErrors: false
});

bot.on('connect', () => {
    console.log('✅ TCP connection established');
});

bot.on('login', () => {
    console.log('✅ LOGIN SUCCESS! Bot authenticated successfully!');
    console.log('🎉 The bot will now show as ACTIVE in preview!');
    
    // Test basic functionality
    setTimeout(() => {
        try {
            bot.chat('Hello! Bot is now active and working!');
            console.log('✅ Chat message sent successfully');
        } catch (error) {
            console.log('❌ Chat failed but login successful');
        }
    }, 2000);
    
    // Keep connected for a moment to verify
    setTimeout(() => {
        console.log('✅ Test complete - authentication working');
        bot.quit();
        process.exit(0);
    }, 10000);
});

bot.on('spawn', () => {
    console.log('✅ SPAWN SUCCESS! Bot is in the game world!');
});

bot.on('error', (err) => {
    console.log(`❌ Error: ${err.message}`);
    process.exit(1);
});

bot.on('end', (reason) => {
    console.log(`🔌 Disconnected: ${reason}`);
});

bot.on('kicked', (reason) => {
    console.log(`👢 Kicked: ${reason}`);
    process.exit(1);
});

setTimeout(() => {
    console.log('⏰ Test timeout after 30 seconds');
    bot.quit();
    process.exit(1);
}, 30000);