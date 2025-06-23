@echo off
title MediScan Docker Manager
color 0A

:MAIN_MENU
cls
echo.
echo ========================================================
echo                MediScan Docker Manager
echo ========================================================
echo.
echo Select an option:
echo.
echo   BUILD OPTIONS:
echo   [1] Start Full Environment (Backend + Frontend + MongoDB)
echo   [2] Start Optimized Build (separate dockerignore files)
echo   [3] Build Backend Only
echo   [4] Build Frontend Only
echo.
echo   MANAGEMENT OPTIONS:
echo   [5] Stop Services (with cleanup options)
echo   [6] Quick Stop (keep containers/images)
echo   [7] Restart Services
echo   [8] Service Status and Health Check
echo.
echo   MAINTENANCE OPTIONS:
echo   [9] Full Cleanup (remove everything)
echo   [10] View Live Logs
echo   [11] Access Container Shell
echo.
echo   [0] Exit
echo.
set /p choice=Enter your choice (0-11):

if "%choice%"=="1" goto START_FULL
if "%choice%"=="2" goto START_OPTIMIZED
if "%choice%"=="3" goto BUILD_BACKEND
if "%choice%"=="4" goto BUILD_FRONTEND
if "%choice%"=="5" goto STOP_WITH_OPTIONS
if "%choice%"=="6" goto QUICK_STOP
if "%choice%"=="7" goto RESTART
if "%choice%"=="8" goto STATUS
if "%choice%"=="9" goto FULL_CLEANUP
if "%choice%"=="10" goto LIVE_LOGS
if "%choice%"=="11" goto CONTAINER_SHELL
if "%choice%"=="0" goto EXIT
goto MAIN_MENU

:START_FULL
cls
echo Starting MediScan Full Docker Environment...
echo.
cd /d "c:\Users\ScorpionTaj\Desktop\MediScan\Docker"
echo Stopping any existing containers...
docker-compose down
echo Building images...
docker-compose build
echo Starting all services...
docker-compose up -d
echo.
echo Waiting for services to be ready...
timeout /t 20 /nobreak > nul
echo.
echo Services started! Access at:
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
pause
goto MAIN_MENU

:START_OPTIMIZED
cls
echo Building MediScan with Optimized Docker Images...
echo.
cd /d "c:\Users\ScorpionTaj\Desktop\MediScan"
echo Stopping existing containers...
cd Docker
docker-compose down
echo.
echo Building Backend (excluding Frontend files)...
cd ..
copy "Docker\.dockerignore.backend" ".dockerignore" >nul 2>&1
cd Docker
docker-compose build --no-cache backend
echo.
echo Building Frontend (excluding Backend files)...
cd ..
copy "Docker\.dockerignore.frontend" ".dockerignore" >nul 2>&1
cd Docker
docker-compose build --no-cache frontend
echo.
echo Starting all services...
docker-compose up -d mongo
timeout /t 10 /nobreak > nul
docker-compose up -d backend
timeout /t 15 /nobreak > nul
docker-compose up -d frontend
timeout /t 20 /nobreak > nul
echo.
echo Optimized build completed!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
pause
goto MAIN_MENU

:BUILD_BACKEND
cls
echo Building Backend Only...
echo.
cd /d "c:\Users\ScorpionTaj\Desktop\MediScan"
copy "Docker\.dockerignore.backend" ".dockerignore" >nul 2>&1
cd Docker
docker-compose build --no-cache backend
docker-compose up -d mongo
timeout /t 10 /nobreak > nul
docker-compose up -d backend
echo Backend ready at: http://localhost:8000
pause
goto MAIN_MENU

:BUILD_FRONTEND
cls
echo Building Frontend Only...
echo.
cd /d "c:\Users\ScorpionTaj\Desktop\MediScan"
copy "Docker\.dockerignore.frontend" ".dockerignore" >nul 2>&1
cd Docker
docker-compose build --no-cache frontend
docker-compose up -d frontend
echo Frontend ready at: http://localhost:3000
pause
goto MAIN_MENU

