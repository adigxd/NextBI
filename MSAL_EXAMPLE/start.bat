@echo off
echo Starting SurveyRock application...
echo.

echo Installing dependencies...
call npm install
cd frontend && call npm install && cd ..
echo.

echo Initializing database...
call npm run init-db
echo.

echo Starting development servers...
call npm run dev:all
