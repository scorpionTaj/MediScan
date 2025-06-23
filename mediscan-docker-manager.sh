#!/bin/bash

# Colors for better UI
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$PROJECT_ROOT/Docker"

clear_screen() {
    clear
    echo -e "${GREEN}========================================================"
    echo -e "              MediScan Docker Manager"
    echo -e "========================================================${NC}"
}

show_menu() {
    clear_screen
    echo
    echo -e "${CYAN}Select an option:${NC}"
    echo
    echo -e "${YELLOW}  BUILD OPTIONS:${NC}"
    echo "  [1] Start Full Environment (Backend + Frontend + MongoDB)"
    echo "  [2] Start Optimized Build (separate dockerignore files)"
    echo "  [3] Build Backend Only"
    echo "  [4] Build Frontend Only"
    echo
    echo -e "${YELLOW}  MANAGEMENT OPTIONS:${NC}"
    echo "  [5] Stop Services (with cleanup options)"
    echo "  [6] Quick Stop (keep containers/images)"
    echo "  [7] Restart Services"
    echo "  [8] Service Status and Health Check"
    echo
    echo -e "${YELLOW}  MAINTENANCE OPTIONS:${NC}"
    echo "  [9] Full Cleanup (remove everything)"
    echo "  [10] View Live Logs"
    echo "  [11] Access Container Shell"
    echo
    echo "  [0] Exit"
    echo
}

start_full() {
    clear_screen
    echo -e "${GREEN}Starting MediScan Full Docker Environment...${NC}"
    echo
    cd "$DOCKER_DIR"
    echo "Stopping any existing containers..."
    docker-compose down
    echo "Building images..."
    docker-compose build
    echo "Starting all services..."
    docker-compose up -d
    echo
    echo "Waiting for services to be ready..."
    sleep 20
    echo
    echo -e "${GREEN}Services started! Access at:${NC}"
    echo -e "${CYAN}Frontend: http://localhost:3000${NC}"
    echo -e "${CYAN}Backend:  http://localhost:8000${NC}"
    read -p "Press Enter to continue..."
}

start_optimized() {
    clear_screen
    echo -e "${GREEN}Building MediScan with Optimized Docker Images...${NC}"
    echo
    cd "$PROJECT_ROOT"
    echo "Stopping existing containers..."
    cd "$DOCKER_DIR"
    docker-compose down
    echo
    echo "Building Backend (excluding Frontend files)..."
    cd "$PROJECT_ROOT"
    cp "Docker/.dockerignore.backend" ".dockerignore" 2>/dev/null || true
    cd "$DOCKER_DIR"
    docker-compose build --no-cache backend
    echo
    echo "Building Frontend (excluding Backend files)..."
    cd "$PROJECT_ROOT"
    cp "Docker/.dockerignore.frontend" ".dockerignore" 2>/dev/null || true
    cd "$DOCKER_DIR"
    docker-compose build --no-cache frontend
    echo
    echo "Starting all services..."
    docker-compose up -d mongo
    sleep 10
    docker-compose up -d backend
    sleep 15
    docker-compose up -d frontend
    sleep 20
    echo
    echo -e "${GREEN}Optimized build completed!${NC}"
    echo -e "${CYAN}Frontend: http://localhost:3000${NC}"
    echo -e "${CYAN}Backend:  http://localhost:8000${NC}"
    read -p "Press Enter to continue..."
}

build_backend() {
    clear_screen
    echo -e "${GREEN}Building Backend Only...${NC}"
    echo
    cd "$PROJECT_ROOT"
    cp "Docker/.dockerignore.backend" ".dockerignore" 2>/dev/null || true
    cd "$DOCKER_DIR"
    docker-compose build --no-cache backend
    docker-compose up -d mongo
    sleep 10
    docker-compose up -d backend
    echo -e "${GREEN}Backend ready at: http://localhost:8000${NC}"
    read -p "Press Enter to continue..."
}

build_frontend() {
    clear_screen
    echo -e "${GREEN}Building Frontend Only...${NC}"
    echo
    cd "$PROJECT_ROOT"
    cp "Docker/.dockerignore.frontend" ".dockerignore" 2>/dev/null || true
    cd "$DOCKER_DIR"
    docker-compose build --no-cache frontend
    docker-compose up -d frontend
    echo -e "${GREEN}Frontend ready at: http://localhost:3000${NC}"
    read -p "Press Enter to continue..."
}

