const mineflayer = require('mineflayer');

// Test specific versions that work well with Aternos servers
const versionsToTest = ['1.20.6', '1.20.4', '1.19.2', '1.16.5'];

async function testVersion(version) {
    return new Promise((resolve) => {
        console.log(`\n🔧 Testing Minecraft version: ${version}`);
        
        const bot = mineflayer.createBot({
            host: 'GANG_WARS.aternos.me',
            port: 50466,
            username: 'TestBot_' + Math.floor(Math.random() * 1000),
            auth: 'offline',
            version: version,
            hideErrors: true
        });

        let resolved = false;

        bot.on('login', () => {
            console.log(`✅ SUCCESS! Version ${version} works!`);
            if (!resolved) {
                resolved = true;
                bot.quit();
                resolve({ success: true, version });
            }
        });

        bot.on('error', (err) => {
            if (!resolved) {
                resolved = true;
                console.log(`❌ Version ${version} failed: ${err.message.substring(0, 100)}`);
                resolve({ success: false, version, error: err.message });
            }
        });

        bot.on('kicked', (reason) => {
            if (!resolved) {
                resolved = true;
                console.log(`❌ Version ${version} kicked: ${reason.substring ? reason.substring(0, 100) : reason}`);
                resolve({ success: false, version, error: 'kicked' });
            }
        });

        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                console.log(`⏰ Version ${version} timeout`);
                bot.quit();
                resolve({ success: false, version, error: 'timeout' });
            }
        }, 15000);
    });
}

async function findWorkingVersion() {
    console.log('🔍 Finding compatible Minecraft version for GANG_WARS.aternos.me:50466\n');
    
    for (const version of versionsToTest) {
        const result = await testVersion(version);
        if (result.success) {
            console.log(`\n🎉 FOUND WORKING VERSION: ${version}`);
            console.log('✅ This version will be used for the main bot');
            return version;
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
    }
    
    console.log('\n❌ No compatible version found in test set');
    return null;
}

if (require.main === module) {
    findWorkingVersion().then((workingVersion) => {
        if (workingVersion) {
            console.log(`\n🔧 Use version ${workingVersion} in the main bot configuration`);
        } else {
            console.log('\n🔍 Server may be offline or requires different authentication');
        }
        process.exit(0);
    });
}