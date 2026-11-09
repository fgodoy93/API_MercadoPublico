import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { sequelize, Usuario, PerfilEmpresa } from './db/sequelize.js';
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

// Health check para Coolify / Docker
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

async function seedInitialWorkspace() {
  try {
    let usuario = await Usuario.findOne({ order: [['id', 'ASC']] });
    if (!usuario) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      usuario = await Usuario.create({
        email: 'contacto@innerdata.cl',
        nombre: 'Administrador Corporativo',
        contrasena: hashedPassword
      });
    }

    const totalPerfiles = await PerfilEmpresa.count();
    if (totalPerfiles === 0) {
      console.log('Inicializando perfiles corporativos base (InnerData y LR INVERSIONES SPA)...');
      await PerfilEmpresa.bulkCreate([
        {
          usuarioId: usuario.id,
          nombreEmpresa: 'InnerData',
          rutEmpresa: '76.123.456-7',
          descripcion: 'InnerData es una firma de ingeniería y consultoría especializada en Analítica Avanzada, Ciencia de Datos, Optimización de Procesos y Desarrollo de Sistemas Digitales a medida.\n\nCapacidades Técnicas Principales:\n• Analítica Avanzada, Ciencia de Datos e IA\n• Business Intelligence (BI) y Visualización Ejecutiva (Power BI, Tableau, Looker)\n• Sistemas Digitales, Desarrollo Web y Automatización (RPA)\n• Control de Gestión y Reingeniería de Procesos\n• Simulación y Optimización Operacional',
          servicios: 'software, datos, desarrollo, sistema, licencias, soporte informático, nube, servidores, consultoría, asesoría, capacitación, estudio, auditoría, diseño, diagnóstico, ciencia de datos, analítica, power bi, dashboard, business intelligence, desarrollo web, software a medida, automatización, rpa, integración de sistemas, levantamiento de procesos, control de gestión, optimización, modelamiento, base de datos, inteligencia artificial, digitalización',
          experienciaAnos: 1,
          regiones: 'Metropolitana, Biobío, Maule, Ñuble',
          tiposLicitacion: 'L1, LE, LP',
          presupuestoMinimo: 1000000,
          presupuestoMaximo: 50000000,
          rubrosPrincipales: 'ti, consultoria',
          palabrasExcluidas: 'impresoras, tóner, mobiliario, aseo, construcción, obras civiles, pavimentación, medicamentos, insumos médicos, vehículos, alimentación, catering',
          coberturaNacional: true,
          habilitadoChileProveedores: 'si',
          interesCompraAgil: true,
          esActivo: true
        },
        {
          usuarioId: usuario.id,
          nombreEmpresa: 'LR INVERSIONES SPA',
          rutEmpresa: '77.261.369-5',
          descripcion: 'LR INVERSIONES SPA es una empresa dedicada a actividades de servicios administrativos y de apoyo con presencia en Providencia, Santiago, Región Metropolitana. Enfocada en prestar servicios ligados al aseo en instalaciones industriales y oficinas.',
          servicios: 'servicio de aseo, limpieza, áreas verdes, higienización, control de plagas, insumos de aseo, aseo industrial, aseo oficinas',
          experienciaAnos: 10,
          regiones: 'Metropolitana, Biobío',
          tiposLicitacion: 'L1, LE, LP',
          rubrosPrincipales: 'aseo',
          coberturaNacional: true,
          habilitadoChileProveedores: 'si',
          interesCompraAgil: true,
          esActivo: false
        }
      ]);
      console.log('✓ Perfiles corporativos inicializados');
    }
  } catch (err) {
    console.error('Aviso en seedInitialWorkspace:', err.message);
  }
}

// Initialize database and routes
async function startServer() {
  try {
    console.log('Conectando a base de datos...');
    await sequelize.authenticate();
    console.log('✓ Conexión a base de datos establecida');
    
    console.log('Sincronizando modelos...');
    await sequelize.sync({ alter: true });
    console.log('✓ Modelos sincronizados');

    await seedInitialWorkspace();
    
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
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Servidor ejecutándose en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
