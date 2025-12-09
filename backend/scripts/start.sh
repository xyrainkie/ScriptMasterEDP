#!/bin/bash

echo "🚀 Starting ScriptMaster AI Backend Setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL is not installed. Please install MySQL 8.0+ first."
    echo "   You can also modify the database configuration in .env to use PostgreSQL or other databases."
    exit 1
fi

echo "✅ MySQL detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your database and API keys before continuing."
    echo "   Required configurations:"
    echo "   - DB_PASSWORD: Your MySQL password"
    echo "   - GEMINI_API_KEY: Your Google Gemini API key"
    echo "   - JWT_SECRET: A secure secret key for JWT tokens"
    echo ""
    read -p "Press Enter after configuring .env file..."
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads/images uploads/audio uploads/video uploads/components exports temp

# Database setup
echo "🗄️  Setting up database..."
echo "Please ensure MySQL is running and you have created a database named 'scriptmaster_ai'"

# Ask user if they want to run migrations
read -p "Do you want to run database migrations? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Running database migrations..."
    npm run migrate

    read -p "Do you want to run seed data? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🌱 Running seed data..."
        npm run seed
    fi
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "📚 To start the production server:"
echo "   npm run build"
echo "   npm start"
echo ""
echo "📖 API Documentation: http://localhost:3001/health"
echo ""
echo "🔑 Default users created:"
echo "   Admin: admin@scriptmaster.ai / admin123"
echo "   Developer: dev@scriptmaster.ai / dev123"
echo "   Artist: artist@scriptmaster.ai / artist123"
echo "   Uploader: uploader@scriptmaster.ai / upload123"