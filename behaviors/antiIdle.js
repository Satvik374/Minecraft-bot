const logger = require('../utils/logger');

class AntiIdleBehavior {
    constructor(bot, config) {
        this.bot = bot;
        this.config = config.behavior.antiIdle;
        this.jumpTimer = null;
        this.lookTimer = null;
        this.inventoryTimer = null;
        
        this.init();
    }
    
    init() {
        if (!this.config.enabled) return;
        
        this.bot.once('spawn', () => {
            logger.info('Anti-idle behavior initialized');
            this.startAntiIdle();
        });
    }
    
    startAntiIdle() {
        this.scheduleJump();
        this.scheduleLookAround();
        this.scheduleInventoryCheck();
    }
    
    scheduleJump() {
        if (this.jumpTimer) {
            clearTimeout(this.jumpTimer);
        }
        
        const interval = this.getRandomInterval(this.config.jumpInterval);
        
        this.jumpTimer = setTimeout(() => {
            this.performJump();
            this.scheduleJump();
        }, interval);
    }
    
    scheduleLookAround() {
        if (this.lookTimer) {
            clearTimeout(this.lookTimer);
        }
        
        const interval = this.getRandomInterval(this.config.lookAroundInterval);
        
        this.lookTimer = setTimeout(() => {
            this.performLookAround();
            this.scheduleLookAround();
        }, interval);
    }
    
    scheduleInventoryCheck() {
        if (this.inventoryTimer) {
            clearTimeout(this.inventoryTimer);
        }
        
        const interval = this.getRandomInterval(this.config.inventoryCheckInterval);
        
        this.inventoryTimer = setTimeout(() => {
            this.performInventoryCheck();
            this.scheduleInventoryCheck();
        }, interval);
    }
    
    performJump() {
        try {
            // Only jump if on ground to avoid spam
            if (this.bot.entity.onGround) {
                this.bot.setControlState('jump', true);
                setTimeout(() => {
                    this.bot.setControlState('jump', false);
                }, 100);
                
                logger.debug('Performed anti-idle jump');
            }
        } catch (error) {
            logger.debug(`Failed to jump: ${error.message}`);
        }
    }
    
    performLookAround() {
        try {
            const currentYaw = this.bot.entity.yaw;
            const currentPitch = this.bot.entity.pitch;
            
            // Random look direction
            const newYaw = currentYaw + (Math.random() - 0.5) * Math.PI;
            const newPitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, 
                currentPitch + (Math.random() - 0.5) * Math.PI/4));
            
            this.bot.look(newYaw, newPitch);
            
            logger.debug('Performed anti-idle look around');
        } catch (error) {
            logger.debug(`Failed to look around: ${error.message}`);
        }
    }
    
    performInventoryCheck() {
        try {
            // Occasionally open and close inventory
            if (Math.random() < 0.3) {
                // Simulate inventory interaction by checking held item
                const heldItem = this.bot.heldItem;
                if (heldItem) {
                    logger.debug(`Checked inventory, holding: ${heldItem.name}`);
                } else {
                    logger.debug('Checked inventory, hands empty');
                }
                
                // Sometimes switch held item
                if (Math.random() < 0.5) {
                    this.switchHeldItem();
                }
            }
        } catch (error) {
            logger.debug(`Failed to check inventory: ${error.message}`);
        }
    }
    
    switchHeldItem() {
        try {
            const items = this.bot.inventory.items();
            if (items.length > 0) {
                const randomItem = items[Math.floor(Math.random() * items.length)];
                
                // Only switch if it's a different item
                if (!this.bot.heldItem || this.bot.heldItem.slot !== randomItem.slot) {
                    this.bot.equip(randomItem, 'hand').catch(err => {
                        logger.debug(`Failed to equip item: ${err.message}`);
                    });
                }
            }
        } catch (error) {
            logger.debug(`Failed to switch held item: ${error.message}`);
        }
    }
    
    getRandomInterval(config) {
        return config.min + Math.random() * (config.max - config.min);
    }
    
    cleanup() {
        if (this.jumpTimer) {
            clearTimeout(this.jumpTimer);
        }
        if (this.lookTimer) {
            clearTimeout(this.lookTimer);
        }
        if (this.inventoryTimer) {
            clearTimeout(this.inventoryTimer);
        }
    }
}

module.exports = AntiIdleBehavior;
