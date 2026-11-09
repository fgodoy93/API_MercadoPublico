import express from 'express';
import { FiltroBusqueda } from '../db/sequelize.js';

const router = express.Router();

// Guardar filtro de búsqueda
router.post('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { nombreFiltro, proveedor, region, fechaInicio, fechaFin, estadoLicitacion } = req.body;

    const filtro = await FiltroBusqueda.create({
      usuarioId,
      nombreFiltro,
      proveedor,
      region,
      fechaInicio,
      fechaFin,
      estadoLicitacion
    });

    res.json(filtro);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener filtros del usuario
router.get('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const filtros = await FiltroBusqueda.findAll({
      where: { usuarioId },
      order: [['createdAt', 'DESC']]
    });

    res.json(filtros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar filtro
router.delete('/:filtroId', async (req, res) => {
  try {
    const { filtroId } = req.params;

    const filtro = await FiltroBusqueda.findByPk(filtroId);
    if (!filtro) {
      return res.status(404).json({ error: 'Filtro no encontrado' });
    }

    await filtro.destroy();
    res.json({ message: 'Filtro eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
