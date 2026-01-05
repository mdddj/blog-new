#!/bin/bash

# Blog System Development Script
# Usage: ./dev.sh [command]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Start all docker services
start_services() {
    print_status "Starting Docker services..."
    docker-compose up -d postgres redis rustfs
    
    print_status "Waiting for services to be healthy..."
    sleep 5
    
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep blog
}

# Stop all docker services
stop_services() {
    print_status "Stopping Docker services..."
    docker-compose down
}

# Run database migrations
migrate() {
    print_status "Running database migrations..."
    docker exec -i blog-postgres psql -U bloguser -d blog < backend/migrations/001_initial_schema.sql 2>/dev/null || print_warning "Tables may already exist"
    print_status "Migration complete"
}

# Create admin user
create_admin() {
    print_status "Creating admin user (admin/admin123)..."
    docker exec -i blog-postgres psql -U bloguser -d blog -c "INSERT INTO users (username, password_hash, nickname) VALUES ('admin', '\$argon2id\$v=19\$m=19456,t=2,p=1\$WqDc/E9F2DWaRSaLtKogiA\$pWm5ASYN8+DJLF/A+iQ6+DFG1mitQQiGhHbf7nArEVM', 'Administrator') ON CONFLICT (username) DO NOTHING;" 2>/dev/null
    print_status "Admin user ready"
}

# Run backend
run_backend() {
    print_status "Starting backend server..."
    cd backend && cargo run --bin blog-backend
}

# Run frontend
run_frontend() {
    print_status "Starting frontend dev server..."
    cd frontend && npm run dev
}

# Full setup
setup() {
    start_services
    sleep 3
    migrate
    create_admin
    print_status "Setup complete!"
    echo ""
    echo "Services:"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
    echo "  - RustFS Console: http://localhost:9001/rustfs/console/index.html"
    echo ""
    echo "Next steps:"
    echo "  1. Create 'blog' bucket in RustFS console (rustfsadmin/rustfsadmin)"
    echo "  2. Run backend: ./dev.sh backend"
    echo "  3. Run frontend: ./dev.sh frontend"
    echo ""
    echo "Admin login: admin / admin123"
}

# Show help
show_help() {
    echo "Blog System Development Script"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup     - Start services, run migrations, create admin"
    echo "  start     - Start Docker services only"
    echo "  stop      - Stop Docker services"
    echo "  migrate   - Run database migrations"
    echo "  backend   - Run backend server"
    echo "  frontend  - Run frontend dev server"
    echo "  help      - Show this help"
}

# Main
case "${1:-help}" in
    setup)
        setup
        ;;
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    migrate)
        migrate
        ;;
    backend)
        run_backend
        ;;
    frontend)
        run_frontend
        ;;
    help|*)
        show_help
        ;;
esac
