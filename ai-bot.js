#!/usr/bin/env node

const mineflayer = require('mineflayer');
const logger = require('./utils/logger');

console.log('='.repeat(60));
console.log('🤖 AI Minecraft Bot - Advanced Player Simulation');
console.log('='.repeat(60));

// Parse command line arguments
const args = process.argv.slice(2);
const serverHost = args[0] || process.env.MINECRAFT_HOST || 'localhost';
const serverPort = parseInt(args[1]) || parseInt(process.env.MINECRAFT_PORT) || 25565;
const username = args[2] || process.env.MINECRAFT_USERNAME || 'AIPlayer';

console.log(`🎯 Target Server: ${serverHost}:${serverPort}`);
console.log(`👤 AI Bot Username: ${username}`);
console.log('');

let bot = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;

// AI Bot State
let botState = {
    currentTask: 'exploring',
    inventory: {},
    hasWood: false,
    hasCraftingTable: false,
    hasPickaxe: false,
    isMoving: false,
    lastChatTime: 0,
    targetPlayer: null,
    goals: ['gather_wood', 'craft_table', 'craft_pickaxe', 'mine_stone']
};

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

    logger.info('Creating AI bot instance...');
    bot = mineflayer.createBot(botOptions);
    
    bot.on('login', () => {
        logger.info(`✅ AI Bot logged in successfully!`);
        logger.info(`🌍 Connected to ${serverHost}:${serverPort}`);
        reconnectAttempts = 0;
        
        console.log('');
        console.log('🤖 AI Bot is now online and ready to play!');
        console.log('🎮 Bot will behave like a real intelligent player...');
        console.log('');
        console.log('Press Ctrl+C to stop the bot');
        console.log('='.repeat(60));
    });

    bot.on('spawn', () => {
        logger.info(`AI Bot spawned at ${bot.entity.position}`);
        
        // Initialize AI behaviors
        setTimeout(() => {
            startAIBehaviors();
        }, 2000);
    });

    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        logger.info(`<${username}> ${message}`);
        handlePlayerChat(username, message);
    });

    bot.on('playerJoined', (player) => {
        logger.info(`${player.username} joined the game`);
        // Greet new players
        setTimeout(() => {
            sendIntelligentChat(`welcome ${player.username}! nice to see you here`);
        }, 2000 + Math.random() * 3000);
    });

    bot.on('health', () => {
        if (bot.health !== undefined && bot.health < 10) {
            logger.warn('Low health detected, seeking food or safety');
            botState.currentTask = 'seek_food';
        }
    });

    bot.on('error', (err) => {
        logger.error(`❌ AI Bot error: ${err.message}`);
        scheduleReconnect();
    });

    bot.on('end', (reason) => {
        logger.warn(`🔌 AI Bot disconnected: ${reason}`);
        scheduleReconnect();
    });

    bot.on('kicked', (reason) => {
        logger.warn(`👢 AI Bot was kicked: ${reason}`);
        scheduleReconnect();
    });

    return bot;
}

function startAIBehaviors() {
    logger.info('🧠 Starting AI behaviors...');
    
    // Main AI loop - makes decisions every 3-8 seconds
    setInterval(aiDecisionLoop, 3000 + Math.random() * 5000);
    
    // Movement and exploration
    setInterval(intelligentMovement, 2000);
    
    // Look around naturally
    setInterval(naturalLooking, 5000 + Math.random() * 10000);
    
    // Chat behavior
    setInterval(randomChatting, 30000 + Math.random() * 60000);
    
    // Inventory management
    setInterval(manageInventory, 15000);
    
    logger.info('🎮 AI behaviors activated!');
}

function aiDecisionLoop() {
    if (!bot || !bot.entity) return;
    
    updateBotState();
    
    switch (botState.currentTask) {
        case 'exploring':
            exploreWorld();
            break;
        case 'gather_wood':
            gatherWood();
            break;
        case 'craft_table':
            craftCraftingTable();
            break;
        case 'craft_pickaxe':
            craftPickaxe();
            break;
        case 'mine_stone':
            mineStone();
            break;
        case 'follow_player':
            followTargetPlayer();
            break;
        case 'seek_food':
            seekFood();
            break;
        default:
            botState.currentTask = 'exploring';
    }
}

