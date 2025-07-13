const logger = require('../utils/logger');

class MovementBehavior {
    constructor(bot, config) {
        this.bot = bot;
        this.config = config.behavior.movement;
        this.safety = config.safety;
        this.isMoving = false;
        this.currentDirection = 0;
        this.movementTimer = null;
        this.stopTimer = null;
        
        this.init();
    }
    
    init() {
        if (!this.config.enabled) return;
        
        // Start movement behavior after bot spawns
        this.bot.once('spawn', () => {
            logger.info('Movement behavior initialized');
            this.startMovement();
        });
    }
    
    startMovement() {
        this.scheduleNextMovement();
    }
    
    scheduleNextMovement() {
        if (this.movementTimer) {
            clearTimeout(this.movementTimer);
        }
        
        const interval = this.getRandomInterval(this.config.directionChangeInterval);
        
        this.movementTimer = setTimeout(() => {
            this.updateMovement();
            this.scheduleNextMovement();
        }, interval);
    }
    
    updateMovement() {
        // Check if bot should stop moving
        if (Math.random() < this.config.stopMovementChance && this.isMoving) {
            this.stopMovement();
            return;
        }
        
        // Check if bot should start moving
        if (Math.random() < this.config.forwardMovementChance || !this.isMoving) {
            this.startForwardMovement();
        } else {
            this.changeDirection();
        }
    }
    
    startForwardMovement() {
        if (!this.isSafeToMove()) {
            this.avoidDanger();
            return;
        }
        
        this.bot.setControlState('forward', true);
        this.isMoving = true;
        
        // Occasionally strafe
        if (Math.random() < 0.3) {
            const strafeDirection = Math.random() < 0.5 ? 'left' : 'right';
            this.bot.setControlState(strafeDirection, true);
            
            setTimeout(() => {
                this.bot.setControlState(strafeDirection, false);
            }, 1000 + Math.random() * 2000);
        }
    }
    
    stopMovement() {
        this.bot.setControlState('forward', false);
        this.bot.setControlState('left', false);
        this.bot.setControlState('right', false);
        this.isMoving = false;
        
        const stopDuration = this.getRandomInterval(this.config.stopDuration);
        
        this.stopTimer = setTimeout(() => {
            this.startForwardMovement();
        }, stopDuration);
    }
    
    changeDirection() {
        // Turn left or right
        const turnDirection = Math.random() < 0.5 ? -1 : 1;
        const turnAmount = (Math.random() * Math.PI / 2) * turnDirection;
        
        this.bot.look(this.bot.entity.yaw + turnAmount, this.bot.entity.pitch);
        
        // Continue or start moving in new direction
        if (this.isSafeToMove()) {
            this.startForwardMovement();
        }
    }
    
    isSafeToMove() {
        const entity = this.bot.entity;
        const position = entity.position;
        
        // Check for void (y < 5)
        if (this.safety.avoidVoid && position.y < 5) {
            return false;
        }
        
        // Check blocks ahead for safety
        const ahead = position.offset(
            Math.sin(entity.yaw) * 2,
            0,
            -Math.cos(entity.yaw) * 2
        );
        
        const blockAhead = this.bot.blockAt(ahead);
        const blockBelow = this.bot.blockAt(ahead.offset(0, -1, 0));
        
        // Avoid lava
        if (this.safety.avoidLava && blockAhead && blockAhead.name === 'lava') {
            return false;
        }
        
        // Avoid falling too far
        if (!blockBelow || blockBelow.name === 'air') {
            const fallDistance = this.calculateFallDistance(ahead);
            if (fallDistance > this.safety.maxFallDistance) {
                return false;
            }
        }
        
        return true;
    }
    
    calculateFallDistance(position) {
        let distance = 0;
        let currentPos = position.clone();
        
        while (distance < 10) {
            currentPos = currentPos.offset(0, -1, 0);
            const block = this.bot.blockAt(currentPos);
            
            if (block && block.name !== 'air') {
                break;
            }
            
            distance++;
        }
        
        return distance;
    }
    
    avoidDanger() {
        logger.debug('Avoiding danger, turning around');
        
        // Turn around
        this.bot.look(this.bot.entity.yaw + Math.PI, this.bot.entity.pitch);
        
        // Move forward in new direction if safe
        setTimeout(() => {
            if (this.isSafeToMove()) {
                this.startForwardMovement();
            }
        }, 1000);
    }
    
    getRandomInterval(config) {
        return config.min + Math.random() * (config.max - config.min);
    }
    
    cleanup() {
        if (this.movementTimer) {
            clearTimeout(this.movementTimer);
        }
        if (this.stopTimer) {
            clearTimeout(this.stopTimer);
        }
        
        // Stop all movement
        this.bot.setControlState('forward', false);
        this.bot.setControlState('left', false);
        this.bot.setControlState('right', false);
    }
}

module.exports = MovementBehavior;
