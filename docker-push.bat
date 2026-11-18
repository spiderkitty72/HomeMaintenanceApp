@echo off
setlocal

:: -------------------------------------------------------
:: Set your Docker Hub username or registry image name here
:: e.g. myusername/maintenance-app
::      ghcr.io/myusername/maintenance-app
set IMAGE_NAME=maintenance-app
:: -------------------------------------------------------

:: Read version from package.json
for /f "delims=" %%v in ('node -e "process.stdout.write(require('./package.json').version)"') do set VERSION=%%v

if "%VERSION%"=="" (
    echo ERROR: Could not read version from package.json
    exit /b 1
)

echo.
echo Building %IMAGE_NAME%:%VERSION% and %IMAGE_NAME%:latest
echo.

docker build -t %IMAGE_NAME%:%VERSION% -t %IMAGE_NAME%:latest .
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker build failed
    exit /b 1
)

echo.
echo Pushing %IMAGE_NAME%:%VERSION%
docker push %IMAGE_NAME%:%VERSION%
if %ERRORLEVEL% neq 0 (
    echo ERROR: Push failed for version tag
    exit /b 1
)

echo.
echo Pushing %IMAGE_NAME%:latest
docker push %IMAGE_NAME%:latest
if %ERRORLEVEL% neq 0 (
    echo ERROR: Push failed for latest tag
    exit /b 1
)

echo.
echo Done. Pushed %IMAGE_NAME%:%VERSION% and %IMAGE_NAME%:latest
endlocal
