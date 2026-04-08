import express from 'express';
import { mercadoPublicoService } from '../services/mercadoPublicoService.js';
import { query } from '../db/database.js';

const router = express.Router();

// Búsqueda principal (listado rápido + cache)
router.get('/buscar', async (req, res) => {
  try {
    const { estado, fecha, regiones, pagina = '1', porPagina = '30' } = req.query;
    const regionesArray = regiones ? regiones.split(',').map(r => r.trim()).filter(Boolean) : [];

    const data = await mercadoPublicoService.buscar({
      estado: estado || null,
      fecha: fecha || null,
      regiones: regionesArray,
      pagina: parseInt(pagina),
      porPagina: parseInt(porPagina)
    });
    res.json(data);
  } catch (error) {
    console.error('Error en búsqueda:', error.message);
    res.status(500).json({ error: 'Error buscando licitaciones: ' + error.message });
  }
});

// Listado rápido de hoy (sin enriquecimiento)
router.get('/hoy', async (req, res) => {
  try {
    const listado = await mercadoPublicoService.getListado(null, null);
    res.json({ Cantidad: listado.length, Listado: listado });
  } catch (error) {
    console.error('Error hoy:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Detalle completo de una licitación (con cache)
router.get('/codigo/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const data = await mercadoPublicoService.getLicitacionPorCodigo(codigo);
    res.json(data);
  } catch (error) {
    console.error('Error detalle:', error.message);
    res.status(500).json({ error: 'Error obteniendo detalle. La API de Mercado Público puede estar lenta.' });
  }
});

// Estadísticas del cache
router.get('/cache/stats', async (req, res) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as total,
              COUNT(DISTINCT region) as regiones,
              MIN(fecha_cache) as primera,
              MAX(fecha_cache) as ultima
       FROM cache_licitaciones`
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.json({ total: 0, regiones: 0 });
  }
});

// Guardar licitación
router.post('/guardar', async (req, res) => {
  try {
    const { usuarioId, codigoLicitacion, datosLicitacion, nivelMatch, analisisIa } = req.body;

    const result = await query(
      `INSERT INTO licitaciones_guardadas
       (usuario_id, codigo_licitacion, datos_licitacion, nivel_match, analisis_ia)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (usuario_id, codigo_licitacion)
       DO UPDATE SET
         nivel_match = EXCLUDED.nivel_match,
         analisis_ia = EXCLUDED.analisis_ia,
         fecha_guardado = CURRENT_TIMESTAMP
       RETURNING *`,
      [usuarioId, codigoLicitacion, JSON.stringify(datosLicitacion), nivelMatch, JSON.stringify(analisisIa)]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener licitaciones guardadas del usuario
router.get('/guardadas/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const result = await query(
      `SELECT * FROM licitaciones_guardadas
       WHERE usuario_id = $1
       ORDER BY fecha_guardado DESC`,
      [usuarioId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
