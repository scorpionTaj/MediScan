#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Function to wait for MongoDB to be ready
wait_for_mongodb() {
    log "Waiting for MongoDB to be ready..."

    # Default MONGO_URI if not set
    MONGO_URI=${MONGO_URI:-"mongodb://mongo:27017/"}
    DATABASE_NAME=${DATABASE_NAME:-"mediscan"}

    # Maximum number of attempts
    max_attempts=30
    attempt=1

    while [ $attempt -le $max_attempts ]
    do
        log "Attempt $attempt of $max_attempts..."

        # Try to connect to MongoDB
        if python -c "
from pymongo import MongoClient
import sys
try:
    client = MongoClient('$MONGO_URI', serverSelectionTimeoutMS=5000)
    client.server_info()
    print('MongoDB connection successful')
    sys.exit(0)
except Exception as e:
    print(f'MongoDB connection failed: {e}')
    sys.exit(1)
" 2>/dev/null; then
            log "MongoDB is available!"
            return 0
        fi

        # Wait before next attempt
        sleep 2
        attempt=$(( $attempt + 1 ))
    done

    error "Could not connect to MongoDB after $max_attempts attempts"
    error "MONGO_URI: $MONGO_URI"
    error "DATABASE_NAME: $DATABASE_NAME"
    return 1
}

# Function to check if ML model exists
check_ml_model() {
    if [ -f "/usr/src/app/pneumonia_detection.keras" ]; then
        log "ML model found: pneumonia_detection.keras"
        return 0
    else
        warn "ML model not found: pneumonia_detection.keras"
        warn "The application may not work properly without the ML model"
        return 1
    fi
}

# Function to validate critical dependencies
validate_dependencies() {
    log "Validating critical Python dependencies..."

    python -c "
import sys
required_packages = [
    'flask', 'pymongo', 'tensorflow', 'cv2',
    'numpy', 'PIL', 'sklearn', 'matplotlib'
]

missing_packages = []
for package in required_packages:
    try:
        if package == 'cv2':
            import cv2
        elif package == 'PIL':
            import PIL
        elif package == 'sklearn':
            import sklearn
        else:
            __import__(package)
        print(f'✓ {package} imported successfully')
    except ImportError:
        missing_packages.append(package)
        print(f'✗ {package} import failed')

if missing_packages:
    print(f'Missing packages: {missing_packages}')
    sys.exit(1)
else:
    print('All critical dependencies are available')
    sys.exit(0)
" 2>/dev/null

    if [ $? -eq 0 ]; then
        log "All critical dependencies validated successfully"
        return 0
    else
        warn "Some dependencies may be missing or have issues"
        return 1
    fi
}

# Function to create required directories
create_directories() {
    log "Creating required directories..."
    mkdir -p /usr/src/app/static/uploads
    log "Directories created successfully"
}

# Function to initialize the database
init_database() {
    log "Initializing MongoDB database..."

    if python -c "
from Backend.app_mongodb import init_db
import sys
try:
    if init_db():
        print('Database initialization successful')
        sys.exit(0)
    else:
        print('Database initialization failed')
        sys.exit(1)
except Exception as e:
    print(f'Database initialization error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
"; then
        log "Database initialization completed successfully"
        return 0
    else
        error "Database initialization failed"
        return 1
    fi
}

# Main execution
log "Starting MediScan Docker container initialization..."

# Check environment variables
log "Environment variables:"
log "  MONGO_URI: ${MONGO_URI:-'not set'}"
log "  DATABASE_NAME: ${DATABASE_NAME:-'not set'}"
log "  FLASK_ENV: ${FLASK_ENV:-'not set'}"
log "  PYTHONPATH: ${PYTHONPATH:-'not set'}"

# Create required directories
create_directories

# Validate critical dependencies
validate_dependencies

# Check ML model
check_ml_model

# Wait for MongoDB to be ready
if ! wait_for_mongodb; then
    error "Failed to connect to MongoDB. Exiting..."
    exit 1
fi

# Initialize the database
if ! init_database; then
    error "Failed to initialize database. Exiting..."
    exit 1
fi

# Start the application
log "Starting MediScan application with command: $@"
exec "$@"