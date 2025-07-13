# Minecraft Bot Project

## Overview

This project is a Minecraft bot built using the mineflayer library. The bot connects to Minecraft servers and simulates realistic player behavior through various automated behaviors including movement, block breaking, chat interactions, and anti-idle mechanisms. The bot is designed for 24/7 operation with automatic reconnection capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- ✅ Complete 24/7 Minecraft bot implementation (July 13, 2025)
- ✅ Enhanced chat system - responds to ALL player messages (70% rate) (July 13, 2025)
- ✅ Player task commands - "follow me", "mine", "explore", "craft" etc. (July 13, 2025)
- ✅ Anti-ban system - 20 username rotation, automatic ban detection (July 13, 2025)
- ✅ Local deployment package - complete download files for 24/7 operation (July 13, 2025)
- ✅ Smart reconnection logic - different delays for bans vs disconnections (July 13, 2025)
- ✅ Fixed unlimited bot connection bug - only 1 bot connects at a time (July 13, 2025)

## System Architecture

The application follows a modular, event-driven architecture built on Node.js:

- **Main Entry Points**: `index.js` and `start.js` handle bot initialization and configuration
- **Core Bot Class**: `bot.js` manages the main bot instance and coordinates all behaviors
- **Behavior System**: Modular behavior classes in the `behaviors/` directory implement specific bot actions
- **Utility Layer**: Helper modules in `utils/` provide logging and pathfinding functionality

The architecture emphasizes separation of concerns, with each behavior being an independent module that can be enabled/disabled through configuration.

## Key Components

### Core Bot (`bot.js`)
- Main MinecraftBot class extending EventEmitter
- Manages bot lifecycle, connection, and behavior coordination
- Handles event delegation between mineflayer bot and behavior modules
- Implements health monitoring and spawn handling

### Behavior Modules
- **Movement Behavior**: Random walking with direction changes and stop intervals
- **Block Breaking Behavior**: Automated block mining with configurable target blocks
- **Chat Behavior**: Sends periodic chat messages and responds to player interactions
- **Anti-Idle Behavior**: Performs actions like jumping and looking around to prevent server kicks

### Utilities
- **Logger**: Winston-based logging with console and file output, error handling
- **Simple Pathfinding**: Basic A* pathfinding implementation for obstacle avoidance

### Configuration
- Centralized configuration in `config.js`
- Environment variable support for server connection parameters
- Behavior-specific settings for fine-tuning bot actions

## Data Flow

1. **Initialization**: Bot creates mineflayer instance with server connection details
2. **Login/Spawn**: Bot establishes connection and initializes behavior modules
3. **Event Loop**: Behaviors run on timers and respond to game events
4. **Error Handling**: Automatic reconnection on disconnection or errors
5. **Logging**: All actions and errors are logged for monitoring

The bot operates entirely in-memory with no persistent data storage requirements.

## External Dependencies

### Primary Dependencies
- **mineflayer**: Core Minecraft bot framework for server communication
- **winston**: Logging framework for structured logging and error tracking

### Authentication Dependencies
- **@azure/msal-node**: Microsoft authentication library (likely for premium Minecraft accounts)
- **jsonwebtoken**: JWT token handling for authentication flows

### Utility Dependencies
- **uuid**: Unique identifier generation
- **@types/node**: TypeScript definitions for Node.js

## Deployment Strategy

The bot is designed for simple deployment scenarios:

- **Local/Development**: Direct Node.js execution with `node start.js`
- **Environment Configuration**: Support for environment variables for server settings
- **Process Management**: Built-in reconnection logic eliminates need for external process managers
- **Logging**: File-based logging for monitoring and debugging
- **Cross-Platform**: Pure Node.js implementation works on any platform supporting Node.js

The application requires no database setup, web server, or complex infrastructure - just Node.js and network access to target Minecraft servers.