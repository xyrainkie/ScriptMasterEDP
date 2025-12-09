@echo off
echo 🚀 Starting ScriptMaster AI Backend Setup...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Check if MySQL is available
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ MySQL is not installed or not in PATH. Please install MySQL 8.0+ first.
    echo    You can also modify the database configuration in .env to use PostgreSQL or other databases.
    pause
    exit /b 1
)

echo ✅ MySQL detected

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Check if .env file exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️ Please edit .env file with your database and API keys before continuing.
    echo    Required configurations:
    echo    - DB_PASSWORD: Your MySQL password
    echo    - GEMINI_API_KEY: Your Google Gemini API key
    echo    - JWT_SECRET: A secure secret key for JWT tokens
    echo.
    pause
)

REM Create necessary directories
echo 📁 Creating directories...
if not exist uploads mkdir uploads
if not exist uploads\images mkdir uploads\images
if not exist uploads\audio mkdir uploads\audio
if not exist uploads\video mkdir uploads\video
if not exist uploads\components mkdir uploads\components
if not exist exports mkdir exports
if not exist temp mkdir temp

REM Database setup
echo 🗄️ Setting up database...
echo Please ensure MySQL is running and you have created a database named 'scriptmaster_ai'

REM Ask user if they want to run migrations
set /p run_migrations="Do you want to run database migrations? (y/n): "
if /i "%run_migrations%"=="y" (
    echo 🔄 Running database migrations...
    npm run migrate

    set /p run_seeds="Do you want to run seed data? (y/n): "
    if /i "%run_seeds%"=="y" (
        echo 🌱 Running seed data...
        npm run seed
    )
)

echo.
echo 🎉 Setup completed!
echo.
echo 🚀 To start the development server:
echo    npm run dev
echo.
echo 📚 To start the production server:
echo    npm run build
echo    npm start
echo.
echo 📖 API Health Check: http://localhost:3001/health
echo.
echo 🔑 Default users created:
echo    Admin: admin@scriptmaster.ai / admin123
echo    Developer: dev@scriptmaster.ai / dev123
echo    Artist: artist@scriptmaster.ai / artist123
echo    Uploader: uploader@scriptmaster.ai / upload123
echo.
pause