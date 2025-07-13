@echo off
echo ============================================================
echo 🤖 Starting Minecraft AI Bot (24/7 Mode)
echo ============================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

REM Set your server details here (edit these values)
set MINECRAFT_HOST=GANG_WARS.aternos.me
set MINECRAFT_PORT=50466
set MINECRAFT_USERNAME=AIPlayer

echo 🎯 Connecting to: %MINECRAFT_HOST%:%MINECRAFT_PORT%
echo 👤 Bot Username: %MINECRAFT_USERNAME%
echo.
echo 🤖 Bot will run forever until you close this window
echo Press Ctrl+C to stop the bot
echo ============================================================
echo.

REM Run the bot
node ai-bot.js

echo.
echo Bot has stopped. Press any key to exit...
pause >nul