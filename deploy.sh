#!/bin/bash

# ===========================================
# Blog System - Docker Deployment Script
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}   Blog System Docker Deployment${NC}"
echo -e "${GREEN}=========================================${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}No .env file found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}Please edit .env file with your production values before continuing!${NC}"
    echo -e "${RED}Especially: POSTGRES_PASSWORD, JWT_SECRET, RUSTFS_ROOT_PASSWORD${NC}"
    exit 1
fi

# Parse command line arguments
ACTION=${1:-"up"}

case $ACTION in
    "build")
        echo -e "${GREEN}Building Docker images...${NC}"
        docker compose build --no-cache
        echo -e "${GREEN}Build completed!${NC}"
        ;;
    
    "up")
        echo -e "${GREEN}Starting all services...${NC}"
        docker compose up -d
        echo -e "${GREEN}Waiting for services to be healthy...${NC}"
        sleep 10
        
        echo -e "${GREEN}=========================================${NC}"
        echo -e "${GREEN}Deployment completed!${NC}"
        echo -e "${GREEN}=========================================${NC}"
        echo -e "Blog: http://localhost:${HTTP_PORT:-80}"
        echo -e "RustFS Console: http://localhost:${RUSTFS_CONSOLE_PORT:-9001}"
        ;;
    
    "down")
        echo -e "${YELLOW}Stopping all services...${NC}"
        docker compose down
        echo -e "${GREEN}All services stopped.${NC}"
        ;;
    
    "restart")
        echo -e "${YELLOW}Restarting all services...${NC}"
        docker compose restart
        echo -e "${GREEN}All services restarted.${NC}"
        ;;
    
    "logs")
        docker compose logs -f ${2:-""}
        ;;
    
    "status")
        docker compose ps
        ;;
    
    "clean")
        echo -e "${RED}WARNING: This will remove all containers, volumes, and images!${NC}"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker compose down -v --rmi all
            echo -e "${GREEN}Cleanup completed.${NC}"
        fi
        ;;
    
    *)
        echo "Usage: $0 {build|up|down|restart|logs|status|clean}"
        echo ""
        echo "Commands:"
        echo "  build    - Build Docker images"
        echo "  up       - Start all services (default)"
        echo "  down     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - View logs (optionally specify service name)"
        echo "  status   - Show service status"
        echo "  clean    - Remove all containers, volumes, and images"
        echo ""
        echo "Note: Database migrations run automatically on backend startup"
        exit 1
        ;;
esac
