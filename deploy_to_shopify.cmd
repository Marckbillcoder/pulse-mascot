@echo off
echo ========================================================
echo  PulseMascot - Deploying Extension to Shopify CDN
echo ========================================================
cd /d "c:\Users\Labhesh\Downloads\emotional mascot"
call npx shopify app deploy --allow-updates
echo.
echo ========================================================
echo  Deployment finished! Check the message above.
echo ========================================================
pause
