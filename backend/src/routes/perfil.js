import express from 'express';
import { PerfilEmpresa } from '../db/sequelize.js';

const router = express.Router();

function parseNumericField(val) {
  if (val === undefined || val === null || val === '' || Number.isNaN(Number(val))) {
    return null;
  }
  return Number(val);
}

function buildPayload(body) {
  const {
    nombreEmpresa,
    rutEmpresa,
    descripcion,
    servicios,
    experienciaAnos,
    regiones,
    tiposLicitacion,
    presupuestoMinimo,
    presupuestoMaximo,
    rubrosPrincipales,
    palabrasExcluidas,
    coberturaNacional,
    habilitadoChileProveedores,
    capacidadGarantia,
    interesCompraAgil,
    certificaciones,
    esActivo
  } = body;

  const payload = {
    nombreEmpresa: (nombreEmpresa && String(nombreEmpresa).trim() !== '') ? String(nombreEmpresa).trim() : 'Nueva Empresa',
    rutEmpresa: rutEmpresa ? String(rutEmpresa).trim() : '',
    descripcion: descripcion ? String(descripcion) : '',
    servicios: servicios ? String(servicios) : '',
    experienciaAnos: parseNumericField(experienciaAnos),
    regiones: regiones ? String(regiones) : '',
    tiposLicitacion: tiposLicitacion ? String(tiposLicitacion) : 'L1, LE, LP',
    presupuestoMinimo: parseNumericField(presupuestoMinimo),
    presupuestoMaximo: parseNumericField(presupuestoMaximo),
    rubrosPrincipales: rubrosPrincipales ? String(rubrosPrincipales) : '',
    palabrasExcluidas: palabrasExcluidas ? String(palabrasExcluidas) : '',
    coberturaNacional: coberturaNacional !== undefined ? Boolean(coberturaNacional) : true,
    habilitadoChileProveedores: habilitadoChileProveedores || 'si',
    capacidadGarantia: parseNumericField(capacidadGarantia),
    interesCompraAgil: interesCompraAgil !== undefined ? Boolean(interesCompraAgil) : true,
    certificaciones: certificaciones ? String(certificaciones) : ''
  };

  if (esActivo !== undefined) {
    payload.esActivo = Boolean(esActivo);
  }

  return payload;
}

// Listar TODOS los perfiles de empresa disponibles (Multi-Perfil)
router.get('/lista/:usuarioId', async (req, res) => {
  try {
    const perfiles = await PerfilEmpresa.findAll({
      order: [['id', 'ASC']]
    });

    res.json(perfiles);
  } catch (error) {
    console.error('Error GET /perfil/lista:', error);
    res.status(500).json({ error: error.message });
  }
});

// Activar un perfil específico como predeterminado
router.put('/activar/:perfilId', async (req, res) => {
  try {
    const perfilId = Number(req.params.perfilId);
    const target = await PerfilEmpresa.findByPk(perfilId);
    if (!target) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // Desactivar los demás y activar este
    await PerfilEmpresa.update({ esActivo: false }, { where: {} });
    await target.update({ esActivo: true });

    res.json(target);
  } catch (error) {
    console.error('Error PUT /perfil/activar:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar un perfil específico
router.delete('/item/:perfilId', async (req, res) => {
  try {
    const perfilId = Number(req.params.perfilId);
    const target = await PerfilEmpresa.findByPk(perfilId);
    if (!target) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const total = await PerfilEmpresa.count();
    if (total <= 1) {
      return res.status(400).json({ error: 'Debes mantener al menos un perfil de empresa activo.' });
    }

    await target.destroy();

    // Asegurar que quede algún perfil como activo
    const otro = await PerfilEmpresa.findOne({ order: [['updatedAt', 'DESC']] });
    if (otro) {
      await otro.update({ esActivo: true });
    }

    res.json({ ok: true, nuevoActivo: otro });
  } catch (error) {
    console.error('Error DELETE /perfil/item:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener el perfil activo del usuario (o un perfil específico si se pasa ?perfilId=X)
router.get('/:usuarioId', async (req, res) => {
  try {
    const { perfilId } = req.query;

    let perfil = null;

    if (perfilId && !Number.isNaN(Number(perfilId))) {
      perfil = await PerfilEmpresa.findByPk(Number(perfilId));
    }

    if (!perfil) {
      perfil = await PerfilEmpresa.findOne({
        order: [['esActivo', 'DESC'], ['updatedAt', 'DESC']]
      });
    }

    if (!perfil) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    res.json(perfil);
  } catch (error) {
    console.error('Error GET /perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo perfil o actualizar perfil existente (soporta multi-perfil mediante body.id o body.crearNuevo)
router.post('/:usuarioId', async (req, res) => {
  try {
    const rawUserId = req.params.usuarioId;
    const usuarioId = (rawUserId && rawUserId !== 'undefined' && rawUserId !== 'null' && !Number.isNaN(Number(rawUserId)))
      ? Number(rawUserId)
      : 1;

    const { id, crearNuevo } = req.body;
    const payload = buildPayload(req.body);

    let perfil = null;

    if (crearNuevo) {
      // Desactivar anteriores y crear el nuevo como activo
      await PerfilEmpresa.update({ esActivo: false }, { where: {} });
      perfil = await PerfilEmpresa.create({
        usuarioId,
        ...payload,
        esActivo: true
      });
      return res.json(perfil);
    }

    if (id && !Number.isNaN(Number(id))) {
      perfil = await PerfilEmpresa.findByPk(Number(id));
    }

    if (!perfil) {
      perfil = await PerfilEmpresa.findOne({
        where: { usuarioId },
        order: [['esActivo', 'DESC'], ['updatedAt', 'DESC']]
      });
    }

    if (!perfil) {
      perfil = await PerfilEmpresa.findOne({
        order: [['esActivo', 'DESC'], ['updatedAt', 'DESC']]
      });
    }

    if (perfil) {
      await perfil.update(payload);
    } else {
      perfil = await PerfilEmpresa.create({
        usuarioId,
        ...payload,
        esActivo: true
      });
    }

    res.json(perfil);
  } catch (error) {
    console.error('Error POST /perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