function updateBotState() {
    if (!bot) return;
    
    const inventory = bot.inventory.items();
    botState.hasWood = inventory.some(item => 
        item.name.includes('log') || item.name.includes('wood'));
    botState.hasCraftingTable = inventory.some(item => 
        item.name === 'crafting_table');
    botState.hasPickaxe = inventory.some(item => 
        item.name.includes('pickaxe'));
    
    // Update current goal based on progress
    if (!botState.hasWood && !botState.goals.includes('gather_wood')) {
        botState.currentTask = 'gather_wood';
    } else if (botState.hasWood && !botState.hasCraftingTable) {
        botState.currentTask = 'craft_table';
    } else if (botState.hasCraftingTable && !botState.hasPickaxe) {
        botState.currentTask = 'craft_pickaxe';
    } else if (botState.hasPickaxe) {
        botState.currentTask = 'mine_stone';
    }
}

async function gatherWood() {
    logger.debug('🌳 Looking for wood to gather...');
    
    const trees = bot.findBlocks({
        matching: [
            bot.registry.blocksByName.oak_log?.id,
            bot.registry.blocksByName.birch_log?.id,
            bot.registry.blocksByName.spruce_log?.id,
            bot.registry.blocksByName.jungle_log?.id,
        ].filter(id => id !== undefined),
        maxDistance: 32,
        count: 10
    });
    
    if (trees.length > 0) {
        const targetLog = trees[0];
        logger.info(`🔨 Punching tree at ${targetLog}`);
        
        try {
            await bot.lookAt(targetLog);
            const block = bot.blockAt(targetLog);
            if (block) {
                await bot.dig(block);
                sendIntelligentChat('getting some wood for crafting');
                
                // Look for more logs nearby
                setTimeout(() => {
                    if (Math.random() < 0.7) {
                        gatherWood();
                    }
                }, 1000);
            }
        } catch (error) {
            logger.debug(`Failed to break log: ${error.message}`);
        }
    } else {
        // Move to find trees
        intelligentMovement();
    }
}

async function craftCraftingTable() {
    if (!botState.hasWood) return;
    
    logger.info('🔨 Crafting crafting table...');
    
    try {
        const woodItems = bot.inventory.items().filter(item => 
            item.name.includes('log') || item.name.includes('planks'));
        
        if (woodItems.length > 0) {
            const recipe = bot.recipesFor(bot.registry.itemsByName.crafting_table.id, null, 1, null);
            if (recipe.length > 0) {
                await bot.craft(recipe[0], 1);
                sendIntelligentChat('crafted a crafting table! now i can make better tools');
                botState.hasCraftingTable = true;
            }
        }
    } catch (error) {
        logger.debug(`Failed to craft crafting table: ${error.message}`);
    }
}

async function craftPickaxe() {
    if (!botState.hasCraftingTable) return;
    
    logger.info('⛏️ Trying to craft pickaxe...');
    
    try {
        // First place crafting table if needed
        const craftingTable = bot.inventory.items().find(item => item.name === 'crafting_table');
        if (craftingTable) {
            const position = bot.entity.position.offset(1, 0, 0);
            await bot.equip(craftingTable, 'hand');
            await bot.placeBlock(bot.blockAt(position.offset(0, -1, 0)), position.subtract(bot.entity.position));
        }
        
        // Try to craft wooden pickaxe
        const recipe = bot.recipesFor(bot.registry.itemsByName.wooden_pickaxe?.id, null, 1, null);
        if (recipe.length > 0) {
            await bot.craft(recipe[0], 1);
            sendIntelligentChat('made a pickaxe! time to mine some stone');
            botState.hasPickaxe = true;
        }
    } catch (error) {
        logger.debug(`Failed to craft pickaxe: ${error.message}`);
    }
}

async function mineStone() {
    logger.debug('⛏️ Looking for stone to mine...');
    
    const stones = bot.findBlocks({
        matching: [
            bot.registry.blocksByName.stone?.id,
            bot.registry.blocksByName.cobblestone?.id,
        ].filter(id => id !== undefined),
        maxDistance: 16,
        count: 5
    });
    
    if (stones.length > 0) {
        const targetStone = stones[0];
        
        try {
            await bot.lookAt(targetStone);
            const block = bot.blockAt(targetStone);
            if (block) {
                // Equip pickaxe
                const pickaxe = bot.inventory.items().find(item => item.name.includes('pickaxe'));
                if (pickaxe) {
                    await bot.equip(pickaxe, 'hand');
                }
                
                await bot.dig(block);
                logger.info(`⛏️ Mined ${block.name}`);
                
                if (Math.random() < 0.3) {
                    sendIntelligentChat('mining some stone, making progress!');
                }
            }
        } catch (error) {
            logger.debug(`Failed to mine stone: ${error.message}`);
        }
    } else {
        intelligentMovement();
    }
}

