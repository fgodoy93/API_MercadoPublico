#!/bin/bash

echo "🚀 MercadoPublico Analyzer - Script de Instalación"
echo "=================================================="

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instálalo desde https://nodejs.org"
    exit 1
fi

echo "✓ Node.js encontrado: $(node -v)"

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL no encontrado. Por favor instálalo desde https://www.postgresql.org"
    read -p "¿Deseas continuar sin PostgreSQL? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Backend
echo ""
echo "📦 Instalando dependencias del backend..."
cd backend
npm install
cp .env.example .env
echo "✓ Backend configurado"

# Frontend
echo ""
echo "📦 Instalando dependencias del frontend..."
cd ../frontend
npm install
echo "✓ Frontend configurado"

echo ""
echo "✅ Instalación completada!"
echo ""
echo "📝 Próximos pasos:"
echo "1. Edita backend/.env con tus credenciales"
echo "2. Crea la base de datos: createdb mercado_publico_db"
echo "3. Ejecuta: npm run dev (en backend y frontend en terminales separadas)"
echo ""
echo "🎉 ¡Listo! Accede a http://localhost:5173"
