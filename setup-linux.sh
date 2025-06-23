#!/bin/bash

# MediScan Docker Manager Setup Script

echo "Setting up MediScan Docker Manager..."
echo

# Make the main script executable
chmod +x mediscan-docker-manager.sh

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if curl is installed (for health checks)
if ! command -v curl &> /dev/null; then
    echo "⚠️  curl is not installed. Health checks may not work properly."
    echo "   Install curl: sudo apt install curl (Ubuntu/Debian) or brew install curl (macOS)"
fi

echo "✅ Setup completed!"
echo
echo "Usage:"
echo "  ./mediscan-docker-manager.sh"
echo
echo "Or create an alias:"
echo "  echo 'alias mediscan=\"$(pwd)/mediscan-docker-manager.sh\"' >> ~/.bashrc"
echo "  source ~/.bashrc"
echo "  mediscan"
echo
