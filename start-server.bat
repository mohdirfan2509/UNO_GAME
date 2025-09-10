@echo off
echo Starting UNO Multiplayer Server...
cd server
echo.
echo Make sure no other server is running on port 3000
echo.
node app.js
pause