function exploreWorld() {
    if (Math.random() < 0.4) {
        intelligentMovement();
    }
    
    // Random chance to start specific tasks
    if (Math.random() < 0.1) {
        const tasks = ['gather_wood', 'mine_stone'];
        botState.currentTask = tasks[Math.floor(Math.random() * tasks.length)];
    }
}

function intelligentMovement() {
    if (botState.isMoving) return;
    
    botState.isMoving = true;
    
    // Random movement pattern
    const movements = [
        () => {
            bot.setControlState('forward', true);
            setTimeout(() => bot.setControlState('forward', false), 2000 + Math.random() * 3000);
        },
        () => {
            const randomYaw = bot.entity.yaw + (Math.random() - 0.5) * Math.PI;
            bot.look(randomYaw, bot.entity.pitch);
            setTimeout(() => {
                bot.setControlState('forward', true);
                setTimeout(() => bot.setControlState('forward', false), 1500);
            }, 500);
        },
        () => {
            if (bot.entity.onGround && Math.random() < 0.3) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 100);
            }
        }
    ];
    
    const movement = movements[Math.floor(Math.random() * movements.length)];
    movement();
    
    setTimeout(() => {
        botState.isMoving = false;
    }, 3000 + Math.random() * 2000);
}

function naturalLooking() {
    if (!bot || !bot.entity) return;
    
    // Look at nearby players sometimes
    const nearbyPlayers = Object.values(bot.entities).filter(entity => 
        entity.type === 'player' && 
        entity.username !== bot.username &&
        entity.position.distanceTo(bot.entity.position) < 10
    );
    
    if (nearbyPlayers.length > 0 && Math.random() < 0.4) {
        const targetPlayer = nearbyPlayers[0];
        bot.lookAt(targetPlayer.position.offset(0, 1.6, 0));
        logger.debug(`Looking at player: ${targetPlayer.username}`);
    } else {
        // Random looking around
        const randomYaw = bot.entity.yaw + (Math.random() - 0.5) * Math.PI;
        const randomPitch = (Math.random() - 0.5) * Math.PI / 3;
        bot.look(randomYaw, randomPitch);
    }
}

function handlePlayerChat(username, message) {
    const lowerMessage = message.toLowerCase();
    const currentTime = Date.now();
    
    // Don't respond too frequently
    if (currentTime - botState.lastChatTime < 5000) return;
    
    // Intelligent responses
    const responses = {
        'hello': () => `hey ${username}! how are you doing?`,
        'hi': () => `hello ${username}! nice to see you here`,
        'help': () => `what do you need help with ${username}?`,
        'what are you doing': () => getActivityResponse(),
        'follow me': () => {
            botState.targetPlayer = username;
            botState.currentTask = 'follow_player';
            return `sure ${username}, i'll follow you!`;
        },
        'stop': () => {
            botState.currentTask = 'exploring';
            botState.targetPlayer = null;
            return 'okay, back to exploring!';
        },
        'craft': () => 'i love crafting! currently working on making tools',
        'mine': () => 'mining is fun! looking for good spots to dig',
        'build': () => `sounds like a cool project ${username}! what are you building?`
    };
    
    // Check if bot is mentioned
    if (lowerMessage.includes(bot.username.toLowerCase())) {
        setTimeout(() => {
            sendIntelligentChat(`yes ${username}? what can i help you with?`);
        }, 1000 + Math.random() * 2000);
        return;
    }
    
    // Check for keyword responses
    for (const [keyword, responseFunc] of Object.entries(responses)) {
        if (lowerMessage.includes(keyword)) {
            if (Math.random() < 0.6) { // 60% chance to respond
                setTimeout(() => {
                    sendIntelligentChat(responseFunc());
                }, 1500 + Math.random() * 3000);
            }
            break;
        }
    }
}

