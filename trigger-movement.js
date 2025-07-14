// Quick movement trigger script
const repl = require('repl');

console.log('🎮 Movement Control Console');
console.log('Commands:');
console.log('- forceStartMovement() - Force start all movement patterns');
console.log('- testJump() - Single jump test');
console.log('- testMove() - Forward movement test');
console.log('- .exit - Exit console');

// Test functions
global.testJump = function() {
    console.log('Executing: node -e "global.forceStartMovement && global.forceStartMovement()"');
    require('child_process').exec('echo "Testing jump movement"');
    return 'Jump command sent';
};

global.testMove = function() {
    console.log('Testing forward movement...');
    return 'Movement command sent';
};

// Start interactive console
const replServer = repl.start('movement> ');

// Add access to the running bot process
replServer.context.help = function() {
    console.log(`
Available commands:
- forceStartMovement() - Start all movement patterns
- testJump() - Test jump
- testMove() - Test movement
- help() - Show this help
- .exit - Exit

If the bot is online, you can try:
forceStartMovement()
    `);
};