:STOP_WITH_OPTIONS
cls
echo Stopping MediScan Docker Environment...
echo.
cd /d "c:\Users\ScorpionTaj\Desktop\MediScan\Docker"
docker-compose down
echo.
echo Cleanup Options:
echo [1] Keep everything (fastest restart)
echo [2] Remove containers only
echo [3] Remove containers and images
echo [4] Full cleanup (containers, images, volumes)
echo.
set /p cleanup=Choose option (1-4):
if "%cleanup%"=="2" docker-compose rm -f
if "%cleanup%"=="3" docker-compose down --rmi all
if "%cleanup%"=="4" docker-compose down --rmi all --volumes --remove-orphans && docker system prune -f
echo Services stopped.
pause
goto MAIN_MENU

:QUICK_STOP
cls
echo Quick Stop - Preserving containers and images...
cd /d "c:\Users\ScorpionTaj\Desktop\MediScan\Docker"
docker-compose stop
echo Services stopped. Use option 7 to restart quickly.
pause
goto MAIN_MENU

:RESTART
cls
echo Restarting MediScan Services...
cd /d "c:\Users\ScorpionTaj\Desktop\MediScan\Docker"
docker-compose restart
timeout /t 15 /nobreak > nul
echo Services restarted!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
pause
goto MAIN_MENU

:STATUS
cls
echo MediScan Docker Environment Status...
echo.
cd /d "c:\Users\ScorpionTaj\Desktop\MediScan\Docker"
echo ===== Service Status =====
docker-compose ps
echo.
echo ===== Resource Usage =====
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" mediscan_frontend mediscan_backend mediscan_mongo 2>nul
echo.
echo ===== Health Checks =====
curl -s -o nul -w "Frontend: %%{http_code}\n" http://localhost:3000 2>nul || echo Frontend: Not responding
curl -s -o nul -w "Backend: %%{http_code}\n" http://localhost:8000 2>nul || echo Backend: Not responding
curl -s -o nul -w "Backend API: %%{http_code}\n" http://localhost:8000/api/health 2>nul || echo Backend API: Not responding
echo.
echo ===== Docker Images =====
docker images --filter "reference=*mediscan*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
pause
goto MAIN_MENU

:FULL_CLEANUP
cls
echo WARNING: Full Cleanup will remove ALL MediScan Docker resources!
echo.
set /p confirm=Type 'YES' to confirm full cleanup:
if /i not "%confirm%"=="YES" (
    echo Cleanup cancelled.
    pause
    goto MAIN_MENU
)
cd /d "c:\Users\ScorpionTaj\Desktop\MediScan\Docker"
echo Performing full cleanup...
docker-compose down --rmi all --volumes --remove-orphans
docker system prune -f --volumes
echo Full cleanup completed!
pause
goto MAIN_MENU

:LIVE_LOGS
cls
echo Live Logs - Select service:
echo [1] Frontend
echo [2] Backend
echo [3] MongoDB
echo [4] All services
set /p service=Choose service (1-4):
cd /d "c:\Users\ScorpionTaj\Desktop\MediScan\Docker"
if "%service%"=="1" docker-compose logs -f frontend
if "%service%"=="2" docker-compose logs -f backend
if "%service%"=="3" docker-compose logs -f mongo
if "%service%"=="4" docker-compose logs -f
goto MAIN_MENU

:CONTAINER_SHELL
cls
echo Access Container Shell:
echo [1] Frontend Container
echo [2] Backend Container
echo [3] MongoDB Container
set /p container=Choose container (1-3):
if "%container%"=="1" docker exec -it mediscan_frontend sh
if "%container%"=="2" docker exec -it mediscan_backend bash
if "%container%"=="3" docker exec -it mediscan_mongo mongosh
goto MAIN_MENU

:EXIT
echo.
echo Goodbye!
pause
exit