stop_with_options() {
    clear_screen
    echo -e "${YELLOW}Stopping MediScan Docker Environment...${NC}"
    echo
    cd "$DOCKER_DIR"
    docker-compose down
    echo
    echo "Cleanup Options:"
    echo "[1] Keep everything (fastest restart)"
    echo "[2] Remove containers only"
    echo "[3] Remove containers and images"
    echo "[4] Full cleanup (containers, images, volumes)"
    echo
    read -p "Choose option (1-4): " cleanup
    case $cleanup in
        2) docker-compose rm -f ;;
        3) docker-compose down --rmi all ;;
        4) docker-compose down --rmi all --volumes --remove-orphans && docker system prune -f ;;
    esac
    echo -e "${GREEN}Services stopped.${NC}"
    read -p "Press Enter to continue..."
}

quick_stop() {
    clear_screen
    echo -e "${YELLOW}Quick Stop - Preserving containers and images...${NC}"
    cd "$DOCKER_DIR"
    docker-compose stop
    echo -e "${GREEN}Services stopped. Use option 7 to restart quickly.${NC}"
    read -p "Press Enter to continue..."
}

restart_services() {
    clear_screen
    echo -e "${GREEN}Restarting MediScan Services...${NC}"
    cd "$DOCKER_DIR"
    docker-compose restart
    sleep 15
    echo -e "${GREEN}Services restarted!${NC}"
    echo -e "${CYAN}Frontend: http://localhost:3000${NC}"
    echo -e "${CYAN}Backend:  http://localhost:8000${NC}"
    read -p "Press Enter to continue..."
}

show_status() {
    clear_screen
    echo -e "${GREEN}MediScan Docker Environment Status...${NC}"
    echo
    cd "$DOCKER_DIR"
    echo -e "${CYAN}===== Service Status =====${NC}"
    docker-compose ps
    echo
    echo -e "${CYAN}===== Resource Usage =====${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" mediscan_frontend mediscan_backend mediscan_mongo 2>/dev/null
    echo
    echo -e "${CYAN}===== Health Checks =====${NC}"
    curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:3000 2>/dev/null || echo "Frontend: Not responding"
    curl -s -o /dev/null -w "Backend: %{http_code}\n" http://localhost:8000 2>/dev/null || echo "Backend: Not responding"
    curl -s -o /dev/null -w "Backend API: %{http_code}\n" http://localhost:8000/api/health 2>/dev/null || echo "Backend API: Not responding"
    echo
    echo -e "${CYAN}===== Docker Images =====${NC}"
    docker images --filter "reference=*mediscan*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    read -p "Press Enter to continue..."
}

full_cleanup() {
    clear_screen
    echo -e "${RED}WARNING: Full Cleanup will remove ALL MediScan Docker resources!${NC}"
    echo
    read -p "Type 'YES' to confirm full cleanup: " confirm
    if [ "$confirm" != "YES" ]; then
        echo "Cleanup cancelled."
        read -p "Press Enter to continue..."
        return
    fi
    cd "$DOCKER_DIR"
    echo "Performing full cleanup..."
    docker-compose down --rmi all --volumes --remove-orphans
    docker system prune -f --volumes
    echo -e "${GREEN}Full cleanup completed!${NC}"
    read -p "Press Enter to continue..."
}

live_logs() {
    clear_screen
    echo "Live Logs - Select service:"
    echo "[1] Frontend"
    echo "[2] Backend"
    echo "[3] MongoDB"
    echo "[4] All services"
    read -p "Choose service (1-4): " service
    cd "$DOCKER_DIR"
    case $service in
        1) docker-compose logs -f frontend ;;
        2) docker-compose logs -f backend ;;
        3) docker-compose logs -f mongo ;;
        4) docker-compose logs -f ;;
    esac
}

container_shell() {
    clear_screen
    echo "Access Container Shell:"
    echo "[1] Frontend Container"
    echo "[2] Backend Container"
    echo "[3] MongoDB Container"
    read -p "Choose container (1-3): " container
    case $container in
        1) docker exec -it mediscan_frontend sh ;;
        2) docker exec -it mediscan_backend bash ;;
        3) docker exec -it mediscan_mongo mongosh ;;
    esac
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice (0-11): " choice

    case $choice in
        1) start_full ;;
        2) start_optimized ;;
        3) build_backend ;;
        4) build_frontend ;;
        5) stop_with_options ;;
        6) quick_stop ;;
        7) restart_services ;;
        8) show_status ;;
        9) full_cleanup ;;
        10) live_logs ;;
        11) container_shell ;;
        0)
            echo
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please try again.${NC}"
            sleep 2
            ;;
    esac
done
