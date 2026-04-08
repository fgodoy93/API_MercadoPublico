import express from 'express';
import { query } from '../db/database.js';

const router = express.Router();

// Obtener perfil de empresa del usuario
router.get('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    
    const result = await query(
      `SELECT * FROM perfiles_empresa 
       WHERE usuario_id = $1 
       ORDER BY actualizado_en DESC 
       LIMIT 1`,
      [usuarioId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear o actualizar perfil de empresa
router.post('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const {
      nombreEmpresa,
      rutEmpresa,
      descripcion,
      servicios,
      experienciaAnos,
      regiones,
      tiposLicitacion,
      presupuestoMinimo,
      presupuestoMaximo
    } = req.body;

    // Primero verificar si existe un perfil
    const existing = await query(
      'SELECT id FROM perfiles_empresa WHERE usuario_id = $1',
      [usuarioId]
    );

    let result;

    if (existing.rows.length > 0) {
      // Actualizar
      result = await query(
        `UPDATE perfiles_empresa
         SET nombre_empresa = $1,
             rut_empresa = $2,
             descripcion = $3,
             servicios = $4,
             experiencia_anos = $5,
             regiones = $6,
             tipos_licitacion = $7,
             presupuesto_minimo = $8,
             presupuesto_maximo = $9,
             actualizado_en = CURRENT_TIMESTAMP
         WHERE usuario_id = $10
         RETURNING *`,
        [nombreEmpresa, rutEmpresa, descripcion, servicios, experienciaAnos, 
         regiones, tiposLicitacion, presupuestoMinimo, presupuestoMaximo, usuarioId]
      );
    } else {
      // Crear
      result = await query(
        `INSERT INTO perfiles_empresa
         (usuario_id, nombre_empresa, rut_empresa, descripcion, servicios, 
          experiencia_anos, regiones, tipos_licitacion, presupuesto_minimo, presupuesto_maximo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [usuarioId, nombreEmpresa, rutEmpresa, descripcion, servicios, experienciaAnos,
         regiones, tiposLicitacion, presupuestoMinimo, presupuestoMaximo]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
