@echo off
echo ========================================
echo Airport Task App - GitHub Push Script
echo ========================================
echo.

REM Start SSH agent
echo Starting SSH agent...
FOR /F "tokens=*" %%i IN ('ssh-agent') DO %%i

REM Add SSH key
echo Adding SSH key...
ssh-add "%USERPROFILE%\.ssh\id_ed25519_github"

echo.
echo Testing SSH connection to GitHub...
ssh -T git@github.com
echo.

REM Check if there are changes to commit
echo Checking for changes...
git status

echo.
set /p COMMIT="Do you want to add and commit changes? (y/n): "
if /i "%COMMIT%"=="y" (
    echo.
    echo Adding files...
    git add .

    echo.
    set /p MESSAGE="Enter commit message: "
    git commit -m "%MESSAGE%"
)

echo.
echo Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo Push complete!
echo ========================================
pause