function getActivityResponse() {
    const activities = {
        'gather_wood': 'looking for trees to punch and get wood',
        'craft_table': 'trying to craft a crafting table',
        'craft_pickaxe': 'working on making a pickaxe',
        'mine_stone': 'mining stone with my pickaxe',
        'exploring': 'just exploring the world and having fun',
        'follow_player': `following ${botState.targetPlayer} around`
    };
    
    return activities[botState.currentTask] || 'just playing minecraft like a normal player!';
}

function randomChatting() {
    if (!bot || Date.now() - botState.lastChatTime < 20000) return;
    
    if (Math.random() < 0.3) { // 30% chance
        const randomMessages = [
            'this server is pretty cool!',
            'anyone want to team up for building?',
            'found any good mining spots lately?',
            'love the community here',
            'minecraft is such a great game',
            'working on improving my building skills',
            'anyone know good places to find resources?',
            'thanks for having such a welcoming server'
        ];
        
        const message = randomMessages[Math.floor(Math.random() * randomMessages.length)];
        sendIntelligentChat(message);
    }
}

function sendIntelligentChat(message) {
    if (!bot || !message) return;
    
    const currentTime = Date.now();
    if (currentTime - botState.lastChatTime < 3000) return; // Prevent spam
    
    try {
        bot.chat(message);
        botState.lastChatTime = currentTime;
        logger.info(`💬 AI Bot: ${message}`);
    } catch (error) {
        logger.debug(`Failed to send chat: ${error.message}`);
    }
}

function followTargetPlayer() {
    if (!botState.targetPlayer) {
        botState.currentTask = 'exploring';
        return;
    }
    
    const targetEntity = Object.values(bot.entities).find(entity => 
        entity.username === botState.targetPlayer
    );
    
    if (targetEntity) {
        const distance = bot.entity.position.distanceTo(targetEntity.position);
        
        if (distance > 3) {
            // Move towards the player
            bot.lookAt(targetEntity.position);
            bot.setControlState('forward', true);
            
            setTimeout(() => {
                bot.setControlState('forward', false);
            }, 1000);
        } else if (distance > 8) {
            // Too far, stop following
            sendIntelligentChat(`${botState.targetPlayer} you're too far! i'll explore on my own`);
            botState.currentTask = 'exploring';
            botState.targetPlayer = null;
        }
    } else {
        // Player not found
        botState.currentTask = 'exploring';
        botState.targetPlayer = null;
    }
}

function seekFood() {
    // Look for food in inventory first
    const food = bot.inventory.items().find(item => 
        item.name.includes('bread') ||
        item.name.includes('apple') ||
        item.name.includes('carrot') ||
        item.name.includes('potato') ||
        item.name.includes('meat') ||
        item.name.includes('fish')
    );
    
    if (food) {
        try {
            bot.equip(food, 'hand').then(() => {
                bot.consume();
                sendIntelligentChat('eating some food to restore health');
                botState.currentTask = 'exploring';
            });
        } catch (error) {
            logger.debug(`Failed to eat food: ${error.message}`);
        }
    } else {
        // Look for food sources
        intelligentMovement();
        if (Math.random() < 0.2) {
            sendIntelligentChat('looking for food, getting a bit hungry');
        }
    }
}

function manageInventory() {
    if (!bot) return;
    
    const inventory = bot.inventory.items();
    logger.debug(`Inventory: ${inventory.length} items`);
    
    // Drop useless items if inventory is full
    if (inventory.length > 30) {
        const uselessItems = inventory.filter(item => 
            item.name.includes('dirt') || 
            item.name.includes('cobblestone') && inventory.filter(i => i.name === item.name).length > 32
        );
        
        if (uselessItems.length > 0) {
            try {
                bot.toss(uselessItems[0].type, null, uselessItems[0].count);
                logger.debug(`Dropped ${uselessItems[0].name}`);
            } catch (error) {
                logger.debug(`Failed to drop item: ${error.message}`);
            }
        }
    }
}

function scheduleReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
        logger.error(`💀 Max reconnection attempts (${maxReconnectAttempts}) reached. Exiting.`);
        console.log('\n❌ AI Bot failed to maintain connection.');
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
    logger.info('🛑 Shutting down AI bot...');
    console.log('AI Bot shutting down gracefully...');
    
    if (bot) {
        bot.quit();
    }
    
    setTimeout(() => {
        console.log('✅ AI Bot shutdown complete. Goodbye!');
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

// Start the AI bot
console.log('🚀 Starting AI bot...');
createBot();