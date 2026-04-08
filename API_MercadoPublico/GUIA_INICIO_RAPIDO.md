# Guía de Inicio Rápido

## Instalación y Configuración en 5 minutos

### Paso 1: Preparación del Entorno

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Paso 2: Configurar Base de Datos

```sql
-- En PostgreSQL
CREATE DATABASE mercado_publico_db;
CREATE USER postgres WITH PASSWORD 'your_password';
ALTER ROLE postgres SUPERUSER;
```

### Paso 3: Variables de Entorno

**backend/.env:**
```
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mercado_publico_db
DB_USER=postgres
DB_PASSWORD=your_password
MERCADO_PUBLICO_TICKET=53CA2806-ED69-4108-9148-6F7B5C1A217F
JWT_SECRET=tu_secreto_jwt_aqui
AI_PROVIDER=both
OLLAMA_API_URL=http://localhost:11434
```

### Paso 4: Ejecutar la Aplicación

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Paso 5: Acceder a la Aplicación

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## Uso Básico

1. **Registrarse** con email y contraseña
2. **Crear perfil** de empresa con servicios y presupuesto
3. **Buscar licitaciones** por estado/fecha/región
4. **Analizar compatibilidad** usando IA
5. **Ver documentación recomendada** para postular

## Tips Útiles

- Usa filtros para buscar licitaciones específicas
- El análisis IA es más preciso con perfiles completos
- Guarda licitaciones para seguimiento
- Verifica regularmente nuevas licitaciones en tu área

## Solución de Problemas

**Error de conexión a BD:**
- Verifica que PostgreSQL esté ejecutándose
- Comprueba credenciales en .env

**Error de IA:**
- Si usas OLLAMA: `ollama serve` debe estar ejecutándose
- Si usas Claude: Verifica que CLAUDE_API_KEY sea válida

**Puerto en uso:**
- Cambia PORT en backend/.env
- Cambia port en frontend/vite.config.js
