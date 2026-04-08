import express from 'express';
import { mercadoPublicoService } from '../services/mercadoPublicoService.js';
import { query } from '../db/database.js';

const router = express.Router();

// Búsqueda con filtros combinados (estado, fecha, regiones)
router.get('/buscar', async (req, res) => {
  try {
    const { estado, fecha, regiones } = req.query;
    const regionesArray = regiones ? regiones.split(',').map(r => r.trim()).filter(Boolean) : [];

    const data = await mercadoPublicoService.buscarLicitaciones({
      estado: estado || null,
      fecha: fecha || null,
      regiones: regionesArray
    });
    res.json(data);
  } catch (error) {
    console.error('Error en búsqueda:', error.message);
    res.status(500).json({ error: 'Error buscando licitaciones: ' + error.message });
  }
});

// Obtener licitación por código (detalle completo)
router.get('/codigo/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const data = await mercadoPublicoService.getLicitacionPorCodigo(codigo);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener licitaciones del día actual
router.get('/hoy', async (req, res) => {
  try {
    const data = await mercadoPublicoService.getLicitacionesHoy();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener licitaciones por estado
router.get('/estado/:estado', async (req, res) => {
  try {
    const { estado } = req.params;
    const { fecha } = req.query;
    const data = await mercadoPublicoService.getLicitacionesPorEstado(estado, fecha);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener licitaciones por fecha
router.get('/fecha/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params;
    const data = await mercadoPublicoService.getLicitacionesPorFecha(fecha);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enriquecer licitaciones con detalle completo
router.post('/enriquecer', async (req, res) => {
  try {
    const { codigos } = req.body;
    if (!codigos || !Array.isArray(codigos)) {
      return res.status(400).json({ error: 'Se requiere un array de códigos' });
    }
    const limitedCodigos = codigos.slice(0, 20);
    const detalles = await mercadoPublicoService.enriquecerLicitaciones(limitedCodigos);
    res.json({ Cantidad: detalles.length, Listado: detalles });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
