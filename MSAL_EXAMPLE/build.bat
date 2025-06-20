@echo off
echo Building SurveyRock application for production...
echo.

echo Installing dependencies...
call npm install
cd frontend && call npm install && cd ..
echo.

echo Building frontend...
cd frontend && call npm run build && cd ..
echo.

echo SurveyRock build complete!
echo To start the application in production mode, run: npm start
