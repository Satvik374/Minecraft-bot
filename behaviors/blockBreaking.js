const logger = require('../utils/logger');

class BlockBreakingBehavior {
    constructor(bot, config) {
        this.bot = bot;
        this.config = config.behavior.blockBreaking;
        this.isBreaking = false;
        this.breakingTimer = null;
        
        this.init();
    }
    
    init() {
        if (!this.config.enabled) return;
        
        this.bot.once('spawn', () => {
            logger.info('Block breaking behavior initialized');
            this.startBreaking();
        });
    }
    
    startBreaking() {
        this.scheduleNextBreak();
    }
    
    scheduleNextBreak() {
        if (this.breakingTimer) {
            clearTimeout(this.breakingTimer);
        }
        
        this.breakingTimer = setTimeout(() => {
            this.attemptBreakBlock();
            this.scheduleNextBreak();
        }, this.config.checkInterval);
    }
    
    attemptBreakBlock() {
        if (this.isBreaking || Math.random() > this.config.breakChance) {
            return;
        }
        
        const targetBlock = this.findBreakableBlock();
        
        if (targetBlock) {
            this.breakBlock(targetBlock);
        }
    }
    
    findBreakableBlock() {
        const entity = this.bot.entity;
        const position = entity.position;
        const reach = this.config.maxReach;
        
        // Look for blocks around the bot
        const blocks = [];
        
        for (let x = -reach; x <= reach; x++) {
            for (let y = -2; y <= 2; y++) {
                for (let z = -reach; z <= reach; z++) {
                    const blockPos = position.offset(x, y, z);
                    const block = this.bot.blockAt(blockPos);
                    
                    if (block && this.isBreakableBlock(block)) {
                        const distance = position.distanceTo(blockPos);
                        if (distance <= reach) {
                            blocks.push({ block, distance });
                        }
                    }
                }
            }
        }
        
        if (blocks.length === 0) return null;
        
        // Sort by distance and prefer certain block types
        blocks.sort((a, b) => {
            const aPreferred = this.config.preferredBlocks.includes(a.block.name);
            const bPreferred = this.config.preferredBlocks.includes(b.block.name);
            
            if (aPreferred && !bPreferred) return -1;
            if (!aPreferred && bPreferred) return 1;
            
            return a.distance - b.distance;
        });
        
        return blocks[0].block;
    }
    
    isBreakableBlock(block) {
        if (!block || block.name === 'air') return false;
        
        // Avoid breaking important blocks
        const avoidBlocks = [
            'bedrock', 'barrier', 'command_block', 'structure_block',
            'spawner', 'chest', 'ender_chest', 'trapped_chest',
            'furnace', 'blast_furnace', 'smoker', 'dispenser',
            'dropper', 'hopper', 'beacon', 'conduit'
        ];
        
        if (avoidBlocks.includes(block.name)) return false;
        
        // Only break blocks that can be broken by hand or basic tools
        return block.hardness !== null && block.hardness < 50;
    }
    
    async breakBlock(block) {
        if (this.isBreaking) return;
        
        this.isBreaking = true;
        
        try {
            logger.debug(`Breaking block: ${block.name} at ${block.position}`);
            
            // Look at the block
            await this.bot.lookAt(block.position.offset(0.5, 0.5, 0.5));
            
            // Equip appropriate tool if available
            await this.equipBestTool(block);
            
            // Break the block
            await this.bot.dig(block);
            
            logger.debug(`Successfully broke ${block.name}`);
            
        } catch (error) {
            logger.debug(`Failed to break block: ${error.message}`);
        } finally {
            this.isBreaking = false;
        }
    }
    
    async equipBestTool(block) {
        const tools = this.bot.inventory.items();
        let bestTool = null;
        let bestTime = Infinity;
        
        for (const tool of tools) {
            if (tool.name.includes('pickaxe') || 
                tool.name.includes('axe') || 
                tool.name.includes('shovel') ||
                tool.name.includes('hoe')) {
                
                const time = block.digTime(tool);
                if (time < bestTime) {
                    bestTime = time;
                    bestTool = tool;
                }
            }
        }
        
        if (bestTool && this.bot.heldItem !== bestTool) {
            try {
                await this.bot.equip(bestTool);
            } catch (error) {
                logger.debug(`Failed to equip tool: ${error.message}`);
            }
        }
    }
    
    cleanup() {
        if (this.breakingTimer) {
            clearTimeout(this.breakingTimer);
        }
        this.isBreaking = false;
    }
}

module.exports = BlockBreakingBehavior;
