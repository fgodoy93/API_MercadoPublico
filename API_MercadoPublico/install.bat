@echo off
setlocal enabledelayedexpansion

echo.
echo 🚀 MercadoPublico Analyzer - Script de Instalacion
echo ==================================================
echo.

REM Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js no esta instalado. Por favor instalalo desde https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js encontrado: %NODE_VERSION%
echo.

REM Backend
echo 📦 Instalando dependencias del backend...
cd backend
call npm install
copy .env.example .env
echo ✓ Backend configurado
echo.

REM Frontend
echo 📦 Instalando dependencias del frontend...
cd ..\frontend
call npm install
echo ✓ Frontend configurado
echo.

echo ✅ Instalacion completada!
echo.
echo 📝 Proximos pasos:
echo 1. Edita backend\.env con tus credenciales
echo 2. Crea la base de datos: createdb mercado_publico_db
echo 3. En una terminal: cd backend ^& npm run dev
echo 4. En otra terminal: cd frontend ^& npm run dev
echo.
echo 🎉 ¡Listo! Accede a http://localhost:5173
echo.
pause
