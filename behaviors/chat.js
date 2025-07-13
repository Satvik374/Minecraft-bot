const logger = require('../utils/logger');

class ChatBehavior {
    constructor(bot, config) {
        this.bot = bot;
        this.config = config.behavior.chat;
        this.chatTimer = null;
        this.lastMessageTime = 0;
        this.minMessageInterval = 10000; // 10 seconds minimum between messages
        
        this.init();
    }
    
    init() {
        if (!this.config.enabled) return;
        
        this.bot.once('spawn', () => {
            logger.info('Chat behavior initialized');
            this.startChatting();
        });
        
        // Listen to chat messages for potential responses
        this.bot.on('chat', (username, message) => {
            if (username === this.bot.username) return;
            
            this.handleIncomingMessage(username, message);
        });
    }
    
    startChatting() {
        this.scheduleNextMessage();
    }
    
    scheduleNextMessage() {
        if (this.chatTimer) {
            clearTimeout(this.chatTimer);
        }
        
        this.chatTimer = setTimeout(() => {
            this.attemptSendMessage();
            this.scheduleNextMessage();
        }, this.config.checkInterval);
    }
    
    attemptSendMessage() {
        const now = Date.now();
        
        // Check if enough time has passed since last message
        if (now - this.lastMessageTime < this.minMessageInterval) {
            return;
        }
        
        // Random chance to send message
        if (Math.random() > this.config.messageChance) {
            return;
        }
        
        const message = this.getRandomMessage();
        this.sendMessage(message);
    }
    
    getRandomMessage() {
        const messages = this.config.messages;
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    sendMessage(message) {
        try {
            this.bot.chat(message);
            this.lastMessageTime = Date.now();
            logger.debug(`Sent chat message: ${message}`);
        } catch (error) {
            logger.debug(`Failed to send chat message: ${error.message}`);
        }
    }
    
    handleIncomingMessage(username, message) {
        const lowerMessage = message.toLowerCase();
        
        // Simple responses to common greetings
        const responses = {
            'hello': ['hello!', 'hey there!', 'hi!'],
            'hi': ['hello!', 'hey!', 'hi there!'],
            'hey': ['hey!', 'hello!', 'hi!'],
            'how are you': ['doing great!', 'pretty good!', 'good, thanks!'],
            'what are you doing': ['just exploring', 'building stuff', 'having fun'],
            'nice': ['thanks!', 'yeah!', 'appreciate it!']
        };
        
        // Check if message contains bot's name
        if (lowerMessage.includes(this.bot.username.toLowerCase())) {
            // Respond to mentions with higher probability
            if (Math.random() < 0.7) {
                const response = this.getContextualResponse(lowerMessage) || 'thanks for mentioning me!';
                setTimeout(() => {
                    this.sendMessage(response);
                }, 1000 + Math.random() * 3000);
            }
            return;
        }
        
        // Check for keyword responses
        for (const [keyword, responseList] of Object.entries(responses)) {
            if (lowerMessage.includes(keyword)) {
                if (Math.random() < 0.3) { // 30% chance to respond
                    const response = responseList[Math.floor(Math.random() * responseList.length)];
                    setTimeout(() => {
                        this.sendMessage(response);
                    }, 2000 + Math.random() * 4000);
                }
                break;
            }
        }
    }
    
    getContextualResponse(message) {
        if (message.includes('good') || message.includes('great')) {
            return 'thanks!';
        }
        if (message.includes('bad') || message.includes('stop')) {
            return 'sorry about that';
        }
        if (message.includes('help')) {
            return 'what do you need help with?';
        }
        if (message.includes('build')) {
            return 'sounds like a cool project!';
        }
        
        return null;
    }
    
    cleanup() {
        if (this.chatTimer) {
            clearTimeout(this.chatTimer);
        }
    }
}

module.exports = ChatBehavior;
