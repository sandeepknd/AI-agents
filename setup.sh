#!/bin/bash

# AI Agent Platform - Setup Script
# This script automates the setup process for the AI Agent platform

set -e  # Exit on error

echo "==================================="
echo "AI Agent Platform - Setup Script"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Python version
echo -e "${YELLOW}Checking Python version...${NC}"
python_version=$(python3 --version 2>&1 | awk '{print $2}')
required_version="3.10"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo -e "${RED}Error: Python 3.10 or higher is required. Found: $python_version${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python version: $python_version${NC}"

# Check if Ollama is installed
echo -e "\n${YELLOW}Checking Ollama installation...${NC}"
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}✓ Ollama is installed${NC}"
else
    echo -e "${RED}✗ Ollama is not installed${NC}"
    echo -e "${YELLOW}Please install Ollama from: https://ollama.ai${NC}"
    read -p "Do you want to continue without Ollama? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if LLaMA 3 model is available
if command -v ollama &> /dev/null; then
    echo -e "\n${YELLOW}Checking for LLaMA 3 model...${NC}"
    if ollama list | grep -q llama3; then
        echo -e "${GREEN}✓ LLaMA 3 model found${NC}"
    else
        echo -e "${YELLOW}LLaMA 3 model not found. Pulling...${NC}"
        ollama pull llama3
        echo -e "${GREEN}✓ LLaMA 3 model installed${NC}"
    fi

    # Check for embedding model
    echo -e "\n${YELLOW}Checking for embedding model...${NC}"
    if ollama list | grep -q nomic-embed-text; then
        echo -e "${GREEN}✓ Embedding model found${NC}"
    else
        echo -e "${YELLOW}Embedding model not found. Pulling...${NC}"
        ollama pull nomic-embed-text
        echo -e "${GREEN}✓ Embedding model installed${NC}"
    fi
fi

# Create virtual environment
echo -e "\n${YELLOW}Creating virtual environment...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo -e "\n${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate
echo -e "${GREEN}✓ Virtual environment activated${NC}"

# Upgrade pip
echo -e "\n${YELLOW}Upgrading pip...${NC}"
pip install --upgrade pip > /dev/null 2>&1
echo -e "${GREEN}✓ pip upgraded${NC}"

# Install Python dependencies
echo -e "\n${YELLOW}Installing Python dependencies...${NC}"
pip install -r requirements.txt
echo -e "${GREEN}✓ Python dependencies installed${NC}"

# Create necessary directories
echo -e "\n${YELLOW}Creating necessary directories...${NC}"
mkdir -p logs
mkdir -p uploaded_docs
mkdir -p embeddings
echo -e "${GREEN}✓ Directories created${NC}"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "\n${YELLOW}Creating .env file...${NC}"
    cat > .env << EOF
# GitHub Token (for PR review)
GITHUB_TOKEN=your_github_token_here

# HuggingFace Token (optional, for higher rate limits)
# HF_TOKEN=your_hf_token_here
EOF
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}Please edit .env file and add your GitHub token${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Setup frontend
echo -e "\n${YELLOW}Setting up frontend...${NC}"
if [ -d "ai-agent-ui" ]; then
    cd ai-agent-ui
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing frontend dependencies...${NC}"
        npm install
        echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
    else
        echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
    fi
    cd ..
fi

# Summary
echo -e "\n${GREEN}==================================="
echo "Setup Complete!"
echo "===================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure Google OAuth credentials:"
echo "   - Place credentials_calendar.json for Calendar API"
echo "   - Place credentials_per_gmail.json for Gmail API"
echo ""
echo "2. Add your GitHub token to .env file:"
echo "   GITHUB_TOKEN=your_token_here"
echo ""
echo "3. Start the backend server:"
echo "   source venv/bin/activate"
echo "   uvicorn main_fastapi:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "4. Start the frontend (in another terminal):"
echo "   cd ai-agent-ui"
echo "   npm start"
echo ""
echo "5. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
