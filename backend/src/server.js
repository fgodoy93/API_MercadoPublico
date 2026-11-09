import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { sequelize } from './db/sequelize.js';
import { setupRoutes } from './routes/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Initialize database and routes
async function startServer() {
  try {
    console.log('Conectando a base de datos...');
    await sequelize.authenticate();
    console.log('✓ Conexión a base de datos establecida');
    
    console.log('Sincronizando modelos...');
    await sequelize.sync({ alter: true });
    console.log('✓ Modelos sincronizados');
    
    console.log('Configurando rutas...');
    setupRoutes(app);

    // Servir frontend compilado en producción si existe ../frontend/dist
    const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
    if (fs.existsSync(frontendDistPath)) {
      console.log('✓ Sirviendo archivos estáticos del frontend desde:', frontendDistPath);
      app.use(express.static(frontendDistPath));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
          return next();
        }
        res.sendFile(path.join(frontendDistPath, 'index.html'));
      });
    }
    
    app.listen(PORT, () => {
      console.log(`✓ Servidor ejecutándose en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
