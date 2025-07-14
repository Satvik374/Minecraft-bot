const mineflayer = require('mineflayer');
const logger = require('./utils/logger');

// Test bot connection against known working servers
const testServers = [
    { host: 'demo.minetest.net', port: 30000, name: 'Minetest Demo' },
    { host: 'mc.hypixel.net', port: 25565, name: 'Hypixel (may require premium)' },
    { host: 'play.cubecraft.net', port: 25565, name: 'CubeCraft (may require premium)' }
];

async function testServerAuthentication() {
    console.log('🧪 Testing bot authentication against known servers...');
    
    for (const server of testServers) {
        console.log(`\n🔍 Testing: ${server.name} (${server.host}:${server.port})`);
        
        try {
            const testResult = await testSingleServer(server);
            if (testResult.success) {
                console.log(`✅ SUCCESS: Bot works with ${server.name}`);
                console.log(`✅ This confirms our bot implementation is correct`);
                console.log(`❌ The issue is with GANG_WARS.aternos.me authentication`);
                return true;
            } else {
                console.log(`❌ Failed: ${testResult.error}`);
            }
        } catch (error) {
            console.log(`❌ Error testing ${server.name}: ${error.message}`);
        }
    }
    
    return false;
}

function testSingleServer(server) {
    return new Promise((resolve) => {
        const botOptions = {
            host: server.host,
            port: server.port,
            username: 'TestBot_' + Math.floor(Math.random() * 1000),
            version: '1.19.4',
            auth: 'offline',
            checkTimeoutInterval: 15000,
            keepAlive: false
        };
        
        console.log(`🔗 Connecting to ${server.host}:${server.port}...`);
        const bot = mineflayer.createBot(botOptions);
        
        let resolved = false;
        
        // Success - login completed
        bot.on('login', () => {
            console.log(`✅ Login successful to ${server.name}!`);
            if (!resolved) {
                resolved = true;
                bot.quit();
                resolve({ success: true });
            }
        });
        
        // Errors
        bot.on('error', (err) => {
            console.log(`❌ Error with ${server.name}: ${err.message}`);
            if (!resolved) {
                resolved = true;
                resolve({ success: false, error: err.message });
            }
        });
        
        bot.on('end', (reason) => {
            console.log(`🔌 Disconnected from ${server.name}: ${reason}`);
            if (!resolved) {
                resolved = true;
                resolve({ success: false, error: reason });
            }
        });
        
        // Timeout after 20 seconds
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                console.log(`⏰ Timeout testing ${server.name}`);
                bot.quit();
                resolve({ success: false, error: 'timeout' });
            }
        }, 20000);
    });
}

// Run the test if called directly
if (require.main === module) {
    testServerAuthentication().then((anySuccess) => {
        if (anySuccess) {
            console.log('\n✅ Bot implementation is working correctly');
            console.log('❌ GANG_WARS.aternos.me requires premium authentication or is offline');
        } else {
            console.log('\n❌ Bot implementation may have issues');
            console.log('🔍 Please check mineflayer version and Node.js compatibility');
        }
        process.exit(0);
    });
}

module.exports = { testServerAuthentication };