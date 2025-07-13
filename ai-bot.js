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
    lastMined: 0,
    targetPlayer: null,
    isCreativeMode: true, // Creative mode enabled
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
        
        // Try to enable creative mode if possible
        setTimeout(() => {
            if (botState.isCreativeMode) {
                try {
                    bot.chat('/gamemode creative');
                    sendIntelligentChat('switching to creative mode for better building!');
                } catch (error) {
                    logger.debug('Could not set creative mode');
                }
            }
        }, 1000);
        
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
        // Greet new players with variety
        setTimeout(() => {
            const welcomes = [
                `welcome to the server ${player.username}! hope you have fun here!`,
                `hey ${player.username}! welcome! nice to meet you!`,
                `welcome ${player.username}! this is a great server to play on!`,
                `hi ${player.username}! welcome to our community!`,
                `${player.username} welcome! let me know if you need any help!`
            ];
            sendIntelligentChat(welcomes[Math.floor(Math.random() * welcomes.length)]);
        }, 1500 + Math.random() * 2500);
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
    if (!botState.hasWood || botState.hasCraftingTable) return;
    
    logger.info('🔨 Crafting crafting table...');
    
    try {
        // First convert logs to planks if needed
        const logs = bot.inventory.items().filter(item => item.name.includes('log'));
        if (logs.length > 0 && !bot.inventory.items().some(item => item.name.includes('planks'))) {
            const plankRecipe = bot.recipesFor(bot.registry.itemsByName.oak_planks?.id || bot.registry.itemsByName.birch_planks?.id, null, 1, null);
            if (plankRecipe.length > 0) {
                await bot.craft(plankRecipe[0], 4);
                logger.info('🪵 Converted logs to planks');
            }
        }
        
        // Now craft crafting table
        const planks = bot.inventory.items().filter(item => item.name.includes('planks'));
        if (planks.length >= 4) {
            const recipe = bot.recipesFor(bot.registry.itemsByName.crafting_table.id, null, 1, null);
            if (recipe.length > 0) {
                await bot.craft(recipe[0], 1);
                sendIntelligentChat('awesome! just made a crafting table. time to craft some tools!');
                botState.hasCraftingTable = true;
                botState.currentTask = 'craft_pickaxe';
            }
        }
    } catch (error) {
        logger.debug(`Failed to craft crafting table: ${error.message}`);
        // Try a different approach or move on
        botState.currentTask = 'gather_wood';
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
    // Less frequent mining - only mine if we haven't mined recently
    if (botState.lastMined && Date.now() - botState.lastMined < 10000) {
        intelligentMovement();
        return;
    }
    
    // Return to surface if too deep underground
    if (bot.entity.position.y < 50) {
        logger.info('🔝 Returning to surface...');
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 3000);
        botState.currentTask = 'exploring';
        return;
    }
    
    logger.debug('⛏️ Looking for stone to mine...');
    
    const stones = bot.findBlocks({
        matching: [
            bot.registry.blocksByName.stone?.id,
            bot.registry.blocksByName.cobblestone?.id,
        ].filter(id => id !== undefined),
        maxDistance: 8, // Shorter range
        count: 3 // Fewer blocks
    });
    
    if (stones.length > 0 && Math.random() < 0.4) { // Only 40% chance to mine
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
                botState.lastMined = Date.now();
                
                // Much less chat spam
                if (Math.random() < 0.1) {
                    const miningMessages = [
                        'found some good stone here!',
                        'these blocks are perfect for building',
                        'mining is relaxing, but exploring is more fun!',
                        'gathering resources for future projects'
                    ];
                    sendIntelligentChat(miningMessages[Math.floor(Math.random() * miningMessages.length)]);
                }
                
                // Often switch to exploring after mining
                if (Math.random() < 0.6) {
                    botState.currentTask = 'exploring';
                }
            }
        } catch (error) {
            logger.debug(`Failed to mine stone: ${error.message}`);
        }
    } else {
        // More likely to explore instead of mine
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
    
    // More natural movement patterns
    const movements = [
        () => {
            // Sprint forward
            bot.setControlState('sprint', true);
            bot.setControlState('forward', true);
            setTimeout(() => {
                bot.setControlState('forward', false);
                bot.setControlState('sprint', false);
            }, 1500 + Math.random() * 2000);
        },
        () => {
            // Walk and jump
            bot.setControlState('forward', true);
            if (Math.random() < 0.6) {
                setTimeout(() => {
                    bot.setControlState('jump', true);
                    setTimeout(() => bot.setControlState('jump', false), 100);
                }, 500);
            }
            setTimeout(() => bot.setControlState('forward', false), 2000 + Math.random() * 1500);
        },
        () => {
            // Turn and move
            const randomYaw = bot.entity.yaw + (Math.random() - 0.5) * Math.PI;
            bot.look(randomYaw, bot.entity.pitch);
            setTimeout(() => {
                bot.setControlState('forward', true);
                // Random sprint
                if (Math.random() < 0.4) {
                    bot.setControlState('sprint', true);
                }
                setTimeout(() => {
                    bot.setControlState('forward', false);
                    bot.setControlState('sprint', false);
                }, 1000 + Math.random() * 2000);
            }, 300);
        },
        () => {
            // Jump around for fun
            if (bot.entity.onGround) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 100);
                
                // Sometimes double jump
                if (Math.random() < 0.3) {
                    setTimeout(() => {
                        bot.setControlState('jump', true);
                        setTimeout(() => bot.setControlState('jump', false), 100);
                    }, 300);
                }
            }
        }
    ];
    
    const movement = movements[Math.floor(Math.random() * movements.length)];
    movement();
    
    setTimeout(() => {
        botState.isMoving = false;
    }, 2000 + Math.random() * 2000);
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
    // Skip if bot is the sender
    if (username === bot.username) return;
    
    const lowerMessage = message.toLowerCase();
    const currentTime = Date.now();
    
    // Log all player messages for debugging
    logger.info(`📢 Player message from ${username}: "${message}"`);
    
    // Reduce chat cooldown to be more responsive
    if (currentTime - botState.lastChatTime < 1500) {
        logger.debug('Chat cooldown active, skipping response');
        return;
    }
    
    // More natural and human-like responses
    const responses = {
        'hello': () => {
            const greetings = [
                `hey ${username}! good to see you!`,
                `hello ${username}! how's it going?`,
                `hi there ${username}! what's up?`,
                `hey ${username}! nice to meet you!`
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        },
        'hi': () => {
            const replies = [
                `hi ${username}! how are you doing today?`,
                `hey ${username}! what brings you here?`,
                `hello ${username}! having fun on the server?`,
                `hi there! i'm ${bot.username}, nice to meet you ${username}!`
            ];
            return replies[Math.floor(Math.random() * replies.length)];
        },
        'great': () => {
            const positiveReplies = [
                `that's awesome ${username}!`,
                `glad to hear that!`,
                `nice! i'm doing pretty good too`,
                `that's great to hear!`
            ];
            return positiveReplies[Math.floor(Math.random() * positiveReplies.length)];
        },
        'good': () => `that's good to hear ${username}! i'm having a great time too`,
        'help': () => `what do you need help with ${username}? i'm always happy to help!`,
        'what are you doing': () => getActivityResponse(),
        'follow me': () => {
            botState.targetPlayer = username;
            botState.currentTask = 'follow_player';
            return `sure thing ${username}! i'll follow you around`;
        },
        'stop following': () => {
            botState.currentTask = 'exploring';
            botState.targetPlayer = null;
            return `alright ${username}, i'll go back to doing my own thing!`;
        },
        'stop': () => {
            botState.currentTask = 'exploring';
            botState.targetPlayer = null;
            return 'okay! back to exploring and crafting';
        },

        'mine': () => {
            botState.currentTask = 'mine_stone';
            return `sure ${username}! let's go mining together!`;
        },
        'build': () => `sounds amazing ${username}! what kind of build are you working on?`,
        'food': () => `i'm a bit hungry too ${username}! know any good food spots?`,
        'creative': () => `yes ${username}! i love creative mode for building amazing things!`,
        'dig': () => {
            botState.currentTask = 'mine_stone';
            return `alright ${username}! time to dig some blocks!`;
        },
        'explore': () => {
            botState.currentTask = 'exploring';
            return `great idea ${username}! let's explore the world together!`;
        },
        'come here': () => {
            botState.targetPlayer = username;
            botState.currentTask = 'follow_player';
            return `coming ${username}! on my way!`;
        },
        'go': () => {
            botState.currentTask = 'exploring';
            return `going ${username}! adventure time!`;
        },
        'wood': () => {
            botState.currentTask = 'gather_wood';
            return `good thinking ${username}! let's get some wood!`;
        },
        'craft': () => {
            botState.currentTask = 'craft_table';
            return `yeah ${username}! crafting is so much fun. currently working on my tools`;
        },
        'jump': () => {
            // Make bot jump when someone mentions it
            if (bot.entity.onGround) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 100);
            }
            return `jumping for you ${username}! :)`;
        },
        'dance': () => {
            // Make bot do a little dance
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 100);
            setTimeout(() => {
                bot.look(bot.entity.yaw + Math.PI/2, bot.entity.pitch);
            }, 200);
            return `dancing time! this is fun ${username}!`;
        }
    };
    
    // Check if bot is mentioned by name
    if (lowerMessage.includes(bot.username.toLowerCase())) {
        setTimeout(() => {
            const mentions = [
                `yes ${username}? did you need something?`,
                `hey ${username}! you called?`,
                `what's up ${username}? how can i help?`,
                `yes? i'm here ${username}!`
            ];
            sendIntelligentChat(mentions[Math.floor(Math.random() * mentions.length)]);
        }, 800 + Math.random() * 1500);
        return;
    }
    
    // Check for keyword responses with higher response rate
    let foundKeywordResponse = false;
    for (const [keyword, responseFunc] of Object.entries(responses)) {
        if (lowerMessage.includes(keyword)) {
            if (Math.random() < 0.90) { // 90% chance to respond to keyword messages
                setTimeout(() => {
                    sendIntelligentChat(responseFunc());
                    botState.lastChatTime = Date.now();
                }, 500 + Math.random() * 1500);
            }
            foundKeywordResponse = true;
            break;
        }
    }
    
    // If no keyword match, respond to ANY player message (70% chance)
    if (!foundKeywordResponse && Math.random() < 0.7) {
        const genericReplies = [
            `interesting ${username}! tell me more`,
            `i see what you mean ${username}`,
            `that sounds cool ${username}!`,
            `nice one ${username}!`,
            `what do you think about that ${username}?`,
            `i agree with you ${username}`,
            `that's a good point ${username}!`,
            `yeah ${username}, exactly!`,
            `cool ${username}! want to team up?`,
            `awesome ${username}! how can i help?`
        ];
        setTimeout(() => {
            sendIntelligentChat(genericReplies[Math.floor(Math.random() * genericReplies.length)]);
            botState.lastChatTime = Date.now();
        }, 800 + Math.random() * 2000);
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
    if (!bot || Date.now() - botState.lastChatTime < 15000) return;
    
    if (Math.random() < 0.4) { // 40% chance for more active chatting
        const randomMessages = [
            'hey everyone! how is everyone doing today?',
            'this server has such a great community!',
            'anyone want to go mining together?',
            'just finished gathering some wood, feels productive!',
            'minecraft never gets old, love this game!',
            'working on my crafting skills, still learning!',
            'anyone found any cool caves or structures lately?',
            'thanks for making this such a fun server to play on!',
            'what are you all building today?',
            'exploring is so much fun, found some interesting spots!',
            'love meeting new players here!',
            'anyone need help with anything? i am happy to assist!'
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
        
        if (distance > 5) {
            // Move towards the player
            logger.debug(`Following ${botState.targetPlayer}, distance: ${distance.toFixed(1)}`);
            bot.lookAt(targetEntity.position);
            bot.setControlState('forward', true);
            
            // Sprint if far away
            if (distance > 8) {
                bot.setControlState('sprint', true);
            }
            
            setTimeout(() => {
                bot.setControlState('forward', false);
                bot.setControlState('sprint', false);
            }, 1500);
        } else if (distance > 25) {
            // Too far, stop following
            sendIntelligentChat(`${botState.targetPlayer} you're too far away! come back if you need me`);
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