@echo off
echo Setting up Prodini for Windows...

REM Go to project folder
cd /d "%~dp0"

REM Create Python virtual environment inside backend
cd backend

if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Installing Flask dependencies...
call venv\Scripts\activate

python -m pip install --upgrade pip
pip install flask flask-cors flask-sqlalchemy

echo Setup complete.
echo Starting Prodini...

cd ..

npm install
npm start

pause