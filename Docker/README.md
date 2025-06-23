# MediScan Docker Setup

This setup runs the complete MediScan application in Docker containers.

## Architecture

- **Frontend**: Next.js web application (port 3000)
- **Backend**: Flask API server (port 8000)
- **Database**: MongoDB (port 27017)

## Quick Start

### Option 1: Use the Batch Script (Windows)

```cmd
# Start all services
start-docker.bat

# Stop all services
stop-docker.bat
```

### Option 2: Manual Docker Commands

```cmd
# Navigate to Docker directory
cd Docker

# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f [service_name]

# Stop all services
docker-compose down
```

## Services

### Frontend (Next.js)

- **URL**: http://localhost:3000
- **Container**: mediscan_frontend
- **Environment**: Production build with API proxy to backend

### Backend (Flask)

- **URL**: http://localhost:8000
- **Container**: mediscan_backend
- **Features**: ML model for pneumonia detection, user authentication, file uploads

### Database (MongoDB)

- **URL**: mongodb://localhost:27017
- **Container**: mediscan_mongo
- **Database**: mediscan

## API Communication

The frontend communicates with the backend through:

1. **Next.js Rewrites**: All `/api/*` requests are proxied to the backend
2. **Docker Network**: Containers communicate via the `mediscan-network`
3. **Environment Variables**: `NEXT_PUBLIC_API_URL` configures the backend URL

## Development vs Production

### Development Mode

- Use Docker volumes for hot reloading
- Frontend proxies API calls to backend
- Environment: `FLASK_ENV=development`

### Production Mode

- Optimized builds
- Health checks enabled
- Restart policies configured

## Troubleshooting

### Check Service Status

```cmd
docker-compose ps
```

### View Logs

```cmd
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f mongo
```

### Restart Services

```cmd
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart frontend
```

### Clean Rebuild

```cmd
# Stop and remove containers
docker-compose down

# Remove images
docker-compose down --rmi all

# Rebuild and start
docker-compose up -d --build
```

## Environment Variables

### Frontend

- `NEXT_PUBLIC_API_URL`: Backend API URL (set automatically in Docker)

### Backend

- `MONGO_URI`: MongoDB connection string
- `DATABASE_NAME`: MongoDB database name
- `FLASK_ENV`: Flask environment mode
- `SECRET_KEY`: Flask secret key

## File Structure

```
Docker/
├── Dockerfile              # Backend Dockerfile
├── Dockerfile.frontend     # Frontend Dockerfile
├── docker-compose.yml      # Multi-service configuration
├── docker-entrypoint.sh    # Backend startup script
└── README.md               # This file

Root/
├── start-docker.bat        # Windows start script
├── stop-docker.bat         # Windows stop script
├── .dockerignore          # Docker ignore file
└── .env.local             # Environment variables
```

## Health Checks

All services have health checks configured:

- **Frontend**: HTTP check on port 3000
- **Backend**: HTTP check on `/api/health`
- **MongoDB**: Database ping test

## Security

- Non-root users in containers
- Network isolation
- Environment variable management
- CORS configured for frontend-backend communication

## Scaling

To scale services:

```cmd
# Scale frontend to 2 instances
docker-compose up -d --scale frontend=2
```

Note: Currently configured for single-instance deployment. For multi-instance, you'll need to configure load balancing.
