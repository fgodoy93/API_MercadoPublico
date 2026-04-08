import express from 'express';
import { query } from '../db/database.js';

const router = express.Router();

// Guardar filtro de búsqueda
router.post('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { nombreFiltro, proveedor, region, fechaInicio, fechaFin, estadoLicitacion } = req.body;

    const result = await query(
      `INSERT INTO filtros_busqueda
       (usuario_id, nombre_filtro, proveedor, region, fecha_inicio, fecha_fin, estado_licitacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [usuarioId, nombreFiltro, proveedor, region, fechaInicio, fechaFin, estadoLicitacion]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener filtros del usuario
router.get('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const result = await query(
      `SELECT * FROM filtros_busqueda 
       WHERE usuario_id = $1 
       ORDER BY creado_en DESC`,
      [usuarioId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar filtro
router.delete('/:filtroId', async (req, res) => {
  try {
    const { filtroId } = req.params;

    const result = await query(
      'DELETE FROM filtros_busqueda WHERE id = $1 RETURNING *',
      [filtroId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Filtro no encontrado' });
    }

    res.json({ message: 'Filtro eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
