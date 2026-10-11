@echo off
REM ============================================
REM  Blog Publisher - push local changes to
REM  GitHub, then Vercel auto-deploys (1-2 min)
REM ============================================
cd /d "%~dp0"

echo ========================================
echo   Blog Publish  ^(blog-junjun^)
echo ========================================
echo.

git add -A
git diff --cached --quiet
if %errorlevel%==0 (
    echo [!] No changes found. Nothing to publish.
    pause
    exit /b 0
)

echo [i] Changed files:
git status --short
echo.

set /p msg=Commit message (press Enter for "update content"): 
if "%msg%"=="" set msg=update content

git commit -m "%msg%"
if %errorlevel% neq 0 (
    echo [X] Commit failed. Check git output above.
    pause
    exit /b 1
)

echo.
echo [i] Pushing to GitHub...
git push origin main
if %errorlevel% equ 0 (
    echo.
    echo [OK] Published! Vercel is auto-deploying now.
    echo      Live in 1-2 minutes at your blog URL.
) else (
    echo.
    echo [X] Push failed. Check your VPN/proxy node,
    echo     then run this script again.
)
echo.
pause
