const mineflayer = require('mineflayer');

// Minimal test to identify exact authentication issue
console.log('🧪 Testing minimal bot connection to GANG_WARS.aternos.me:50466');

const bot = mineflayer.createBot({
    host: 'GANG_WARS.aternos.me',
    port: 50466,
    username: 'TestBot_' + Date.now(),
    auth: 'offline',
    version: false // auto-detect
});

bot.on('connect', () => {
    console.log('✅ TCP connection established');
});

bot.on('login', () => {
    console.log('✅ LOGIN SUCCESS! Bot logged in successfully!');
    console.log('🎉 The server authentication is working!');
    bot.quit();
    process.exit(0);
});

bot.on('spawn', () => {
    console.log('✅ SPAWN SUCCESS! Bot spawned in the world!');
    bot.quit();
    process.exit(0);
});

bot.on('error', (err) => {
    console.log(`❌ Error: ${err.message}`);
    console.log(`Error code: ${err.code || 'N/A'}`);
    
    if (err.message.includes('ECONNREFUSED')) {
        console.log('🔴 Server is offline or refusing connections');
    } else if (err.message.includes('ENOTFOUND')) {
        console.log('🔴 Server hostname cannot be resolved');
    } else if (err.message.includes('timeout')) {
        console.log('🔴 Connection or authentication timeout');
    } else {
        console.log('🔴 Other authentication/protocol error');
    }
    
    process.exit(1);
});

bot.on('end', (reason) => {
    console.log(`🔌 Disconnected: ${reason}`);
    process.exit(1);
});

bot.on('kicked', (reason) => {
    console.log(`👢 Kicked: ${reason}`);
    process.exit(1);
});

// Timeout after 60 seconds
setTimeout(() => {
    console.log('⏰ Test timeout - no login after 60 seconds');
    console.log('❌ Authentication is failing - server may have specific requirements');
    bot.quit();
    process.exit(1);
}, 60000);

console.log('⏳ Testing connection and authentication...');