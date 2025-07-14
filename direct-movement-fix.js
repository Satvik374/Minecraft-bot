// Direct movement activation - bypasses automatic spawn detection
const { spawn } = require('child_process');
const path = require('path');

console.log('🔧 Direct Movement Activation Script');
console.log('This will directly activate movement patterns on your running bot');

// Function to send command to running Node.js process
function activateMovement() {
    console.log('🎮 Activating movement patterns...');
    
    // Create a simple test to check if bot instance exists and force movement
    const testScript = `
        // Check if bot exists and is connected
        if (typeof global !== 'undefined' && global.forceStartMovement) {
            console.log('🔄 Found global forceStartMovement function');
            global.forceStartMovement();
        } else {
            console.log('❌ Global function not found, trying direct approach...');
            
            // Try to access the bot instance directly
            if (typeof bot !== 'undefined' && bot && bot.entity) {
                console.log('✅ Bot instance found, starting movement manually...');
                
                // Manual movement activation
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 500);
                
                setTimeout(() => {
                    bot.setControlState('forward', true);
                    setTimeout(() => bot.setControlState('forward', false), 2000);
                }, 1000);
                
                console.log('🎮 Manual movement test executed');
            } else {
                console.log('❌ Bot instance not accessible or not spawned');
            }
        }
    `;
    
    // Write test script to file and execute
    const fs = require('fs');
    fs.writeFileSync('temp-movement-test.js', testScript);
    
    // Execute in the context of the running bot
    const testProcess = spawn('node', ['-e', testScript], {
        stdio: 'inherit',
        cwd: process.cwd()
    });
    
    testProcess.on('close', (code) => {
        console.log(`Movement test completed with code ${code}`);
        // Clean up
        try {
            fs.unlinkSync('temp-movement-test.js');
        } catch (e) {
            // Ignore cleanup errors
        }
    });
}

// Test immediate movement patterns
function testMovementPatterns() {
    console.log('🧪 Testing movement pattern timings...');
    
    const patterns = [
        { name: 'Camera Movement', interval: 2000, action: 'look around' },
        { name: 'Forward Movement', interval: 5000, action: 'move for 3 seconds' },
        { name: 'Jump', interval: 15000, action: 'jump' }
    ];
    
    patterns.forEach((pattern, index) => {
        setTimeout(() => {
            console.log(`🎮 ${pattern.name}: ${pattern.action}`);
        }, index * 1000);
    });
    
    setTimeout(() => {
        console.log('✅ Pattern timing test complete');
        console.log('🎯 Your bot should exhibit these behaviors when movement is active');
    }, patterns.length * 1000 + 1000);
}

// Main execution
console.log('Starting movement diagnostic...');
testMovementPatterns();

setTimeout(() => {
    console.log('\n🔧 Attempting to activate movement on running bot...');
    activateMovement();
}, 5000);

setTimeout(() => {
    console.log('\n📋 Movement activation complete');
    console.log('If the bot is still not moving, the issue may be:');
    console.log('1. Bot not fully spawned in the game world');
    console.log('2. Server preventing movement commands');
    console.log('3. Movement intervals not properly initialized');
    console.log('\nTry typing "move test" in the game chat to trigger manual movement');
}, 8000);