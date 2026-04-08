import authRoutes from './auth.js';
import licitacionesRoutes from './licitaciones.js';
import perfilRoutes from './perfil.js';
import iaRoutes from './ia.js';
import filtrosRoutes from './filtros.js';

export function setupRoutes(app) {
  app.use('/api/auth', authRoutes);
  app.use('/api/licitaciones', licitacionesRoutes);
  app.use('/api/perfil', perfilRoutes);
  app.use('/api/ia', iaRoutes);
  app.use('/api/filtros', filtrosRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });
}
